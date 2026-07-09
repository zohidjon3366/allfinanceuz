const servicesData = [
  {slug:'buxgalteriya-autsorsingi', title:'Buxgalteriya autsorsingi', short:"Birlamchi hujjatlar, bank va kassa operatsiyalari, ish haqi, kontragentlar hisobi hamda majburiy hisobotlarni amaldagi buxgalteriya standartlari va Soliq kodeksi talablariga mos ravishda to‘liq yuritish."},
  {slug:'soliq-maslahatlari', title:'Soliq maslahatlari', short:"Soliq rejimini tanlash, QQS, foyda solig‘i, aylanmadan olinadigan soliq, imtiyozlar va bitimlarning soliq oqibatlari bo‘yicha amaliy hamda yozma tavsiyalar berish."},
  {slug:'soliq-tekshiruvlarida-himoya', title:'Soliq tekshiruvlarida himoya', short:"Kameral, sayyor va soliq auditi jarayonlarida hujjatlarni tayyorlash, izohlar berish, tafovutlarni tahlil qilish va korxona manfaatlarini professional himoya qilish."},
  {slug:'buxgalteriya-hisobini-tiklash', title:'Buxgalteriya hisobini tiklash', short:"Yo‘qolgan, noto‘g‘ri yoki to‘liq yuritilmagan davrlar bo‘yicha hujjatlarni yig‘ish, qayta ishlash va hisobni buxgalteriya hamda soliq talablariga muvofiq tiklash."},
  {slug:'kadrlar-hisobi', title:'Kadrlar hisobi', short:"Mehnat shartnomalari, buyruqlar, ta’til jadvali, shtat hujjatlari va xodimlarga doir kadrlar hujjatlarini mehnat qonunchiligiga mos yuritish."},
  {slug:'ichki-audit', title:'Ichki audit', short:"Hisob, aktivlar, xarajatlar, shartnomalar va ichki nazorat tizimini tekshirib, xavf nuqtalari hamda ularni kamaytirish bo‘yicha amaliy tavsiyalar ishlab chiqish."},
  {slug:'moliyaviy-hisobotlar', title:'Moliyaviy hisobotlar', short:"Rahbariyat uchun daromad, xarajat, pul oqimi, debitor-kreditor qarzdorlik va rentabellikni ko‘rsatadigan aniq, tushunarli va boshqaruvga qulay hisobotlar tayyorlash."},
  {slug:'1c-xizmatlari', title:'1C xizmatlari', short:"1C bazasini sozlash, ma’lumotlar to‘g‘riligini tekshirish, hisobotlarni moslashtirish, import-integratsiya va jarayonlarni avtomatlashtirish bo‘yicha texnik ham amaliy xizmatlar."}
];

document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
const menuBtn = document.getElementById('menuBtn');
const mainNav = document.getElementById('mainNav');
if(menuBtn && mainNav){ menuBtn.addEventListener('click', ()=> mainNav.classList.toggle('open')); }

const closeDropdowns = (except=null) => {
  document.querySelectorAll('.nav-dropdown.open').forEach(drop=>{
    if(except !== drop) drop.classList.remove('open');
  });
};

document.querySelectorAll('.nav-dropdown').forEach(drop=>{
  const link = drop.querySelector('.services-main-link');
  if(link){
    link.addEventListener('click', (e)=>{
      const isOpen = drop.classList.contains('open');
      const onServicesPage = location.pathname.endsWith('/xizmatlar.html') || location.pathname.endsWith('xizmatlar.html');
      if(!isOpen || onServicesPage){
        e.preventDefault();
        closeDropdowns(drop);
        drop.classList.toggle('open');
      }
    });
  }
});
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.nav-dropdown')) closeDropdowns();
});
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
