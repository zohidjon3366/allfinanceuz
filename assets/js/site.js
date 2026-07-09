
const servicesData = [
  {slug:'buxgalteriya-autsorsingi', title:'Buxgalteriya autsorsingi', short:'Kundalik hisob, bank, kassa, ish haqi va hisobotlar yagona mas’ul jamoa nazoratida.'},
  {slug:'soliq-maslahatlari', title:'Soliq maslahatlari', short:'Soliq rejimi, bitimlar, imtiyozlar va xavflar bo‘yicha amaliy tavsiyalar.'},
  {slug:'soliq-tekshiruvlarida-himoya', title:'Soliq tekshiruvlarida himoya', short:'Kameral, sayyor va soliq auditi jarayonlarida hujjatli professional himoya.'},
  {slug:'buxgalteriya-hisobini-tiklash', title:'Buxgalteriya hisobini tiklash', short:'Yo‘qolgan yoki noto‘g‘ri yuritilgan davrlarni hujjatlar asosida qayta tiklash.'},
  {slug:'kadrlar-hisobi', title:'Kadrlar hisobi', short:'Mehnat shartnomalari, buyruqlar, ta’tillar va shtat hujjatlarini to‘liq yuritish.'},
  {slug:'ichki-audit', title:'Ichki audit', short:'Hisob, aktivlar, xarajatlar va biznes jarayonlaridagi xavflarni mustaqil baholash.'},
  {slug:'moliyaviy-hisobotlar', title:'Moliyaviy hisobotlar', short:'Rahbariyat uchun daromad, xarajat, pul oqimi va qarzdorliklar tahlili.'},
  {slug:'1c-xizmatlari', title:'1C xizmatlari', short:'1C bazasini sozlash, tekshirish, integratsiya va jarayonlarni avtomatlashtirish.'}
];

document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
const menuBtn = document.getElementById('menuBtn');
const mainNav = document.getElementById('mainNav');
if(menuBtn && mainNav){ menuBtn.addEventListener('click', ()=> mainNav.classList.toggle('open')); }

document.querySelectorAll('.nav-dropdown').forEach(drop=>{
  const btn = drop.querySelector('.services-toggle');
  if(btn){
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', drop.classList.contains('open') ? 'true' : 'false');
    });
  }
  drop.addEventListener('mouseenter', ()=>drop.classList.add('open'));
  drop.addEventListener('mouseleave', ()=>{
    if(window.innerWidth > 840){ drop.classList.remove('open'); if(btn) btn.setAttribute('aria-expanded','false'); }
  });
});
document.addEventListener('click', (e)=>{
  document.querySelectorAll('.nav-dropdown.open').forEach(drop=>{ if(!drop.contains(e.target)) drop.classList.remove('open'); });
});

const consultForm = document.getElementById('consultForm');
if(consultForm){
  consultForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(consultForm); const data = Object.fromEntries(fd.entries());
    const msg = document.getElementById('formMessage');
    try{
      const res = await fetch('/api/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const json = await res.json();
      if(!res.ok) throw new Error(json.message || 'Xatolik yuz berdi');
      msg.textContent = 'So‘rovingiz yuborildi. Tez orada siz bilan bog‘lanamiz.';
      consultForm.reset();
    }catch(err){
      msg.textContent = 'Yuborishda muammo yuz berdi. Iltimos, telefon orqali bog‘laning.';
    }
  });
}
