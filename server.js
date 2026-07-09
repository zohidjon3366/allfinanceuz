
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const dataDir = path.join(__dirname,'data');
const requestsPath = path.join(dataDir,'consult-requests.json');
const newsPath = path.join(dataDir,'news.json');
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir,{recursive:true});
if(!fs.existsSync(requestsPath)) fs.writeFileSync(requestsPath,'[]','utf8');
function send(res, status, body, type='application/json; charset=utf-8'){res.writeHead(status,{'Content-Type':type});res.end(body)}
function serveFile(res,filePath,status=200){
  if(!fs.existsSync(filePath)){ return serveFile(res,path.join(__dirname,'404.html'),404); }
  const ext=path.extname(filePath).toLowerCase();
  send(res,status,fs.readFileSync(filePath),mime[ext]||'application/octet-stream');
}
async function handler(req,res){
  const url = new URL(req.url, `http://${req.headers.host}`);
  if(url.pathname === '/health') return send(res,200,JSON.stringify({ok:true}));
  if(url.pathname === '/api/news' && req.method === 'GET'){
    try{ return send(res,200,fs.readFileSync(newsPath,'utf8')); }catch{ return send(res,200,'[]'); }
  }
  if(url.pathname === '/api/consult' && req.method === 'POST'){
    let raw=''; req.on('data',c=>raw+=c); req.on('end', async ()=>{
      try{
        const data = JSON.parse(raw || '{}'); data.createdAt = new Date().toISOString();
        let arr=[]; try{arr=JSON.parse(fs.readFileSync(requestsPath,'utf8'));}catch{}
        arr.push(data); fs.writeFileSync(requestsPath,JSON.stringify(arr,null,2),'utf8');
        const token=process.env.TELEGRAM_BOT_TOKEN, chatId=process.env.TELEGRAM_CHAT_ID;
        if(token && chatId){
          const text=`📩 Yangi murojaat\n\n👤 Ism: ${data.name||'-'}\n📞 Telefon: ${data.phone||'-'}\n🏢 Korxona: ${data.company||'-'}\n🧾 Xizmat: ${data.service||'-'}\n💬 Izoh: ${data.comment||'-'}`;
          try{
            const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text})});
            if(!tg.ok) return send(res,500,JSON.stringify({message:'Telegramga yuborilmadi'}));
          }catch{return send(res,500,JSON.stringify({message:'Telegramga ulanishda xatolik'}));}
        }
        return send(res,200,JSON.stringify({ok:true}));
      }catch{ return send(res,400,JSON.stringify({message:'Noto‘g‘ri so‘rov'})); }
    });
    return;
  }
  const cleanPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const target = path.normalize(path.join(__dirname, cleanPath));
  if(!target.startsWith(__dirname)) return send(res,403,'Forbidden','text/plain; charset=utf-8');
  serveFile(res,target);
}
http.createServer(handler).listen(PORT,()=>console.log('ALL FINANCE running on',PORT));
