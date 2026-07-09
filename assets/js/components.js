
(function(){
  const base = document.body.dataset.base || './';
  const config = window.AF_CONFIG || {};
  const services = window.AF_SERVICES || [];
  const serviceLinks = services.map(s => `<a href="${base}services/${s.slug}.html"><span class="drop-icon">${s.icon}</span><span class="drop-copy"><strong>${s.title}</strong><span>${s.short}</span></span></a>`).join('');
  const header = `<header class="site-header"><div class="shell"><div class="nav-wrap">
    <a class="logo" href="${base}index.html" aria-label="ALL FINANCE bosh sahifa"><img src="${base}assets/img/logo-horizontal.png" alt="ALL FINANCE"></a>
    <nav class="nav" id="mainNav">
      <a href="${base}index.html">Bosh sahifa</a>
      <div class="nav-dropdown" id="serviceDropdown"><button type="button">Xizmatlar ▾</button><div class="dropdown-panel">${serviceLinks}</div></div>
      <a href="${base}team.html">Jamoa</a>
      <a href="${base}index.html#cases">Natijalar</a>
      <a href="${base}index.html#faq">FAQ</a>
    </nav>
    <div class="nav-actions"><a class="btn ghost" href="tel:+${config.phoneRaw}">${config.phoneDisplay || 'Bog‘lanish'}</a><a class="btn primary" href="${base}index.html#consult">Konsultatsiya</a><button class="menu-btn" id="menuBtn" aria-label="Menyuni ochish">☰</button></div>
  </div></div></header>`;
  const footerServiceLinks = services.slice(0,5).map(s=>`<a href="${base}services/${s.slug}.html">${s.title}</a>`).join('');
  const footer = `<footer class="footer"><div class="shell"><div class="footer-grid">
    <div><a class="footer-logo" href="${base}index.html"><img src="${base}assets/img/logo-horizontal.png" alt="ALL FINANCE"></a><p class="footer-copy">Biznes uchun buxgalteriya, soliq, audit, kadrlar, moliyaviy hisobot va 1C xizmatlari.</p></div>
    <div><h4>Xizmatlar</h4><div class="footer-links">${footerServiceLinks}</div></div>
    <div><h4>Kompaniya</h4><div class="footer-links"><a href="${base}team.html">Jamoa</a><a href="${base}index.html#cases">Amaliy natijalar</a><a href="${base}index.html#faq">Ko‘p so‘raladigan savollar</a><a href="${base}index.html#consult">Konsultatsiya</a></div></div>
    <div><h4>Bog‘lanish</h4><div class="footer-links"><a href="tel:+${config.phoneRaw}">${config.phoneDisplay}</a><a href="${config.telegramUrl}" target="_blank">Telegram</a><a href="mailto:${config.email}">${config.email}</a><span>${config.address}</span></div></div>
  </div><div class="footer-bottom"><span>© <span data-current-year></span> ALL FINANCE. Barcha huquqlar himoyalangan.</span><span>Maxfiylik • Professional mas’uliyat • Belgilangan muddat</span></div></div></footer>`;
  const hp = document.getElementById('siteHeader'), fp = document.getElementById('siteFooter');
  if(hp) hp.innerHTML=header; if(fp) fp.innerHTML=footer;
  document.querySelectorAll('[data-current-year]').forEach(el=>el.textContent=new Date().getFullYear());
  const menuBtn=document.getElementById('menuBtn'), nav=document.getElementById('mainNav'), dd=document.getElementById('serviceDropdown');
  menuBtn?.addEventListener('click',()=>nav.classList.toggle('open'));
  dd?.querySelector('button')?.addEventListener('click',()=>dd.classList.toggle('open'));
  document.addEventListener('click',e=>{if(nav && !e.target.closest('.nav-wrap')) nav.classList.remove('open')});
})();
