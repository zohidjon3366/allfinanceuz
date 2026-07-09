
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
 const f=document.getElementById('consultForm');f?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(f), c=window.AF_CONFIG||{};const txt=`Assalomu alaykum, ALL FINANCE!%0A%0AIsm: ${encodeURIComponent(fd.get('name')||'')}%0ATelefon: ${encodeURIComponent(fd.get('phone')||'')}%0AKorxona: ${encodeURIComponent(fd.get('company')||'')}%0AXizmat: ${encodeURIComponent(fd.get('service')||'')}%0AIzoh: ${encodeURIComponent(fd.get('comment')||'')}`;document.getElementById('formMessage')?.classList.add('show');window.open(`${c.telegramUrl}?text=${txt}`,'_blank')});
})();
