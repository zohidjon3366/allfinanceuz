const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'server.js',
  'package.json',
  'index.html',
  'xizmatlar.html',
  'team.html',
  'narxlar.html',
  'yangiliklar.html',
  'maqola.html',
  'assets/css/style.css',
  'assets/js/site.js',
  'assets/js/news-client.js',
  'assets/img/logo-horizontal.png',
  'data/news.json'
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
  console.error('INVALID JSON: data/news.json');
  failed = true;
}

if (failed) process.exit(1);
console.log('Build verification completed successfully.');
