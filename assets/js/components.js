(function(){
  const base = document.body.dataset.base || './';
  const config = window.AF_CONFIG || {};
  const services = window.AF_SERVICES || [];
  const socials = config.socialLinks || [];

  const icon = (name)=>({
    telegram:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.4 4.6 18 20.5c-.3 1.3-1.1 1.6-2.2 1L10.7 18l-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.3 9.6-8.7c.4-.4-.1-.6-.6-.2L4.8 14.1 0 12.6c-1.1-.3-1.1-1 .2-1.5L19 3.9c.9-.3 1.8.2 1.4 1.7z"/></svg>`,
    instagram:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7zm5 2.5A5.3 5.3 0 1 1 6.7 12 5.3 5.3 0 0 1 12 6.7zm0 2.2A3.1 3.1 0 1 0 15.1 12 3.1 3.1 0 0 0 12 8.9zm5.6-3.4a1.3 1.3 0 1 1-1.3 1.3 1.3 1.3 0 0 1 1.3-1.3z"/></svg>`,
    whatsapp:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 1 8.7 14.9L22 22l-5.2-1.3A10 10 0 1 1 12 2zm0 2a8 8 0 0 0-6.8 12.2l.3.5-.8 2.6 2.7-.7.5.3A8 8 0 1 0 12 4zm4.5 10.2c.2.1.3.2.3.4 0 .2-.1 1-.6 1.4-.4.4-1 .7-1.7.7-1 0-2.2-.4-3.6-1.2-2.3-1.4-3.8-3.8-4-4.1-.2-.3-.9-1.2-.9-2.3 0-1.1.6-1.7.8-1.9.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2.1.4 0 .6l-.3.5c-.1.2-.3.4-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.8 2.1 1.2 1.1 2.2 1.4 2.5 1.6.3.2.5.1.7-.1l.9-1c.2-.2.4-.3.7-.2l1.5.7z"/></svg>`,
    facebook:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5a23 23 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4z"/></svg>`,
    linkedin:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.4 8.2H2.2V22h3.2V8.2zM3.8 2A1.9 1.9 0 1 0 3.8 5.8 1.9 1.9 0 0 0 3.8 2zM21.8 14.1c0-4.1-2.2-6-5.1-6a4.4 4.4 0 0 0-4 2.2V8.2H9.5V22h3.2v-6.8c0-1.8.3-3.6 2.6-3.6 2.3 0 2.3 2.1 2.3 3.7V22h3.2l1-7.9z"/></svg>`,
    maps:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 1 7 7c0 4.5-5.2 10.6-6.3 11.9a1 1 0 0 1-1.4 0C10.2 19.6 5 13.5 5 9a7 7 0 0 1 7-7zm0 9.5A2.5 2.5 0 1 0 9.5 9 2.5 2.5 0 0 0 12 11.5z"/></svg>`,
    phone:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.8 15.8 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V21a1 1 0 0 1-1 1A18 18 0 0 1 2 5a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.2 1z"/></svg>`,
    mail:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm9 7 9-5H3l9 5zm0 2.3L3 9.3V17h18V9.3l-9 5z"/></svg>`
  }[name] || '');

  const serviceLinks = services.map(s => `<a href="${base}services/${s.slug}.html"><span class="drop-icon">${s.icon}</span><span class="drop-copy"><strong>${s.title}</strong><span>${s.short}</span></span></a>`).join('');
  const socialsInline = socials.map(s=>`<a href="${s.url}" class="social-link" target="_blank" rel="noopener" aria-label="${s.label}" title="${s.label}">${icon(s.key)}</a>`).join('');

  const quickLinks = [
    {key:'phone',label:'Qo‘ng‘iroq',url:`tel:+${config.phoneRaw}`},
    {key:'telegram',label:'Telegram',url:config.telegramUrl},
    {key:'whatsapp',label:'WhatsApp',url:config.whatsappUrl},
    {key:'instagram',label:'Instagram',url:config.instagramUrl}
  ].filter(x=>x.url).map(s=>`<a href="${s.url}" class="quick-link" ${String(s.url).startsWith('http')?'target="_blank" rel="noopener"':''}>${icon(s.key)}<span>${s.label}</span></a>`).join('');

  const header = `<header class="site-header"><div class="shell"><div class="topbar"><div class="topbar-copy"><a href="${config.mapsUrl}" target="_blank" rel="noopener">${config.address || ''}</a><span>•</span><a href="mailto:${config.email}">${config.email}</a></div><div class="topbar-socials">${socialsInline}</div></div><div class="nav-wrap">
    <a class="logo" href="${base}index.html" aria-label="ALL FINANCE bosh sahifa"><img src="${base}assets/img/logo-horizontal.png" alt="ALL FINANCE"></a>
    <nav class="nav" id="mainNav">
      <a href="${base}index.html">Bosh sahifa</a>
      <div class="nav-dropdown" id="serviceDropdown"><button type="button">Xizmatlar ▾</button><div class="dropdown-panel">${serviceLinks}</div></div>
      <a href="${base}team.html">Jamoa</a>
      <a href="${base}yangiliklar.html">Yangiliklar</a>
      <a href="${base}index.html#cases">Natijalar</a>
      <a href="${base}index.html#faq">FAQ</a>
    </nav>
    <div class="nav-actions"><a class="btn ghost" href="tel:+${config.phoneRaw}">${config.phoneDisplay || 'Bog‘lanish'}</a><a class="btn primary" href="${base}index.html#consult">Konsultatsiya</a><button class="menu-btn" id="menuBtn" aria-label="Menyuni ochish">☰</button></div>
  </div></div></header>`;

  const footerServiceLinks = services.slice(0,6).map(s=>`<a href="${base}services/${s.slug}.html">${s.title}</a>`).join('');
  const hours = (config.workHours || []).map(x=>`<span>${x}</span>`).join('');
  const footer = `<footer class="footer"><div class="shell"><div class="footer-grid">
    <div><a class="footer-logo" href="${base}index.html"><img src="${base}assets/img/logo-horizontal.png" alt="ALL FINANCE"></a><p class="footer-copy">Biznes uchun buxgalteriya, soliq, audit, kadrlar, moliyaviy hisobot va 1C xizmatlari. Premium xizmat, aniq muddat va mas’ul jamoa.</p><div class="social-row">${socialsInline}</div></div>
    <div><h4>Xizmatlar</h4><div class="footer-links">${footerServiceLinks}</div></div>
    <div><h4>Kompaniya</h4><div class="footer-links"><a href="${base}team.html">Jamoa</a><a href="${base}yangiliklar.html">Yangiliklar</a><a href="${base}index.html#cases">Amaliy natijalar</a><a href="${base}index.html#faq">Ko‘p so‘raladigan savollar</a><a href="${base}index.html#consult">Konsultatsiya</a></div></div>
    <div><h4>Bog‘lanish</h4><div class="footer-links"><a href="tel:+${config.phoneRaw}">${config.phoneDisplay}</a><a href="mailto:${config.email}">${config.email}</a><a href="${config.mapsUrl}" target="_blank" rel="noopener">${config.address}</a>${hours}</div></div>
  </div><div class="footer-bottom"><span>© <span data-current-year></span> ALL FINANCE. Barcha huquqlar himoyalangan.</span><span>Maxfiylik • Professional mas’uliyat • Belgilangan muddat</span></div></div></footer>`;

  const floating = `<div class="floating-contacts">${quickLinks}</div>`;
  const hp = document.getElementById('siteHeader'), fp = document.getElementById('siteFooter');
  if(hp) hp.innerHTML = header;
  if(fp) fp.innerHTML = footer + floating;

  document.querySelectorAll('[data-current-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const menuBtn=document.getElementById('menuBtn'), nav=document.getElementById('mainNav'), dd=document.getElementById('serviceDropdown');
  menuBtn?.addEventListener('click',()=>nav.classList.toggle('open'));
  dd?.querySelector('button')?.addEventListener('click',()=>dd.classList.toggle('open'));
  document.addEventListener('click',e=>{if(nav && !e.target.closest('.nav-wrap')) nav.classList.remove('open')});
})();
