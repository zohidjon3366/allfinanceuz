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
  'assets/js/news-client.js','assets/js/admin-news.js','assets/css/admin.css','admin/yangiliklar.html','assets/img/logo-horizontal.png','assets/img/office-section-bg.jpg',
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

const serverSource=fs.readFileSync(path.join(root,'server.js'),'utf8');
for(const marker of ['/api/admin/login','/api/admin/news','ADMIN_PASSWORD','ADMIN_SESSION_SECRET']){if(!serverSource.includes(marker)){console.error('INVALID: server.js missing '+marker);process.exit(1);}}
console.log('OK: password-protected news admin API');

['ru/index.html','en/index.html','zh/index.html','ru/xizmatlar.html','en/xizmatlar.html','zh/xizmatlar.html','ru/yangiliklar.html','en/yangiliklar.html','zh/yangiliklar.html','admin/yangiliklar.html',...services.map(s=>`zh/services/${s}.html`)].forEach(f=>{if(!fs.existsSync(path.join(root,f))){console.error('MISSING:',f);process.exitCode=1}else console.log('OK:',f)});


const languagePages=['index.html','ru/index.html','en/index.html','zh/index.html','xizmatlar.html','ru/xizmatlar.html','en/xizmatlar.html','zh/xizmatlar.html'];
for(const page of languagePages){
  const full=path.join(root,page);
  const html=fs.readFileSync(full,'utf8');
  const switchers=(html.match(/class="global-language-switcher"/g)||[]).length;
  const flags=(html.match(/assets\/img\/flags\/(uz|ru|en|zh)\.svg/g)||[]).length;
  if(switchers!==1||flags!==4){console.error(`INVALID LANGUAGE SWITCHER: ${page}; switchers=${switchers}; flags=${flags}`);process.exitCode=1}else console.log(`OK: ${page} has 4 visible language flags`);
}
for(const flag of ['uz','ru','en','zh']){const rel=`assets/img/flags/${flag}.svg`;if(!fs.existsSync(path.join(root,rel))){console.error('MISSING:',rel);process.exitCode=1}else console.log('OK:',rel)}
