import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const catalog = JSON.parse(fs.readFileSync('survey/src/data/cubs-store-catalog.json', 'utf8'));
assert(catalog.products.length > 0, 'Catalog must contain real Cubs products');
assert.equal(new Set(catalog.products.map(p => p.id)).size, catalog.products.length);
assert.equal(catalog.catalogProductCount, catalog.products.length);
for (const product of catalog.products) {
  assert(product.name && product.image && product.sourceUrl, `Missing product data: ${product.id}`);
  assert(new URL(product.sourceUrl).hostname.endsWith('mlbshop.com'));
  assert(product.price > 0, `Invalid price: ${product.id}`);
  assert(product.sizes.length > 0, `Missing selection options: ${product.id}`);
}
for (const category of catalog.mainCategories) {
  assert(catalog.products.some(product => product.categories.includes(category.id)), `Empty category: ${category.id}`);
}
for (const department of catalog.departments) {
  assert.equal(department.count, catalog.products.filter(product => product.departments.includes(department.id)).length, `Incorrect department count: ${department.id}`);
}
const files = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir,entry.name); if(entry.isDirectory())walk(file); else files.push(file); } }
walk('dist');
for(const file of files.filter(file => /\.(html|js|css)$/.test(file))) {
  const text = fs.readFileSync(file,'utf8');
  assert(!/kraken|climate.?pledge|seattlehockeyteamstore|isaacsharrison/i.test(text), `Old branding or personal URL: ${file}`);
}
for(const route of ['survey','dashboard']) {
  const file = `dist/${route}/index.html`;
  const html = fs.readFileSync(file,'utf8');
  assert(html.includes('Chicago Cubs'));
  for(const match of html.matchAll(/(?:src|href)="(\.\/assets\/[^"?#]+)/g)) {
    assert(fs.existsSync(path.resolve(path.dirname(file),match[1])), `Missing build asset ${match[1]}`);
  }
}
assert(fs.readFileSync('survey/src/app/App.tsx','utf8').includes('Step up to the plate. #THIS'));
console.log(`Verified both routes, Cubs branding, asset references, and ${catalog.products.length} merchandise records.`);
