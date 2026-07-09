(function(){
  const cfg = (window.AF_CONFIG || {}).tilda || {};

  function normalize(url, id){
    if(!url) return '';
    try{
      const u = new URL(url, location.href);
      u.searchParams.set('af_embed', id);
      return u.toString();
    }catch(e){ return url; }
  }

  function mount(id, url, minHeight){
    const host = document.querySelector(`[data-tilda-host="${id}"]`);
    const fallback = document.querySelector(`[data-tilda-fallback="${id}"]`);
    if(!host || !url) return;

    const frame = document.createElement('iframe');
    frame.className = 'tilda-embed-frame';
    frame.id = `tilda-${id}-frame`;
    frame.src = normalize(url, id);
    frame.title = id === 'news' ? 'ALL FINANCE yangiliklari' : id === 'team' ? 'ALL FINANCE jamoasi' : 'ALL FINANCE konsultatsiya formasi';
    frame.loading = id === 'form' ? 'eager' : 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.style.minHeight = `${Number(minHeight || 650)}px`;
    frame.setAttribute('allow', 'clipboard-write');
    host.appendChild(frame);
    host.hidden = false;
    if(fallback) fallback.hidden = true;
  }

  mount('news', cfg.newsUrl, cfg.newsMinHeight);
  mount('team', cfg.teamUrl, cfg.teamMinHeight);
  mount('form', cfg.formUrl, cfg.formMinHeight);

  window.addEventListener('message', event => {
    const data = event.data || {};
    if(data.type !== 'allfinance-tilda-height' || !data.id) return;
    const frame = document.getElementById(`tilda-${data.id}-frame`);
    const height = Math.max(320, Math.min(4000, Number(data.height || 0)));
    if(frame && height) frame.style.height = `${height}px`;
  });
})();
