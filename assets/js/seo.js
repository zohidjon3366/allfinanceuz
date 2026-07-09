(function(){
  const cfg = window.AF_CONFIG || {};
  const siteUrl = (cfg.siteUrl || '').replace(/\/$/, '');
  if(cfg.searchConsoleVerification){
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = cfg.searchConsoleVerification;
    document.head.appendChild(meta);
  }
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = siteUrl ? siteUrl + location.pathname.replace(/index\.html$/,'') + location.search : location.href;
  document.head.appendChild(canonical);

  const orgSchema = {
    '@context':'https://schema.org',
    '@type':'Organization',
    name: cfg.siteName || 'ALL FINANCE',
    url: siteUrl || location.origin,
    email: cfg.email || '',
    telephone: cfg.phoneDisplay || '',
    address: {'@type':'PostalAddress','addressLocality': cfg.address || 'Toshkent'},
    sameAs: [cfg.telegramUrl, cfg.instagramUrl].filter(Boolean),
    description: cfg.seo?.organizationDescription || ''
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(orgSchema);
  document.head.appendChild(s);
})();