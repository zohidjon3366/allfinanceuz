"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_ROOT = path.resolve(process.env.DATA_DIR || path.join(ROOT, ".runtime-data"));
const NEWS_FILE = path.join(DATA_ROOT, "news.json");
const MEDIA_DIR = path.join(DATA_ROOT, "media");
const SEED_FILE = path.join(ROOT, "data", "news.json");
const MAX_JSON = 8 * 1024 * 1024;
const MIME = {
  ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg", ".webp":"image/webp", ".ico":"image/x-icon", ".xml":"application/xml; charset=utf-8",
  ".txt":"text/plain; charset=utf-8", ".pdf":"application/pdf"
};

function env(name, fallback="") { return String(process.env[name] || fallback).trim(); }
function safeJson(value, fallback=null) { try { return JSON.parse(value); } catch { return fallback; } }
function ensureStorage(){
  fs.mkdirSync(MEDIA_DIR,{recursive:true});
  if(!fs.existsSync(NEWS_FILE)){
    let seed=[];
    try{const parsed=safeJson(fs.readFileSync(SEED_FILE,"utf8"),[]);if(Array.isArray(parsed))seed=parsed;}catch{}
    atomicWriteJson(NEWS_FILE,seed);
  }
}
function atomicWriteJson(file,data){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const temp=`${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp,JSON.stringify(data,null,2),"utf8");
  fs.renameSync(temp,file);
}
function readNews(){ensureStorage();const parsed=safeJson(fs.readFileSync(NEWS_FILE,"utf8"),[]);return Array.isArray(parsed)?parsed:[];}
function writeNews(items){atomicWriteJson(NEWS_FILE,items);}
function cleanSlug(value){return String(value||"").toLowerCase().normalize("NFKD").replace(/[‘’']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120);}
function normalizePost(input,existing={}){
  const title=String(input.title||existing.title||"").trim();
  const date=input.published_at?new Date(input.published_at):new Date(existing.published_at||Date.now());
  return {
    ...existing,
    id:String(input.id||existing.id||crypto.randomUUID()),
    title,
    slug:cleanSlug(input.slug||existing.slug||title),
    category:String(input.category||existing.category||"Yangilik").trim().slice(0,80),
    excerpt:String(input.excerpt||existing.excerpt||"").trim().slice(0,600),
    content:String(input.content||existing.content||"").trim().slice(0,50000),
    image_file:String(existing.image_file||"").trim(),
    image_url:String(input.image_url||existing.image_url||"").trim().slice(0,2000),
    external_url:String(input.external_url||existing.external_url||"").trim().slice(0,2000),
    published:input.published===true||input.published==="true"||input.published==="on",
    published_at:Number.isNaN(date.getTime())?new Date().toISOString():date.toISOString(),
    created_at:existing.created_at||new Date().toISOString(),
    updated_at:new Date().toISOString()
  };
}
function publicPost(post){const item={...post};if(item.image_file)item.image_url=`/api/media/${encodeURIComponent(item.image_file)}`;delete item.image_file;return item;}
function sortedNews(items){return [...items].sort((a,b)=>String(b.published_at||"").localeCompare(String(a.published_at||"")));}
function listNews({publishedOnly=true,limit=100}={}){let items=readNews();if(publishedOnly)items=items.filter(x=>x.published!==false);return sortedNews(items).slice(0,limit).map(publicPost);}
function findNews(slug){const item=readNews().find(x=>x.slug===slug);return item?publicPost(item):null;}
function parseImageData(dataUrl,slug){
  const match=/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl||""));
  if(!match)return null;
  const buffer=Buffer.from(match[3],"base64");if(buffer.length>3*1024*1024)throw new Error("Rasm 3 MB dan oshmasligi kerak");
  const ext=match[2]==="jpeg"?"jpg":match[2];return {buffer,filename:`${slug}-${Date.now()}.${ext}`};
}
function removeMedia(filename){if(!filename)return;const safe=path.basename(filename);const file=path.join(MEDIA_DIR,safe);try{if(fs.existsSync(file))fs.unlinkSync(file);}catch{}}
function parseCookies(req){const out={};String(req.headers.cookie||"").split(";").forEach(pair=>{const i=pair.indexOf("=");if(i>0)out[pair.slice(0,i).trim()]=decodeURIComponent(pair.slice(i+1).trim());});return out;}
function timingSafeEqual(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function sessionSecret(){return env("ADMIN_SESSION_SECRET")||env("ADMIN_PASSWORD")||"change-this-secret";}
function createSessionToken(){const expires=Date.now()+12*60*60*1000,payload=String(expires),sig=crypto.createHmac("sha256",sessionSecret()).update(payload).digest("hex");return Buffer.from(`${payload}.${sig}`).toString("base64url");}
function validSession(token){try{const [expires,sig]=Buffer.from(String(token),"base64url").toString("utf8").split(".");if(!expires||Number(expires)<Date.now())return false;const expected=crypto.createHmac("sha256",sessionSecret()).update(expires).digest("hex");return timingSafeEqual(sig,expected);}catch{return false;}}
function isAdmin(req){return validSession(parseCookies(req).af_admin);}
function isPersistent(){return Boolean(process.env.DATA_DIR)&&DATA_ROOT.startsWith("/var/data");}

function send(res,status,body,type="application/json; charset=utf-8",headers={}){const data=Buffer.isBuffer(body)?body:Buffer.from(type.includes("json")?JSON.stringify(body):String(body));res.writeHead(status,{"Content-Type":type,"Content-Length":data.length,"X-Content-Type-Options":"nosniff",...headers});res.end(data);}
function json(res,status,obj,headers={}){send(res,status,obj,"application/json; charset=utf-8",headers);}
async function readBody(req,limit=MAX_JSON){return await new Promise((resolve,reject)=>{let size=0,chunks=[];req.on("data",chunk=>{size+=chunk.length;if(size>limit){reject(new Error("So‘rov hajmi juda katta"));req.destroy();return;}chunks.push(chunk);});req.on("end",()=>{const raw=Buffer.concat(chunks).toString("utf8");resolve(raw?safeJson(raw,{}):{});});req.on("error",reject);});}
function secureCookie(req){return req.headers["x-forwarded-proto"]==="https"||Boolean(req.socket.encrypted);}
function safeFilePath(urlPath){let decoded;try{decoded=decodeURIComponent(urlPath);}catch{return null;}const rel=decoded.replace(/^\/+/,"");const full=path.resolve(ROOT,rel||"index.html");if(!full.startsWith(path.resolve(ROOT)+path.sep)&&full!==path.resolve(ROOT,"index.html"))return null;return full;}
function serveStatic(req,res,pathname){let file=safeFilePath(pathname);if(!file)return send(res,403,"Forbidden","text/plain; charset=utf-8");try{if(fs.statSync(file).isDirectory())file=path.join(file,"index.html");}catch{}if(!path.extname(file)){const html=`${file}.html`;if(fs.existsSync(html))file=html;}if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(ROOT,"404.html");const ext=path.extname(file).toLowerCase(),type=MIME[ext]||"application/octet-stream";const headers=ext===".html"?{"Cache-Control":"no-cache"}:{"Cache-Control":"public, max-age=3600"};send(res,file.endsWith("404.html")?404:200,fs.readFileSync(file),type,headers);}
function xmlEscape(v){return String(v||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
let writeQueue=Promise.resolve();function queued(task){const next=writeQueue.then(task,task);writeQueue=next.catch(()=>{});return next;}

async function handle(req,res){
  const url=new URL(req.url,`http://${req.headers.host||"localhost"}`),p=url.pathname;
  if(p==="/health"&&req.method==="GET")return json(res,200,{ok:true,service:"allfinanceuz",storage:isPersistent()?"render-disk":"ephemeral",dataDir:DATA_ROOT});
  if(p==="/api/lead"&&req.method==="POST"){
    const token=env("TELEGRAM_BOT_TOKEN"),chatId=env("TELEGRAM_CHAT_ID");if(!token||!chatId)return json(res,503,{ok:false,message:"Telegram sozlanmagan"});
    const d=await readBody(req);const message=["🔔 Yangi murojaat — ALL FINANCE","",`Ism: ${d.name||"-"}`,`Telefon: ${d.phone||"-"}`,`Korxona: ${d.company||"-"}`,`Xizmat: ${d.service||"-"}`,`Izoh: ${d.comment||"-"}`,`Sana: ${new Date().toLocaleString("ru-RU")}`].join("\n");
    try{const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text:message})});const data=await r.json().catch(()=>({}));return json(res,r.ok&&data.ok?200:502,{ok:Boolean(r.ok&&data.ok)});}catch{return json(res,502,{ok:false,message:"Telegramga yuborilmadi"});}
  }
  if(p==="/api/news"&&req.method==="GET")return json(res,200,{ok:true,source:"render-disk",items:listNews({limit:Math.max(1,Math.min(Number(url.searchParams.get("limit")||100),100))})});
  if(p.startsWith("/api/news/")&&req.method==="GET"){const item=findNews(cleanSlug(p.slice(10)));if(!item||item.published===false)return json(res,404,{ok:false,message:"Yangilik topilmadi"});return json(res,200,{ok:true,item});}
  if(p.startsWith("/api/media/")&&req.method==="GET"){
    const filename=path.basename(decodeURIComponent(p.slice(11)));const file=path.join(MEDIA_DIR,filename);if(!fs.existsSync(file)||!fs.statSync(file).isFile())return json(res,404,{ok:false});const type=MIME[path.extname(file).toLowerCase()]||"application/octet-stream";return send(res,200,fs.readFileSync(file),type,{"Cache-Control":"public, max-age=86400"});
  }
  if(p==="/api/admin/login"&&req.method==="POST"){const d=await readBody(req),configured=env("ADMIN_PASSWORD");if(!configured)return json(res,503,{ok:false,message:"ADMIN_PASSWORD sozlanmagan"});if(!timingSafeEqual(d.password||"",configured))return json(res,401,{ok:false,message:"Parol noto‘g‘ri"});const cookie=`af_admin=${createSessionToken()}; HttpOnly; ${secureCookie(req)?"Secure; ":""}SameSite=Strict; Path=/; Max-Age=43200`;return json(res,200,{ok:true},{"Set-Cookie":cookie});}
  if(p==="/api/admin/logout"&&req.method==="POST"){const cookie=`af_admin=; HttpOnly; ${secureCookie(req)?"Secure; ":""}SameSite=Strict; Path=/; Max-Age=0`;return json(res,200,{ok:true},{"Set-Cookie":cookie});}
  if(p.startsWith("/api/admin/")&&!isAdmin(req))return json(res,401,{ok:false,message:"Avtorizatsiya talab qilinadi"});
  if(p==="/api/admin/status"&&req.method==="GET")return json(res,200,{ok:true,persistent:isPersistent(),storage:isPersistent()?"Render Persistent Disk":"Vaqtinchalik lokal xotira",dataDir:DATA_ROOT});
  if(p==="/api/admin/news"&&req.method==="GET")return json(res,200,{ok:true,persistent:isPersistent(),items:listNews({publishedOnly:false,limit:200})});
  if(p==="/api/admin/backup"&&req.method==="GET")return send(res,200,Buffer.from(JSON.stringify(readNews(),null,2)),"application/json; charset=utf-8",{"Content-Disposition":`attachment; filename="allfinance-news-${new Date().toISOString().slice(0,10)}.json"`});
  if(p==="/api/admin/news"&&req.method==="POST"){
    const d=await readBody(req);return await queued(async()=>{let items=readNews();const index=items.findIndex(x=>String(x.id)===String(d.id));const existing=index>=0?items[index]:{};const post=normalizePost(d,existing);if(!post.title||!post.slug||!post.content)return json(res,400,{ok:false,message:"Sarlavha, URL va maqola matni majburiy"});const duplicate=items.find(x=>x.slug===post.slug&&String(x.id)!==String(post.id));if(duplicate)return json(res,409,{ok:false,message:"Bu URL nomi boshqa maqolada mavjud"});const image=parseImageData(d.image_data_url,post.slug);if(image){fs.writeFileSync(path.join(MEDIA_DIR,image.filename),image.buffer);removeMedia(existing.image_file);post.image_file=image.filename;post.image_url="";}if(index>=0)items[index]=post;else items.push(post);writeNews(items);return json(res,200,{ok:true,item:publicPost(post)});});
  }
  if(p.startsWith("/api/admin/news/")&&req.method==="DELETE"){
    const id=decodeURIComponent(p.slice(16));return await queued(async()=>{let items=readNews();const item=items.find(x=>String(x.id)===id);items=items.filter(x=>String(x.id)!==id);if(item)removeMedia(item.image_file);writeNews(items);return json(res,200,{ok:true});});
  }
  if(p==="/news-sitemap.xml"&&req.method==="GET"){const items=listNews({limit:200}),base=`https://${req.headers.host}`;const rows=items.map(x=>`<url><loc>${base}${x.external_url||`/maqola.html?slug=${encodeURIComponent(x.slug)}`}</loc><lastmod>${new Date(x.updated_at||x.published_at||Date.now()).toISOString()}</lastmod></url>`).join("");return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows}</urlset>`,"application/xml; charset=utf-8");}
  if(p==="/rss.xml"&&req.method==="GET"){const items=listNews({limit:50}),base=`https://${req.headers.host}`;const rows=items.map(x=>`<item><title>${xmlEscape(x.title)}</title><link>${base}${x.external_url||`/maqola.html?slug=${encodeURIComponent(x.slug)}`}</link><guid>${base}${x.external_url||`/maqola.html?slug=${encodeURIComponent(x.slug)}`}</guid><pubDate>${new Date(x.published_at).toUTCString()}</pubDate><description>${xmlEscape(x.excerpt)}</description></item>`).join("");return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>ALL FINANCE yangiliklari</title><link>${base}/yangiliklar.html</link><description>Soliq, buxgalteriya, audit va 1C bo‘yicha maqolalar</description>${rows}</channel></rss>`,"application/rss+xml; charset=utf-8");}
  return serveStatic(req,res,p);
}

ensureStorage();
const server=http.createServer((req,res)=>{handle(req,res).catch(error=>{console.error("Unhandled",error);if(!res.headersSent)json(res,500,{ok:false,message:"Server xatosi"});else res.end();});});
server.listen(PORT,"0.0.0.0",()=>console.log(`ALL FINANCE server ${PORT} portda ishga tushdi; storage=${DATA_ROOT}; persistent=${isPersistent()}`));
server.on("error",error=>{console.error(error);process.exit(1);});
process.on("SIGTERM",()=>server.close(()=>process.exit(0)));
