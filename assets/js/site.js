
(function(){
  const qs=(s,p=document)=>p.querySelector(s), qsa=(s,p=document)=>[...p.querySelectorAll(s)];
  const menu=qs('#menuBtn'), nav=qs('#mainNav'), dd=qs('#serviceDropdown');
  const ddButton=dd?.querySelector('.services-toggle');
  menu?.addEventListener('click',event=>{event.stopPropagation();nav?.classList.toggle('open');});
  ddButton?.setAttribute('aria-expanded','false');
  ddButton?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();const opened=dd.classList.toggle('open');ddButton.setAttribute('aria-expanded',String(opened));});
  document.addEventListener('click',event=>{if(!event.target.closest('#serviceDropdown')){dd?.classList.remove('open');ddButton?.setAttribute('aria-expanded','false');}if(nav && !event.target.closest('.nav-wrap'))nav.classList.remove('open');});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){dd?.classList.remove('open');nav?.classList.remove('open');ddButton?.setAttribute('aria-expanded','false');}});
  qsa('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const form=qs('#consultForm');
  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=qs('button[type="submit"]',form), msg=qs('#formMessage');
    const fd=new FormData(form); const payload=Object.fromEntries(fd.entries());
    btn.disabled=true; btn.textContent='Yuborilmoqda...'; msg.className='form-message';
    try{
      const res=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await res.json().catch(()=>({ok:false}));
      if(!data.ok) throw new Error('Yuborilmadi');
      msg.textContent='Murojaat yuborildi. Tez orada siz bilan bog‘lanamiz.'; msg.style.display='block'; form.reset();
    }catch(err){msg.textContent='Murojaat yuborilmadi. Telefon yoki WhatsApp orqali bog‘laning.';msg.className='form-message error';msg.style.display='block'}
    finally{btn.disabled=false;btn.textContent='Murojaat yuborish'}
  });
  const calcBtn=qs('#calcBtn');
  calcBtn?.addEventListener('click',()=>{
    const tax=qs('#taxType').value, emp=Number(qs('#employees').value||0), inv=Number(qs('#invoices').value||0), bank=Number(qs('#bankOps').value||0), ie=qs('#importExport').checked;
    const base={turnover:1500000,vat:3500000,profit:3500000,fixed:1200000}[tax]||1500000;
    const sum=Math.round((base+emp*70000+inv*8000+bank*5000+(ie?800000:0))/50000)*50000;
    qs('#calcPrice').textContent=sum.toLocaleString('ru-RU')+' so‘m / oy';
  });
})();
