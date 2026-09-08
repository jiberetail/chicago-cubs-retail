import assert from 'node:assert/strict';
import fs from 'node:fs';
const input=process.argv[2];
assert(input,'Pass the collected mlb-options.json file.');
const {records,missing}=JSON.parse(fs.readFileSync(input));
assert.equal(missing.length,0,'Resolve every product before importing options.');
const file='survey/src/data/cubs-store-catalog.json';
const catalog=JSON.parse(fs.readFileSync(file));
const byId=new Map(records.map(r=>[r.id,r]));
assert.equal(byId.size,catalog.products.length,'Variant coverage must match the entire catalog.');
for(const product of catalog.products){
  const record=byId.get(product.id);
  assert(record?.variants.length,`No variants: ${product.id}`);
  const inventory={};
  for(const variant of record.variants){
    const size=/^(?:No Size|NS|OSFA|One Size Fits All|Default Title)$/i.test(variant.size)?'One Size':variant.size==='OSFM'?'One Size Fits Most':variant.size;
    assert(size&&!/confirm|request|enter|mlb shop/i.test(size),`Invalid option: ${product.id}`);
    inventory[size]=Math.max(inventory[size]||0,variant.available?1:0);
  }
  product.sizes=Object.keys(inventory);
  product.inventory=inventory;
  product.optionLabel=product.sizes.length===1&&product.sizes[0]==='One Size'?'Option':'Size';
}
catalog.optionsProductCount=byId.size;
catalog.optionsImportedAt=new Date().toISOString();
catalog.optionsSource='MLB Shop product variants; availability is an import-time snapshot.';
catalog.coverage='Imported official product listings and product options. Prices and availability may change.';
fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
console.log(`Imported options and availability for all ${byId.size} products.`);
