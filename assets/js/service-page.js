
(function(){
 const slug=document.body.dataset.service; const s=(window.AF_SERVICES||[]).find(x=>x.slug===slug); const root=document.getElementById('servicePage'); if(!s||!root)return; const base=document.body.dataset.base||'../';
 const list=(items,cls='bullet-list')=>`<div class="${cls}">${items.map((x,i)=>`<div class="bullet"><span class="check">✓</span><span>${x}</span></div>`).join('')}</div>`;
 const related=(window.AF_SERVICES||[]).filter(x=>x.slug!==slug).slice(0,3);
 root.innerHTML=`<section class="page-hero"><div class="shell"><div class="breadcrumbs"><a href="${base}index.html">Bosh sahifa</a><span>›</span><a href="${base}index.html#services">Xizmatlar</a><span>›</span><strong>${s.title}</strong></div><div class="service-hero-grid"><div><span class="eyebrow">ALL FINANCE xizmati</span><div class="service-kicker">${s.title}</div><h1 class="display">${s.headline}</h1><p class="lead">${s.intro}</p><div class="hero-actions"><a class="btn primary" href="${base}index.html#consult">Bepul konsultatsiya</a><a class="btn ghost" href="tel:+${(window.AF_CONFIG||{}).phoneRaw}">Qo‘ng‘iroq qilish</a></div></div><div class="service-visual thematic" style="background-image:linear-gradient(180deg,rgba(17,23,56,.08),rgba(17,23,56,.24)),url(${base}${s.image||'assets/img/bg-service-report.svg'})"><div class="visual-pill">${s.title}</div><div class="visual-list thematic-list">${s.visual.map((x,i)=>`<div class="visual-row"><span>${x}</span><span>${i===2?'Nazoratda':'✓'}</span></div>`).join('')}</div></div></div></div></section>
 <section class="section soft"><div class="shell"><div class="section-head"><div><span class="eyebrow">Xizmat tarkibi</span><h2 class="h2">Nimalar amalga oshiriladi?</h2><p class="lead">Xizmat hajmi korxona faoliyati va amaldagi hisob holatiga moslashtiriladi.</p></div></div>${list(s.included)}</div></section>
 <section class="section"><div class="shell"><div class="section-head"><div><span class="eyebrow">Qachon kerak?</span><h2 class="h2">Ushbu xizmat sizga mos keladigan holatlar</h2></div></div>${list(s.when)}</div></section>
 <section class="section soft"><div class="shell"><div class="section-head"><div><span class="eyebrow">Ish jarayoni</span><h2 class="h2">4 bosqichli aniq yondashuv</h2></div></div><div class="process-grid">${['Diagnostika','Reja va hujjatlar','Amalga oshirish','Nazorat va natija'].map((x,i)=>`<div class="process"><strong>0${i+1}</strong><h3>${x}</h3><p>${['Vaziyat, hujjatlar va xavflar baholanadi.','Ish hajmi, muddat va mas’ullar belgilanadi.','Kelishilgan ishlar bosqichma-bosqich bajariladi.','Natija tekshiriladi va rahbarga topshiriladi.'][i]}</p></div>`).join('')}</div></div></section>
 <section class="section"><div class="shell"><div class="split"><div><span class="eyebrow">Natija</span><h2 class="h2">Sizga topshiriladigan materiallar</h2><p class="lead">Faqat bajarilgan ish emas, keyingi qarorlar uchun foydalaniladigan nazorat materiali ham beriladi.</p></div>${list(s.deliverables,'feature-list')}</div></div></section>
 <section class="section soft"><div class="shell"><div class="section-head"><div><span class="eyebrow">Boshqa xizmatlar</span><h2 class="h2">Bir-birini to‘ldiradigan yechimlar</h2></div></div><div class="related-grid">${related.map(r=>`<div class="related-card"><strong>${r.title}</strong><p>${r.short}</p><a href="${base}services/${r.slug}.html">Batafsil →</a></div>`).join('')}</div></div></section>
 <section class="cta"><div class="shell"><div class="cta-box"><div><h2>${s.title}</h2><p>Dastlabki konsultatsiya bepul.</p></div><div class="cta-actions"><a class="btn primary" href="${base}index.html#consult">Konsultatsiya olish</a><a class="btn ghost" href="tel:+${(window.AF_CONFIG||{}).phoneRaw}">${(window.AF_CONFIG||{}).phoneDisplay}</a></div></div></div></section>`;
})();

(function(){
 const slug=document.body.dataset.service; const s=(window.AF_SERVICES||[]).find(x=>x.slug===slug); if(!s) return;
 document.title = `${s.title} — ${(window.AF_CONFIG||{}).siteName || 'ALL FINANCE'}`;
 const md = document.querySelector('meta[name="description"]'); if(md) md.setAttribute('content', s.intro || s.short || '');
})();

(function(){
 const slug=document.body.dataset.service; const s=(window.AF_SERVICES||[]).find(x=>x.slug===slug); const cfg=window.AF_CONFIG||{}; if(!s) return;
 const schema={"@context":"https://schema.org","@type":"Service","name":s.title,"description":s.intro || s.short || '',"provider":{"@type":"Organization","name":cfg.siteName||'ALL FINANCE'},"url":(cfg.siteUrl||'').replace(/\/$/,'') + '/services/' + s.slug + '.html'};
 const sc=document.createElement('script'); sc.type='application/ld+json'; sc.textContent=JSON.stringify(schema); document.head.appendChild(sc);
})();
