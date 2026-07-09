(function(){
  const base = document.body.dataset.base || './';
  const defaults = {
    siteName:'ALL FINANCE',
    phoneDisplay:'+998 97 008-33-66',
    phoneRaw:'998970083366',
    email:'info@allfinance.uz',
    address:'Toshkent sh., Yakkasaroy tumani, Mahmud Torobiy ko‘chasi, 4, 10-uy',
    mapsUrl:'https://www.google.com/maps/search/?api=1&query=Mahmud+Torobiy+4+10+Tashkent',
    telegramUrl:'https://t.me/allfinance_uz',
    instagramUrl:'https://instagram.com/allfinanceuz',
    whatsappUrl:'https://wa.me/998970083366',
    facebookUrl:'https://www.facebook.com/allfinanceuz',
    linkedinUrl:'https://www.linkedin.com/company/allfinanceuz',
    workHours:['Dushanba–Juma — 09:00–18:00','Shanba — 09:00–16:00']
  };
  const config = Object.assign({}, defaults, window.AF_CONFIG || {});
  const fallbackServices = [
    {slug:'buxgalteriya-autsorsingi',title:'Buxgalteriya autsorsingi',short:'Hisob va hisobotlarni professional yuritish.'},
    {slug:'soliq-maslahatlari',title:'Soliq maslahatlari',short:'Soliq rejimi, imtiyoz va xavflar tahlili.'},
    {slug:'soliq-tekshiruvlarida-himoya',title:'Soliq tekshiruvlarida himoya',short:'Tekshiruvlarda hujjatli professional himoya.'},
    {slug:'buxgalteriya-hisobini-tiklash',title:'Hisobni tiklash',short:'Oldingi davrlarni hujjatlar asosida tiklash.'},
    {slug:'kadrlar-hisobi',title:'Kadrlar hisobi',short:'Mehnat hujjatlari va kadrlar yurituvi.'},
    {slug:'ichki-audit',title:'Ichki audit',short:'Hisob va ichki nazorat xavflarini baholash.'},
    {slug:'moliyaviy-hisobotlar',title:'Moliyaviy hisobotlar',short:'Rahbar uchun tahliliy boshqaruv hisobotlari.'},
    {slug:'1c-xizmatlari',title:'1C xizmatlari',short:'1C sozlash, integratsiya va avtomatlashtirish.'}
  ];
  const services = Array.isArray(window.AF_SERVICES) && window.AF_SERVICES.length ? window.AF_SERVICES : fallbackServices;

  function logoMarkup(extraClass=''){
    return `<span class="brand-lockup ${extraClass}" aria-label="ALL FINANCE">
      <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true"><path d="M5 31L17 20l8 8L43 9" fill="none" stroke="#45469d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 35v8h10V27L5 35zm15-10v18h10V34l-10-9zm15 5v13h8V18L35 30z" fill="#08b05f"/></svg>
      <span class="brand-text">All Finance</span>
    </span>`;
  }

  function serviceIcon(slug){
    const commonStart = `<svg viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="24" fill="url(#g-${slug})"/><rect x="17" y="17" width="62" height="62" rx="18" fill="#fff" fill-opacity=".80"/>`;
    const defs = `<defs><linearGradient id="g-${slug}" x1="0" y1="0" x2="96" y2="96"><stop stop-color="#e9edff"/><stop offset="1" stop-color="#ddf3e7"/></linearGradient></defs></svg>`;
    const shapes = {
      'buxgalteriya-autsorsingi': `<rect x="29" y="28" width="27" height="7" rx="3.5" fill="#45469d" fill-opacity=".24"/><rect x="29" y="41" width="20" height="5" rx="2.5" fill="#08b05f" fill-opacity=".58"/><rect x="29" y="52" width="37" height="5" rx="2.5" fill="#45469d" fill-opacity=".18"/><rect x="29" y="63" width="28" height="5" rx="2.5" fill="#45469d" fill-opacity=".18"/><rect x="58" y="36" width="10" height="10" rx="3" fill="#45469d" fill-opacity=".18"/><rect x="58" y="51" width="10" height="10" rx="3" fill="#08b05f" fill-opacity=".45"/>`,
      'soliq-maslahatlari': `<path d="M48 29v38" stroke="#45469d" stroke-width="7" stroke-linecap="round"/><path d="M35 37c4-5 9-7 15-7 8 0 14 4 14 10 0 12-28 9-28 20 0 5 5 9 15 9 6 0 11-2 15-7" stroke="#08b05f" stroke-width="6" stroke-linecap="round" fill="none"/>`,
      'soliq-tekshiruvlarida-himoya': `<path d="M48 27l19 8v16c0 15-11 24-19 27-8-3-19-12-19-27V35l19-8z" fill="#eef3ff" stroke="#45469d" stroke-width="3.5"/><path d="M39 49l6 6 12-13" stroke="#08b05f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
      'buxgalteriya-hisobini-tiklash': `<circle cx="48" cy="48" r="19" fill="#eef3ff"/><path d="M59 42c-4-7-11-10-18-7-7 2-11 8-11 15" stroke="#45469d" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="M33 38l-3 10 10-2" stroke="#45469d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 57c4 4 9 6 15 4 7-2 12-8 12-15" stroke="#08b05f" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="M62 59l3-10-10 2" stroke="#08b05f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
      'kadrlar-hisobi': `<circle cx="40" cy="41" r="8" fill="#45469d" fill-opacity=".24"/><circle cx="58" cy="41" r="8" fill="#08b05f" fill-opacity=".30"/><path d="M29 62c2-9 10-13 19-13s17 4 19 13" stroke="#45469d" stroke-width="4.5" stroke-linecap="round"/><rect x="53" y="26" width="16" height="10" rx="4" fill="#08b05f" fill-opacity=".24"/><text x="61" y="33" font-size="7" font-family="Arial" fill="#167a61" text-anchor="middle">HR</text>`,
      'ichki-audit': `<rect x="28" y="27" width="26" height="38" rx="8" fill="#f4f7ff" stroke="#45469d" stroke-opacity=".20"/><rect x="34" y="36" width="14" height="4" rx="2" fill="#45469d" fill-opacity=".18"/><rect x="34" y="46" width="10" height="4" rx="2" fill="#08b05f" fill-opacity=".46"/><circle cx="60" cy="50" r="10" stroke="#45469d" stroke-width="4"/><path d="M67 57l6 6" stroke="#08b05f" stroke-width="4" stroke-linecap="round"/>`,
      'moliyaviy-hisobotlar': `<rect x="29" y="51" width="9" height="16" rx="3" fill="#08b05f" fill-opacity=".48"/><rect x="43" y="42" width="9" height="25" rx="3" fill="#45469d" fill-opacity=".24"/><rect x="57" y="32" width="9" height="35" rx="3" fill="#08b05f" fill-opacity=".78"/><path d="M29 30h28" stroke="#45469d" stroke-width="4" stroke-linecap="round" stroke-opacity=".22"/>`,
      '1c-xizmatlari': `<circle cx="48" cy="48" r="18" fill="#eef3ff" stroke="#45469d" stroke-width="4" stroke-opacity=".18"/><text x="48" y="54" font-size="17" font-family="Arial" font-weight="700" fill="#45469d" text-anchor="middle">1C</text><path d="M62 34l6-2-2 6" stroke="#08b05f" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 34c3 3 5 8 5 14 0 12-9 21-21 21-5 0-10-2-14-5" stroke="#08b05f" stroke-width="3.5" stroke-linecap="round" fill="none"/>`
    };
    return commonStart + (shapes[slug] || shapes['moliyaviy-hisobotlar']) + defs;
  }
  window.AF_SERVICE_ICON = serviceIcon;

  const socialIcon = (name)=>({
    telegram:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21.4 4.6 18 20.5c-.3 1.3-1.1 1.6-2.2 1L10.7 18l-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.3 9.6-8.7c.4-.4-.1-.6-.6-.2L4.8 14.1 0 12.6c-1.1-.3-1.1-1 .2-1.5L19 3.9c.9-.3 1.8.2 1.4 1.7z"/></svg>`,
    instagram:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7zm5 2.5A5.3 5.3 0 1 1 6.7 12 5.3 5.3 0 0 1 12 6.7zm0 2.2A3.1 3.1 0 1 0 15.1 12 3.1 3.1 0 0 0 12 8.9zm5.6-3.4a1.3 1.3 0 1 1-1.3 1.3 1.3 1.3 0 0 1 1.3-1.3z"/></svg>`,
    whatsapp:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 1 8.7 14.9L22 22l-5.2-1.3A10 10 0 1 1 12 2zm0 2a8 8 0 0 0-6.8 12.2l.3.5-.8 2.6 2.7-.7.5.3A8 8 0 1 0 12 4z"/></svg>`,
    facebook:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5a23 23 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4z"/></svg>`,
    linkedin:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5.4 8.2H2.2V22h3.2V8.2zM3.8 2A1.9 1.9 0 1 0 3.8 5.8 1.9 1.9 0 0 0 3.8 2zM21.8 14.1c0-4.1-2.2-6-5.1-6a4.4 4.4 0 0 0-4 2.2V8.2H9.5V22h3.2v-6.8c0-1.8.3-3.6 2.6-3.6 2.3 0 2.3 2.1 2.3 3.7V22h3.2z"/></svg>`,
    maps:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 1 7 7c0 4.5-5.2 10.6-6.3 11.9a1 1 0 0 1-1.4 0C10.2 19.6 5 13.5 5 9a7 7 0 0 1 7-7zm0 9.5A2.5 2.5 0 1 0 9.5 9 2.5 2.5 0 0 0 12 11.5z"/></svg>`,
    phone:`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.8a15.8 15.8 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V21a1 1 0 0 1-1 1A18 18 0 0 1 2 5a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.2 1z"/></svg>`
  }[name] || '');

  const socialLinks = [
    {key:'telegram',label:'Telegram',url:config.telegramUrl},
    {key:'instagram',label:'Instagram',url:config.instagramUrl},
    {key:'whatsapp',label:'WhatsApp',url:config.whatsappUrl},
    {key:'facebook',label:'Facebook',url:config.facebookUrl},
    {key:'linkedin',label:'LinkedIn',url:config.linkedinUrl},
    {key:'maps',label:'Manzil',url:config.mapsUrl}
  ].filter(x=>x.url);
  const socialsInline = socialLinks.map(s=>`<a href="${s.url}" class="social-link" target="_blank" rel="noopener" aria-label="${s.label}" title="${s.label}">${socialIcon(s.key)}</a>`).join('');
  const serviceLinks = services.map(s=>`<a href="${base}services/${s.slug}.html"><span class="drop-icon">${serviceIcon(s.slug)}</span><span class="drop-copy"><strong>${s.title}</strong><span>${s.short || ''}</span></span></a>`).join('');

  const header = `<header class="site-header"><div class="shell"><div class="topbar"><div class="topbar-copy"><a href="${config.mapsUrl}" target="_blank" rel="noopener">${config.address}</a><span>•</span><a href="mailto:${config.email}">${config.email}</a></div><div class="topbar-socials">${socialsInline}</div></div><div class="nav-wrap">
    <a class="logo" href="${base}index.html">${logoMarkup()}</a>
    <nav class="nav" id="mainNav"><a href="${base}index.html">Bosh sahifa</a><div class="nav-dropdown" id="serviceDropdown"><button type="button">Xizmatlar ▾</button><div class="dropdown-panel">${serviceLinks}</div></div><a href="${base}team.html">Jamoa</a><a href="${base}yangiliklar.html">Yangiliklar</a><a href="${base}narxlar.html">Prays list</a><a href="${base}index.html#cases">Natijalar</a><a href="${base}index.html#faq">FAQ</a></nav>
    <div class="nav-actions"><a class="btn ghost" href="tel:+${config.phoneRaw}">${config.phoneDisplay}</a><a class="btn primary" href="${base}index.html#consult">Konsultatsiya</a><button class="menu-btn" id="menuBtn" aria-label="Menyuni ochish">☰</button></div>
  </div></div></header>`;

  const footerServiceLinks = services.slice(0,6).map(s=>`<a href="${base}services/${s.slug}.html">${s.title}</a>`).join('');
  const hours = (config.workHours || []).map(x=>`<span>${x}</span>`).join('');
  const footer = `<footer class="footer"><div class="shell"><div class="footer-grid"><div><a class="footer-logo" href="${base}index.html">${logoMarkup('footer-brand')}</a><p class="footer-copy">Buxgalteriya, soliq, audit, kadrlar va 1C xizmatlari.</p><div class="social-row">${socialsInline}</div></div><div><h4>Xizmatlar</h4><div class="footer-links">${footerServiceLinks}</div></div><div><h4>Kompaniya</h4><div class="footer-links"><a href="${base}team.html">Jamoa</a><a href="${base}yangiliklar.html">Yangiliklar</a><a href="${base}narxlar.html">Prays list</a><a href="${base}index.html#cases">Amaliy natijalar</a><a href="${base}index.html#faq">FAQ</a></div></div><div><h4>Bog‘lanish</h4><div class="footer-links"><a href="tel:+${config.phoneRaw}">${config.phoneDisplay}</a><a href="mailto:${config.email}">${config.email}</a><a href="${config.mapsUrl}" target="_blank">${config.address}</a>${hours}</div></div></div><div class="footer-bottom"><span>© <span data-current-year></span> ALL FINANCE.</span><span>Maxfiylik • Mas’uliyat • Aniqlik</span></div></div></footer>`;
  const quickLinks = [
    {key:'phone',label:'Qo‘ng‘iroq',url:`tel:+${config.phoneRaw}`},
    {key:'telegram',label:'Telegram',url:config.telegramUrl},
    {key:'whatsapp',label:'WhatsApp',url:config.whatsappUrl},
    {key:'instagram',label:'Instagram',url:config.instagramUrl}
  ].filter(x=>x.url).map(s=>`<a href="${s.url}" class="quick-link" ${String(s.url).startsWith('http')?'target="_blank" rel="noopener"':''}>${socialIcon(s.key)}<span>${s.label}</span></a>`).join('');

  const hp=document.getElementById('siteHeader'), fp=document.getElementById('siteFooter');
  if(hp) hp.innerHTML=header;
  if(fp) fp.innerHTML=footer+`<div class="floating-contacts">${quickLinks}</div>`;
  document.querySelectorAll('[data-current-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const menuBtn=document.getElementById('menuBtn'),nav=document.getElementById('mainNav'),dd=document.getElementById('serviceDropdown');
  menuBtn?.addEventListener('click',()=>nav?.classList.toggle('open'));
  dd?.querySelector('button')?.addEventListener('click',()=>dd.classList.toggle('open'));
  document.addEventListener('click',e=>{if(nav&&!e.target.closest('.nav-wrap'))nav.classList.remove('open')});
})();
