(function(){
 const money = n => Math.round(n/50000)*50000;
 function calc(){
   const tax=document.getElementById('taxType'), emp=document.getElementById('employees'), inv=document.getElementById('invoices'), bank=document.getElementById('bankOps'), ie=document.getElementById('importExport'), out=document.getElementById('calcPrice');
   if(!out) return;
   const bases={turnover:1500000,vat:2400000,profit:2900000,fixed:1300000};
   let price=(bases[tax?.value]||1500000)+(Number(emp?.value)||0)*85000+(Number(inv?.value)||0)*9000+(Number(bank?.value)||0)*6000+(ie?.checked?900000:0);
   out.textContent=money(price).toLocaleString('ru-RU').replace(/,/g,' ')+' so‘m';
 }
 ['taxType','employees','invoices','bankOps','importExport'].forEach(id=>document.getElementById(id)?.addEventListener('input',calc)); calc();
 document.querySelectorAll('.faq-q').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.1});document.querySelectorAll('.reveal').forEach(e=>io.observe(e));
 document.querySelectorAll('[data-counter]').forEach(el=>{
   const target = Number(el.dataset.counter || 0);
   const suffix = el.dataset.suffix || '';
   let current = 0; const step = Math.max(1, Math.ceil(target / 40));
   const run = () => { current += step; if(current >= target){ el.textContent = target.toLocaleString('ru-RU').replace(/,/g,' ') + suffix; return; } el.textContent = current.toLocaleString('ru-RU').replace(/,/g,' ') + suffix; requestAnimationFrame(run); };
   const counterIo=new IntersectionObserver((entries)=>entries.forEach(entry=>{if(entry.isIntersecting){run(); counterIo.disconnect();}}),{threshold:.4}); counterIo.observe(el);
 });

 async function postLead(data){
   const cfg = window.AF_CONFIG || {};
   const endpoints = [cfg.leadWebhookUrl, cfg.googleSheetsWebhookUrl, cfg.crmWebhookUrl].filter(Boolean);
   for(const url of endpoints){
     try{ await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); }catch(e){}
   }
 }
 async function sendToTelegramBot(payload){
   try{
     const res = await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
     const data = await res.json().catch(()=>({ok:false}));
     return !!data.ok;
   }catch(e){ return false; }
 }
 const f=document.getElementById('consultForm');
 f?.addEventListener('submit', async e=>{
   e.preventDefault();
   const fd=new FormData(f), c=window.AF_CONFIG||{};
   const payload={
    source:'website',
    date:new Date().toISOString(),
    name:fd.get('name')||'',
    phone:fd.get('phone')||'',
    company:fd.get('company')||'',
    service:fd.get('service')||'',
    comment:fd.get('comment')||''
   };
   await postLead(payload);
   const msg=document.getElementById('formMessage');
   const sent = await sendToTelegramBot(payload);
   if(sent){
     msg && (msg.textContent = 'Murojaat yuborildi. Tez orada siz bilan bog‘lanamiz.');
     msg?.classList.add('show');
   }else{
     const txt=`Assalomu alaykum, ALL FINANCE!%0A%0AIsm: ${encodeURIComponent(payload.name)}%0ATelefon: ${encodeURIComponent(payload.phone)}%0AKorxona: ${encodeURIComponent(payload.company)}%0AXizmat: ${encodeURIComponent(payload.service)}%0AIzoh: ${encodeURIComponent(payload.comment)}`;
     msg && (msg.textContent = 'Telegram bot sozlanmagani sababli Telegram oynasi ochildi.');
     msg?.classList.add('show');
     if(c.telegramUrl) window.open(`${c.telegramUrl}?text=${txt}`,'_blank');
   }
   f.reset();
   calc();
 });
})();