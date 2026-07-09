
(function(){
 const team=window.AF_TEAM||[]; const grid=document.getElementById('teamGrid'); if(!grid)return;
 const year=new Date().getFullYear();
 function draw(filter='all',limit=999){
  const list=team.filter(x=>filter==='all'||x.category===filter).slice(0,limit);
  grid.innerHTML=list.map(m=>{const exp=Math.max(0,year-Number(m.startYear)); const src=m.photo?( /^(data:|https?:)/.test(m.photo) ? m.photo : (document.body.dataset.base||'./')+m.photo ):''; return `<article class="team-card reveal"><div class="team-photo">${src?`<img src="${src}" alt="${m.name}" loading="lazy">`:`<div class="team-placeholder">${m.initials||'AF'}</div>`}<span class="team-badge">${m.categoryLabel||m.role}</span></div><div class="team-body"><h3>${m.name}</h3><span class="team-role">${m.role}</span><p class="team-specialty">${m.specialty}</p><div class="team-meta"><span>${m.startYear}-yildan</span><strong>${exp} yil tajriba</strong></div></div></article>`}).join('');
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.08});grid.querySelectorAll('.reveal').forEach(e=>io.observe(e));
 }
 draw(grid.dataset.limit? 'all':'all', Number(grid.dataset.limit||999));
 document.querySelectorAll('[data-team-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-team-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');draw(b.dataset.teamFilter)}));
})();
