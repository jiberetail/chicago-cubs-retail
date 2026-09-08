import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('survey/src/data/cubs-store-catalog.json'));
const cache='.mlb-options-cache';
fs.mkdirSync(cache,{recursive:true});
const records=process.argv.includes('--refresh')?[]:catalog.products.filter(p=>fs.existsSync(`${cache}/${p.id}.json`)).map(p=>JSON.parse(fs.readFileSync(`${cache}/${p.id}.json`)));
const cached=new Set(records.map(r=>r.id));
let pending=catalog.products.filter(p=>!cached.has(p.id));
let blocked=false;
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
async function collect(p){
  const response=await fetch(p.sourceUrl.replaceAll('%2B','+'),{signal:AbortSignal.timeout(20000)});
  if(response.status===403)blocked=true;
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const html=await response.text();
  const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].startsWith('var __platform_data__='))?.[1];
  if(!script)throw new Error('No product data');
  const data=JSON.parse(script.slice('var __platform_data__='.length).replace(/;$/,''))['pdp-data']?.pdp;
  if(!data||(String(data.productId)!==p.id.replace('p-','')&&normalize(data.title)!==normalize(p.name)))throw new Error(`Product identity mismatch: ${data?.productId}`);
  if(!Array.isArray(data.sizes)||!data.sizes.length)throw new Error('No product variants');
  const variants=data.sizes.map(v=>({size:v.size?.trim()||'One Size',available:v.available===true,itemId:v.itemId}));
  return {id:p.id,productId:data.productId,sourceUrl:p.sourceUrl,retrievedAt:new Date().toISOString(),variants};
}
for(let pass=1;pass<=3&&pending.length&&!blocked;pass++){
  const jobs=pending;pending=[];let next=0,finished=0;
  async function worker(){while(next<jobs.length&&!blocked){const p=jobs[next++];try{const record=await collect(p);records.push(record);fs.writeFileSync(`${cache}/${p.id}.json`,JSON.stringify(record));}catch(e){pending.push(p);if(pass===3||blocked)console.log(JSON.stringify({id:p.id,error:e.message}));}finished++;if(finished%250===0)console.log(JSON.stringify({pass,finished,total:jobs.length,imported:records.length}));}}
  await Promise.all([worker(),worker()]);
  pending.push(...jobs.slice(next));
  fs.writeFileSync('mlb-options.json',JSON.stringify({records,missing:pending.map(p=>p.id)},null,2));
}
fs.writeFileSync('mlb-options.json',JSON.stringify({records,missing:pending.map(p=>p.id)},null,2));
console.log(JSON.stringify({complete:true,imported:records.length,missing:pending.length}));
if(pending.length)process.exitCode=1;
