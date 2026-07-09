(function(){
  "use strict";
  const $ = (selector, parent=document) => parent.querySelector(selector);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const formatDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("uz-UZ", { day:"2-digit", month:"2-digit", year:"numeric" });
  };
  const categoryIcon = category => {
    const c = String(category || "").toLowerCase();
    if (c.includes("audit")) return "IA";
    if (c.includes("1c")) return "1C";
    if (c.includes("soliq")) return "%";
    if (c.includes("kadr")) return "HR";
    return "AF";
  };
  const articleUrl = item => item.external_url || `/maqola.html?slug=${encodeURIComponent(item.slug)}`;
  const card = item => `
    <article class="news-card dynamic-news-card">
      <a class="news-cover dynamic-cover" href="${escapeHtml(articleUrl(item))}">
        ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<span class="news-placeholder">${escapeHtml(categoryIcon(item.category))}</span>`}
      </a>
      <div class="news-body">
        <div class="news-meta"><span>${escapeHtml(item.category || "Yangilik")}</span><span>${formatDate(item.published_at)}</span></div>
        <h3><a href="${escapeHtml(articleUrl(item))}">${escapeHtml(item.title)}</a></h3>
        <p>${escapeHtml(item.excerpt || "")}</p>
        <a href="${escapeHtml(articleUrl(item))}">Ko‘proq o‘qish →</a>
      </div>
    </article>`;

  async function loadNews(container, limit){
    if (!container) return;
    container.innerHTML = '<div class="news-loading">Yangiliklar yuklanmoqda...</div>';
    try {
      const response = await fetch(`/api/news?limit=${limit}`, { headers: { Accept:"application/json" } });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Xatolik");
      if (!data.items.length) {
        container.innerHTML = '<div class="news-loading">Hozircha yangiliklar mavjud emas.</div>';
        return;
      }
      container.innerHTML = data.items.map(card).join("");
    } catch (error) {
      container.innerHTML = '<div class="news-loading error">Yangiliklarni yuklab bo‘lmadi.</div>';
    }
  }

  async function loadArticle(container){
    if (!container) return;
    const slug = new URLSearchParams(location.search).get("slug") || "";
    if (!slug) {
      container.innerHTML = '<div class="article"><h1>Yangilik topilmadi</h1><p>Yangiliklar sahifasiga qayting.</p></div>';
      return;
    }
    try {
      const response = await fetch(`/api/news/${encodeURIComponent(slug)}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("Topilmadi");
      const item = data.item;
      document.title = `${item.title} — ALL FINANCE`;
      const description = document.querySelector('meta[name="description"]');
      if (description) description.content = item.excerpt || item.title;
      const paragraphs = String(item.content || "").split(/\n\s*\n/).filter(Boolean).map(text => `<p>${escapeHtml(text).replace(/\n/g,"<br>")}</p>`).join("");
      container.innerHTML = `<article class="article dynamic-article">
        <div class="news-meta"><span>${escapeHtml(item.category || "Yangilik")}</span><span>${formatDate(item.published_at)}</span></div>
        <h1>${escapeHtml(item.title)}</h1>
        ${item.image_url ? `<img class="article-cover" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">` : ""}
        <p class="article-lead">${escapeHtml(item.excerpt || "")}</p>
        <div class="article-content">${paragraphs}</div>
        <p><a class="btn outline" href="/yangiliklar.html">← Yangiliklarga qaytish</a></p>
      </article>`;
    } catch (error) {
      container.innerHTML = '<div class="article"><h1>Yangilik topilmadi</h1><p>Yangilik o‘chirilgan yoki manzil noto‘g‘ri.</p><a class="btn outline" href="/yangiliklar.html">Yangiliklarga qaytish</a></div>';
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadNews($("#homeNewsGrid"), 3);
    loadNews($("#newsListGrid"), 60);
    loadArticle($("#newsArticle"));
  });
})();
