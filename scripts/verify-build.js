"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const required=["server.js","index.html","yangiliklar.html","maqola.html","admin/yangiliklar.html","assets/js/news-client.js","data/news.json"];
let failed=false;
for(const rel of required){const p=path.join(root,rel);if(!fs.existsSync(p)){console.error(`MISSING: ${rel}`);failed=true;}else console.log(`OK: ${rel}`);}
try{JSON.parse(fs.readFileSync(path.join(root,"data/news.json"),"utf8"));console.log("OK: data/news.json JSON");}catch(e){console.error("INVALID JSON: data/news.json",e.message);failed=true;}
if(failed)process.exit(1);console.log("Build verification completed. No npm install required.");
