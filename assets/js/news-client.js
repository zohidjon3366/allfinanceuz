
async function loadNews(){
  try{
    const res = await fetch('/api/news');
    if(!res.ok) throw new Error('load');
    const data = await res.json();
    renderHomeNews(data);
    renderNewsPage(data);
    renderArticlePage(data);
  }catch(e){
    const fallbacks = [];
    renderHomeNews(fallbacks); renderNewsPage(fallbacks); renderArticlePage(fallbacks);
  }
}
function card(article){
  return `<article class="news-card"><div class="news-cover">${article.image ? `<img src="${article.image}" alt="${article.title}" loading="lazy">` : ''}</div><div class="news-content"><div class="news-meta"><span>${article.category}</span><span>${formatDate(article.date)}</span></div><h3>${article.title}</h3><p>${article.excerpt || ''}</p><a class="btn outline" href="maqola.html?id=${article.id}">Ko‘proq o‘qish</a></div></article>`;
}
function formatDate(d){ const dt = new Date(d); return isNaN(dt)? d : dt.toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit',year:'numeric'}); }
function renderHomeNews(data){
  const el = document.getElementById('homeNewsGrid'); if(!el) return;
  const items = data.slice(0,3);
  el.innerHTML = items.length ? items.map(card).join('') : '<div class="news-loading">Yangiliklar hozircha mavjud emas.</div>';
}
function renderNewsPage(data){
  const section = document.querySelector('body[data-page="news"] .section');
  if(!section) return;
  section.innerHTML = `<div class="shell"><div class="section-head"><div><span class="eyebrow">Yangiliklar</span><h2 class="section-title">Ekspert maqolalari</h2><p class="lead">Soliq, buxgalteriya va audit bo‘yicha foydali materiallar.</p></div></div><div class="news-grid">${data.map(card).join('')}</div></div>`;
}
function renderArticlePage(data){
  const root = document.getElementById('articleRoot'); if(!root) return;
  const id = new URLSearchParams(location.search).get('id');
  const article = data.find(x=>x.id===id) || data[0];
  if(!article){ root.innerHTML = '<div class="shell"><div class="article-card">Maqola topilmadi.</div></div>'; return; }
  root.innerHTML = `<div class="shell"><article class="article-card">${article.image ? `<img class="article-cover" src="${article.image}" alt="${article.title}">` : ''}<div class="news-meta"><span>${article.category}</span><span>${formatDate(article.date)}</span></div><h2 class="section-title">${article.title}</h2><p class="lead">${article.excerpt || ''}</p>${article.content || ''}<div style="margin-top:26px"><a class="btn outline" href="yangiliklar.html">← Yangiliklarga qaytish</a></div></article></div>`;
}
loadNews();
