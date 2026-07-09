const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const services = [
  'buxgalteriya-autsorsingi',
  'soliq-maslahatlari',
  'soliq-tekshiruvlarida-himoya',
  'buxgalteriya-hisobini-tiklash',
  'kadrlar-hisobi',
  'ichki-audit',
  'moliyaviy-hisobotlar',
  '1c-xizmatlari'
];
const required = [
  'server.js','package.json','index.html','xizmatlar.html','team.html','narxlar.html',
  'yangiliklar.html','maqola.html','assets/css/style.css','assets/js/site.js',
  'assets/js/news-client.js','assets/img/logo-horizontal.png','assets/img/office-section-bg.jpg',
  'assets/img/header-finance.jpg','data/news.json',
  ...services.map(slug => `services/${slug}.html`)
];
let failed = false;
for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${rel}`);
    failed = true;
  } else {
    console.log(`OK: ${rel}`);
  }
}
try {
  JSON.parse(fs.readFileSync(path.join(root, 'data/news.json'), 'utf8'));
  console.log('OK: data/news.json JSON');
} catch (error) {
  console.error('INVALID JSON: data/news.json', error.message);
  failed = true;
}
for (const page of ['index.html','xizmatlar.html']) {
  const html = fs.readFileSync(path.join(root,page),'utf8');
  const cards = (html.match(/class="service-card"/g) || []).length;
  if (cards !== 8) {
    console.error(`INVALID: ${page} must contain 8 service cards, found ${cards}`);
    failed = true;
  } else console.log(`OK: ${page} contains 8 service cards`);
  if (html.includes('services-toggle')) {
    console.error(`INVALID: old services toggle remains in ${page}`);
    failed = true;
  }
}
for (const slug of services) {
  const html = fs.readFileSync(path.join(root,`services/${slug}.html`),'utf8');
  for (const marker of ['service-scope-list','service-process-grid','deliver-grid','legal-grid']) {
    if (!html.includes(marker)) {
      console.error(`INVALID: services/${slug}.html missing ${marker}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log('Build verification completed successfully.');
