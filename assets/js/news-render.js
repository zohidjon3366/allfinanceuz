(function(){
  const news = (window.AF_NEWS || []).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const listRoot = document.getElementById('newsGrid');
  if(listRoot){
    const limit = Number(listRoot.dataset.limit || news.length);
    listRoot.innerHTML = news.slice(0, limit).map(item => `
      <article class="news-card reveal">
        <a class="news-cover" href="${document.body.dataset.base || './'}yangilik.html?slug=${item.slug}" style="background-image:linear-gradient(180deg,rgba(17,23,54,.18),rgba(17,23,54,.62)),url(${/^(data:|https?:)/.test(item.cover||'') ? item.cover : (document.body.dataset.base || './')+(item.cover||'assets/img/bg-news-finance.svg')})"></a>
        <div class="news-body">
          <div class="news-meta"><span>${item.category}</span><span>${new Date(item.date).toLocaleDateString('ru-RU')}</span><span>${item.readTime}</span></div>
          <h3><a href="${document.body.dataset.base || './'}yangilik.html?slug=${item.slug}">${item.title}</a></h3>
          <p>${item.excerpt}</p>
          <a class="card-link" href="${document.body.dataset.base || './'}yangilik.html?slug=${item.slug}">Batafsil →</a>
        </div>
      </article>`).join('');
  }

  const detailRoot = document.getElementById('newsDetail');
  if(detailRoot){
    const slug = new URLSearchParams(location.search).get('slug');
    const item = news.find(x=>x.slug===slug) || news[0];
    if(item){
      document.title = `${item.title} — ${window.AF_CONFIG?.siteName || 'ALL FINANCE'}`;
      const d = document.querySelector('meta[name="description"]');
      if(d) d.setAttribute('content', item.seoDescription || item.excerpt);
      detailRoot.innerHTML = `
      <section class="page-hero page-hero-news"><div class="shell"><div class="breadcrumbs"><a href="index.html">Bosh sahifa</a><span>›</span><a href="yangiliklar.html">Yangiliklar</a><span>›</span><strong>${item.title}</strong></div>
      <div class="news-detail-hero">
        <div><span class="eyebrow">${item.category}</span><h1 class="display">${item.title}</h1><p class="lead">${item.excerpt}</p><div class="news-meta large"><span>${new Date(item.date).toLocaleDateString('ru-RU')}</span><span>${item.readTime}</span></div></div>
        <div class="detail-cover" style="background-image:linear-gradient(180deg,rgba(17,23,54,.1),rgba(17,23,54,.56)),url(${/^(data:|https?:)/.test(item.cover||'') ? item.cover : (item.cover||'assets/img/bg-news-finance.svg')})"></div>
      </div></div></section>
      <section class="section soft"><div class="shell narrow"><article class="article-copy">${item.content.map(p=>`<p>${p}</p>`).join('')}</article></div></section>
      <section class="section"><div class="shell"><div class="section-head"><div><span class="eyebrow">Boshqa maqolalar</span><h2 class="h2">Yana o‘qing</h2></div></div><div class="news-grid">${news.filter(x=>x.slug!==item.slug).slice(0,3).map(n=>`<article class="news-card"><div class="news-body"><div class="news-meta"><span>${n.category}</span><span>${new Date(n.date).toLocaleDateString('ru-RU')}</span></div><h3><a href="yangilik.html?slug=${n.slug}">${n.title}</a></h3><p>${n.excerpt}</p><a class="card-link" href="yangilik.html?slug=${n.slug}">Batafsil →</a></div></article>`).join('')}</div></div></section>`;
    }
  }
})();
(function(){
  const detailRoot = document.getElementById('newsDetail');
  if(!detailRoot) return;
  const news = window.AF_NEWS || [];
  const slug = new URLSearchParams(location.search).get('slug');
  const item = news.find(x=>x.slug===slug) || news[0];
  const cfg = window.AF_CONFIG || {};
  if(item){
    const schema={"@context":"https://schema.org","@type":"Article","headline":item.title,"description":item.seoDescription || item.excerpt,"datePublished":item.date,"author":{"@type":"Organization","name":cfg.siteName||'ALL FINANCE'},"publisher":{"@type":"Organization","name":cfg.siteName||'ALL FINANCE'},"url":location.href};
    const sc=document.createElement('script'); sc.type='application/ld+json'; sc.textContent=JSON.stringify(schema); document.head.appendChild(sc);
  }
})();
