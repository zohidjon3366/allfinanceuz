
(function(){
  document.querySelectorAll('[data-current-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const toggle=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.main-nav');
  toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('.nav-drop>button').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.nav-drop').classList.toggle('open')));
  document.querySelectorAll('.faq-item button').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.faq-item').classList.toggle('open')));
  const money=n=>Math.round(n/50000)*50000;
  function calc(){
    const out=document.getElementById('calcPrice'); if(!out)return;
    const tax=document.getElementById('taxType')?.value||'turnover';
    const base={turnover:1500000,vat:2400000,profit:3500000}[tax]||1500000;
    const emp=Number(document.getElementById('employees')?.value||0);
    const inv=Number(document.getElementById('invoices')?.value||0);
    const bank=Number(document.getElementById('bankOps')?.value||0);
    const ie=document.getElementById('importExport')?.checked||false;
    const total=base+emp*85000+inv*9000+bank*6000+(ie?900000:0);
    out.textContent=money(total).toLocaleString('ru-RU').replace(/,/g,' ')+' so‘m';
  }
  ['taxType','employees','invoices','bankOps','importExport'].forEach(id=>document.getElementById(id)?.addEventListener('input',calc)); calc();
  const form=document.getElementById('leadForm');
  form?.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const status=document.getElementById('formStatus');
    const data=Object.fromEntries(new FormData(form).entries());
    status.textContent='Yuborilmoqda...';status.className='form-status wide';
    try{
      const r=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const j=await r.json().catch(()=>({ok:false}));
      if(!j.ok) throw new Error('send_failed');
      status.textContent='Murojaat yuborildi. Tez orada siz bilan bog‘lanamiz.';status.className='form-status wide success';form.reset();
    }catch(err){status.textContent='Murojaat yuborilmadi. Telefon yoki WhatsApp orqali bog‘laning.';status.className='form-status wide error';}
  });
})();
