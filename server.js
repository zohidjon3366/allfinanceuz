"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const LOCAL_NEWS_FILE = path.join(ROOT, "data", "news.json");
const MAX_JSON = 8 * 1024 * 1024;
const MIME = {
  ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg", ".webp":"image/webp", ".ico":"image/x-icon", ".xml":"application/xml; charset=utf-8",
  ".txt":"text/plain; charset=utf-8", ".pdf":"application/pdf"
};

function env(name, fallback="") { return String(process.env[name] || fallback).trim(); }
function safeJson(value, fallback=null) { try { return JSON.parse(value); } catch { return fallback; } }
function cleanSlug(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[‘’']/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
function normalizePost(input) {
  const title = String(input.title || "").trim();
  return {
    id: String(input.id || crypto.randomUUID()), title, slug: cleanSlug(input.slug || title),
    category: String(input.category || "Yangilik").trim().slice(0, 80),
    excerpt: String(input.excerpt || "").trim().slice(0, 600),
    content: String(input.content || "").trim().slice(0, 50000),
    image_url: String(input.image_url || "").trim().slice(0, 2000),
    image_path: String(input.image_path || "").trim().slice(0, 500),
    external_url: String(input.external_url || "").trim().slice(0, 2000),
    published: input.published === true || input.published === "true" || input.published === "on",
    published_at: input.published_at ? new Date(input.published_at).toISOString() : new Date().toISOString(),
    created_at: input.created_at || new Date().toISOString(), updated_at: new Date().toISOString()
  };
}
function publicPost(post) {
  const item = { ...post };
  if (item.image_path) item.image_url = `/api/media/${item.image_path.split("/").map(encodeURIComponent).join("/")}`;
  return item;
}
function readLocalNews() {
  try { const data=safeJson(fs.readFileSync(LOCAL_NEWS_FILE,"utf8"),[]); return Array.isArray(data)?data:[]; }
  catch { return []; }
}

function githubConfig() {
  return {
    token: env("GITHUB_TOKEN"), owner: env("GITHUB_OWNER", "zohidjon3366"),
    repo: env("GITHUB_REPO", "allfinanceuz"), branch: env("GITHUB_BRANCH", "main"),
    dataPath: env("GITHUB_NEWS_DATA_PATH", "data/news.json"), imageDir: env("GITHUB_NEWS_IMAGE_DIR", "assets/news")
  };
}
function githubConfigured() { const c=githubConfig(); return Boolean(c.token && c.owner && c.repo); }
async function ghRequest(method, apiPath, body) {
  const c=githubConfig();
  const response = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: { "Accept":"application/vnd.github+json", "Authorization":`Bearer ${c.token}`,
      "X-GitHub-Api-Version":"2022-11-28", "User-Agent":"allfinanceuz-cms",
      ...(body ? {"Content-Type":"application/json"} : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const raw=await response.text(); const data=raw?safeJson(raw,{message:raw}):null;
  if (!response.ok) { const error=new Error(data?.message || `GitHub API xatosi: ${response.status}`); error.status=response.status; error.detail=data; throw error; }
  return data;
}
function ghContentPath(filePath) {
  const c=githubConfig();
  return `/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${filePath.split("/").map(encodeURIComponent).join("/")}`;
}
async function ghGetFile(filePath) {
  const c=githubConfig();
  try {
    const data=await ghRequest("GET", `${ghContentPath(filePath)}?ref=${encodeURIComponent(c.branch)}`);
    return { buffer:Buffer.from(String(data.content||"").replace(/\n/g,""),"base64"), sha:data.sha, path:data.path };
  } catch (error) { if(error.status===404) return null; throw error; }
}
async function ghPutFile(filePath, buffer, message) {
  const c=githubConfig(); const current=await ghGetFile(filePath);
  return ghRequest("PUT", ghContentPath(filePath), { message, content:Buffer.from(buffer).toString("base64"), branch:c.branch, ...(current?.sha?{sha:current.sha}:{}) });
}
async function ghDeleteFile(filePath, message) {
  const c=githubConfig(); const current=await ghGetFile(filePath); if(!current) return;
  await ghRequest("DELETE", ghContentPath(filePath), { message, sha:current.sha, branch:c.branch });
}
let newsCache={items:null, expires:0};
let writeQueue=Promise.resolve();
function queueWrite(task){ const run=writeQueue.then(task,task); writeQueue=run.catch(()=>{}); return run; }
async function readGitHubNews(force=false) {
  if(!force && newsCache.items && Date.now()<newsCache.expires) return newsCache.items;
  if(!githubConfigured()) return readLocalNews();
  const c=githubConfig(); const file=await ghGetFile(c.dataPath);
  const items=file?safeJson(file.buffer.toString("utf8"),[]):readLocalNews();
  const list=Array.isArray(items)?items:[]; newsCache={items:list,expires:Date.now()+15000}; return list;
}
async function writeGitHubNews(items, message) {
  if(!githubConfigured()) throw new Error("GitHub CMS sozlanmagan");
  const c=githubConfig(); await ghPutFile(c.dataPath, Buffer.from(JSON.stringify(items,null,2)+"\n","utf8"), message);
  newsCache={items,expires:Date.now()+15000};
}
async function listNews({publishedOnly=true,limit=100}={}) {
  const items=await readGitHubNews();
  return items.filter(x=>!publishedOnly||x.published).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at))).slice(0,limit).map(publicPost);
}
async function findNews(slug) { const items=await readGitHubNews(); const item=items.find(x=>x.slug===slug)||null; return item?publicPost(item):null; }
function parseImageData(dataUrl,slug) {
  if(!dataUrl) return null;
  const m=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if(!m) throw new Error("Rasm formati noto‘g‘ri. PNG, JPG yoki WEBP ishlating");
  const buffer=Buffer.from(m[2],"base64"); if(buffer.length>3*1024*1024) throw new Error("Rasm hajmi 3 MB dan oshmasligi kerak");
  const ext=m[1]==="image/jpeg"?"jpg":m[1].split("/")[1];
  const c=githubConfig(); return { buffer, path:`${c.imageDir}/${Date.now()}-${cleanSlug(slug)||"yangilik"}.${ext}` };
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie||"").split(";").map(x=>x.trim()).filter(Boolean).map(pair=>{const i=pair.indexOf("=");return [decodeURIComponent(pair.slice(0,i)),decodeURIComponent(pair.slice(i+1))];}));
}
function timingSafeEqual(a,b){const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function sessionSecret(){return env("ADMIN_SESSION_SECRET")||env("ADMIN_PASSWORD")||"change-this-secret";}
function createSessionToken(){const expires=Date.now()+12*60*60*1000,payload=String(expires),sig=crypto.createHmac("sha256",sessionSecret()).update(payload).digest("hex");return Buffer.from(`${payload}.${sig}`).toString("base64url");}
function validSession(token){try{const [expires,sig]=Buffer.from(String(token),"base64url").toString("utf8").split(".");if(!expires||Number(expires)<Date.now())return false;const expected=crypto.createHmac("sha256",sessionSecret()).update(expires).digest("hex");return timingSafeEqual(sig,expected);}catch{return false;}}
function isAdmin(req){return validSession(parseCookies(req).af_admin);}

function send(res,status,body,type="application/json; charset=utf-8",headers={}){
  const data=Buffer.isBuffer(body)?body:Buffer.from(type.includes("json")?JSON.stringify(body):String(body));
  res.writeHead(status,{"Content-Type":type,"Content-Length":data.length,"X-Content-Type-Options":"nosniff",...headers});res.end(data);
}
function json(res,status,obj,headers={}){send(res,status,obj,"application/json; charset=utf-8",headers);}
async function readBody(req,limit=MAX_JSON){return await new Promise((resolve,reject)=>{let size=0,chunks=[];req.on("data",c=>{size+=c.length;if(size>limit){reject(new Error("So‘rov hajmi juda katta"));req.destroy();return;}chunks.push(c);});req.on("end",()=>{const raw=Buffer.concat(chunks).toString("utf8");resolve(raw?safeJson(raw,{}):{});});req.on("error",reject);});}
function secureCookie(req){return req.headers["x-forwarded-proto"]==="https"||Boolean(req.socket.encrypted);}
function safeFilePath(urlPath){let decoded;try{decoded=decodeURIComponent(urlPath);}catch{return null;}const rel=decoded.replace(/^\/+/,"");const full=path.resolve(ROOT,rel||"index.html");if(!full.startsWith(path.resolve(ROOT)+path.sep)&&full!==path.resolve(ROOT,"index.html"))return null;return full;}
function serveStatic(req,res,pathname){let file=safeFilePath(pathname);if(!file)return send(res,403,"Forbidden","text/plain; charset=utf-8");try{if(fs.statSync(file).isDirectory())file=path.join(file,"index.html");}catch{}
  if(!path.extname(file)) { const html=`${file}.html`; if(fs.existsSync(html)) file=html; }
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()) file=path.join(ROOT,"404.html");
  const ext=path.extname(file).toLowerCase(),type=MIME[ext]||"application/octet-stream";
  const headers=ext===".html"?{"Cache-Control":"no-cache"}:{"Cache-Control":"public, max-age=3600"};
  send(res,file.endsWith("404.html")?404:200,fs.readFileSync(file),type,headers);
}
function xmlEscape(v){return String(v||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

async function handle(req,res){
  const url=new URL(req.url,`http://${req.headers.host||"localhost"}`), p=url.pathname;
  if(p==="/health"&&req.method==="GET") return json(res,200,{ok:true,service:"allfinanceuz",cms:githubConfigured()?"github":"local-readonly"});
  if(p==="/api/lead"&&req.method==="POST"){
    const token=env("TELEGRAM_BOT_TOKEN"),chatId=env("TELEGRAM_CHAT_ID");if(!token||!chatId)return json(res,503,{ok:false,message:"Telegram sozlanmagan"});
    const d=await readBody(req);const message=["🔔 Yangi murojaat — ALL FINANCE","",`Ism: ${d.name||"-"}`,`Telefon: ${d.phone||"-"}`,`Korxona: ${d.company||"-"}`,`Xizmat: ${d.service||"-"}`,`Izoh: ${d.comment||"-"}`,`Sana: ${new Date().toLocaleString("ru-RU")}`].join("\n");
    try{const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text:message})});const data=await r.json().catch(()=>({}));return json(res,r.ok&&data.ok?200:502,{ok:Boolean(r.ok&&data.ok)});}catch{return json(res,502,{ok:false,message:"Telegramga yuborilmadi"});}
  }
  if(p==="/api/news"&&req.method==="GET") {try{return json(res,200,{ok:true,source:githubConfigured()?"github":"local",items:await listNews({limit:Math.max(1,Math.min(Number(url.searchParams.get("limit")||100),100))})});}catch(e){console.error(e);return json(res,500,{ok:false,message:"Yangiliklarni yuklab bo‘lmadi"});}}
  if(p.startsWith("/api/news/")&&req.method==="GET") {try{const item=await findNews(cleanSlug(p.slice(10)));if(!item||item.published===false)return json(res,404,{ok:false,message:"Yangilik topilmadi"});return json(res,200,{ok:true,item});}catch{return json(res,500,{ok:false,message:"Yangilikni yuklab bo‘lmadi"});}}
  if(p.startsWith("/api/media/")&&req.method==="GET") {if(!githubConfigured())return json(res,404,{ok:false});try{const filePath=p.slice(11).split("/").map(decodeURIComponent).join("/");const file=await ghGetFile(filePath);if(!file)return json(res,404,{ok:false});const type=MIME[path.extname(filePath).toLowerCase()]||"application/octet-stream";return send(res,200,file.buffer,type,{"Cache-Control":"public, max-age=86400"});}catch{return json(res,404,{ok:false});}}
  if(p==="/api/admin/login"&&req.method==="POST") {const d=await readBody(req),configured=env("ADMIN_PASSWORD");if(!configured)return json(res,503,{ok:false,message:"ADMIN_PASSWORD sozlanmagan"});if(!timingSafeEqual(d.password||"",configured))return json(res,401,{ok:false,message:"Parol noto‘g‘ri"});const cookie=`af_admin=${createSessionToken()}; HttpOnly; ${secureCookie(req)?"Secure; ":""}SameSite=Strict; Path=/; Max-Age=43200`;return json(res,200,{ok:true},{"Set-Cookie":cookie});}
  if(p==="/api/admin/logout"&&req.method==="POST") {const cookie=`af_admin=; HttpOnly; ${secureCookie(req)?"Secure; ":""}SameSite=Strict; Path=/; Max-Age=0`;return json(res,200,{ok:true},{"Set-Cookie":cookie});}
  if(p.startsWith("/api/admin/")&&!isAdmin(req)) return json(res,401,{ok:false,message:"Avtorizatsiya talab qilinadi"});
  if(p==="/api/admin/status"&&req.method==="GET") return json(res,200,{ok:true,persistent:githubConfigured(),storage:githubConfigured()?"GitHub":"local-readonly"});
  if(p==="/api/admin/news"&&req.method==="GET") {try{return json(res,200,{ok:true,persistent:githubConfigured(),items:await listNews({publishedOnly:false,limit:200})});}catch(e){return json(res,500,{ok:false,message:e.message});}}
  if(p==="/api/admin/news"&&req.method==="POST") {
    if(!githubConfigured())return json(res,503,{ok:false,message:"GitHub CMS sozlanmagan. Render Environment qiymatlarini kiriting"});
    try{const d=await readBody(req);return await queueWrite(async()=>{let items=await readGitHubNews(true);const existing=items.find(x=>String(x.id)===String(d.id))||null;const post=normalizePost({...existing,...d});if(!post.title||!post.slug||!post.content)return json(res,400,{ok:false,message:"Sarlavha, URL va maqola matni majburiy"});const image=parseImageData(d.image_data_url,post.slug);if(image){await ghPutFile(image.path,image.buffer,`CMS: ${post.title} rasmi`);post.image_path=image.path;post.image_url="";}const duplicate=items.find(x=>x.slug===post.slug&&String(x.id)!==String(post.id));if(duplicate)return json(res,409,{ok:false,message:"Bu URL nomi boshqa maqolada mavjud"});const i=items.findIndex(x=>String(x.id)===String(post.id));if(i>=0)items[i]=post;else items.push(post);await writeGitHubNews(items,`CMS: ${i>=0?"yangilandi":"qo‘shildi"} — ${post.title}`);return json(res,200,{ok:true,item:publicPost(post)});});}catch(e){console.error("CMS save",e.detail||e);return json(res,e.status||500,{ok:false,message:e.message});}
  }
  if(p.startsWith("/api/admin/news/")&&req.method==="DELETE") {
    if(!githubConfigured())return json(res,503,{ok:false,message:"GitHub CMS sozlanmagan"});
    try{const id=decodeURIComponent(p.slice(16));return await queueWrite(async()=>{let items=await readGitHubNews(true);const item=items.find(x=>String(x.id)===id);items=items.filter(x=>String(x.id)!==id);await writeGitHubNews(items,`CMS: yangilik o‘chirildi — ${item?.title||id}`);if(item?.image_path)ghDeleteFile(item.image_path,`CMS: rasm o‘chirildi — ${item.title}`).catch(()=>{});return json(res,200,{ok:true});});}catch(e){return json(res,500,{ok:false,message:e.message});}
  }
  if(p==="/news-sitemap.xml"&&req.method==="GET") {try{const items=await listNews({limit:200}),base=`https://${req.headers.host}`;const rows=items.map(x=>`<url><loc>${base}${x.external_url||`/maqola.html?slug=${encodeURIComponent(x.slug)}`}</loc><lastmod>${new Date(x.updated_at||x.published_at||Date.now()).toISOString()}</lastmod></url>`).join("");return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows}</urlset>`,"application/xml; charset=utf-8");}catch{return send(res,500,"Sitemap yaratilmadi","text/plain; charset=utf-8");}}
  if(p==="/rss.xml"&&req.method==="GET") {try{const items=await listNews({limit:50}),base=`https://${req.headers.host}`;const rows=items.map(x=>`<item><title>${xmlEscape(x.title)}</title><link>${base}${x.external_url||`/maqola.html?slug=${encodeURIComponent(x.slug)}`}</link><guid>${base}${x.external_url||`/maqola.html?slug=${encodeURIComponent(x.slug)}`}</guid><pubDate>${new Date(x.published_at).toUTCString()}</pubDate><description>${xmlEscape(x.excerpt)}</description></item>`).join("");return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>ALL FINANCE yangiliklari</title><link>${base}/yangiliklar.html</link><description>Soliq, buxgalteriya, audit va 1C bo‘yicha maqolalar</description>${rows}</channel></rss>`,"application/rss+xml; charset=utf-8");}catch{return send(res,500,"RSS yaratilmadi","text/plain; charset=utf-8");}}
  return serveStatic(req,res,p);
}

const server=http.createServer((req,res)=>{handle(req,res).catch(error=>{console.error("Unhandled",error);if(!res.headersSent)json(res,500,{ok:false,message:"Server xatosi"});else res.end();});});
server.listen(PORT,"0.0.0.0",()=>console.log(`ALL FINANCE server ${PORT} portda ishga tushdi (GitHub CMS: ${githubConfigured()?"ON":"OFF"})`));
server.on("error",e=>{console.error(e);process.exit(1);});
process.on("SIGTERM",()=>server.close(()=>process.exit(0)));
