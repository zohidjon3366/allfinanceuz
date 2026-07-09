const $ = id => document.getElementById(id);
const LANGS = ['uz', 'ru', 'en', 'zh'];
const LANG_LABELS = {uz: 'UZ', ru: 'RU', en: 'EN', zh: '中文'};
let allNews = [];
let imageData = '';
let imageName = '';
let removeImage = false;

function showMessage(el, text, success = false) {
  el.textContent = text || '';
  el.classList.toggle('success', success);
}
function today() { return new Date().toISOString().slice(0, 10); }
function escapeHtml(v) { return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function htmlToText(value) {
  const div = document.createElement('div');
  div.innerHTML = value || '';
  div.querySelectorAll('h1,h2,h3,h4').forEach(el => el.replaceWith(document.createTextNode(`\n## ${el.textContent.trim()}\n`)));
  div.querySelectorAll('li').forEach(el => el.replaceWith(document.createTextNode(`\n- ${el.textContent.trim()}`)));
  div.querySelectorAll('p').forEach(el => el.append(document.createTextNode('\n\n')));
  return div.textContent.replace(/\n{3,}/g, '\n\n').trim();
}
function textToPreviewHtml(value) {
  const lines = String(value || '').replace(/\r/g, '').split('\n');
  let out = '', list = false;
  const close = () => { if (list) { out += '</ul>'; list = false; } };
  lines.forEach(raw => {
    const line = raw.trim();
    if (!line) { close(); return; }
    if (line.startsWith('## ')) { close(); out += `<h3>${escapeHtml(line.slice(3))}</h3>`; }
    else if (line.startsWith('- ')) { if (!list) { out += '<ul>'; list = true; } out += `<li>${escapeHtml(line.slice(2))}</li>`; }
    else { close(); out += `<p>${escapeHtml(line)}</p>`; }
  });
  close();
  return out;
}
async function api(url, options = {}) {
  const res = await fetch(url, {headers: {'Content-Type': 'application/json', ...(options.headers || {})}, ...options});
  let data = {};
  try { data = await res.json(); } catch {}
  if (res.status === 401) { showLogin(); throw new Error(data.message || 'Sessiya tugadi'); }
  if (!res.ok) throw new Error(data.message || 'Xatolik yuz berdi');
  return data;
}
function showLogin() { $('loginView').classList.remove('hidden'); $('panelView').classList.add('hidden'); }
function showPanel() { $('loginView').classList.add('hidden'); $('panelView').classList.remove('hidden'); }
async function checkSession() { try { await api('/api/admin/session'); showPanel(); await loadNews(); resetForm(); } catch { showLogin(); } }

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault(); showMessage($('loginMessage'), '');
  try { await api('/api/admin/login', {method:'POST', body:JSON.stringify({password:$('password').value})}); $('password').value=''; showPanel(); await loadNews(); resetForm(); }
  catch (err) { showMessage($('loginMessage'), err.message); }
});
$('logoutBtn').addEventListener('click', async () => { try { await api('/api/admin/logout', {method:'POST', body:'{}'}); } finally { showLogin(); } });
$('exportBtn').addEventListener('click', () => location.href = '/api/admin/news/export');
$('fullBackupBtn')?.addEventListener('click', async () => {
  const btn = $('fullBackupBtn'); const old = btn.textContent; btn.disabled = true; btn.textContent = 'Backup...';
  try { const result = await api('/api/admin/backups/run', {method:'POST', body:'{}'}); alert(`Töliq backup yaratildi: ${result.name}`); }
  catch (err) { alert(err.message); }
  finally { btn.disabled = false; btn.textContent = old; }
});
$('newBtn').addEventListener('click', resetForm);
$('searchInput').addEventListener('input', renderList);
$('statusFilter').addEventListener('change', renderList);
document.querySelectorAll('[data-lang-tab]').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('[data-lang-tab]').forEach(x => x.classList.toggle('active', x === btn));
  document.querySelectorAll('[data-lang-panel]').forEach(x => x.classList.toggle('active', x.dataset.langPanel === btn.dataset.langTab));
}));

async function loadNews() { allNews = await api('/api/admin/news'); renderList(); }
function tr(n, l = 'uz') { return n.translations?.[l] || {}; }
function translationState(n, l) {
  const t = tr(n, l); const values = [t.title, t.category, t.excerpt, t.content].map(v => String(v || '').trim());
  if (values.every(Boolean)) return 'complete';
  if (values.some(Boolean)) return 'partial';
  return 'missing';
}
function languageBadges(n) {
  return `<div class="lang-status-badges">${LANGS.map(l => {
    const state = translationState(n, l);
    const title = state === 'complete' ? 'Töliq' : state === 'partial' ? 'Qisman' : 'Kiritilmagan';
    return `<span class="lang-status ${state} lang-${l}" title="${title}">${LANG_LABELS[l]}</span>`;
  }).join('')}</div>`;
}
function renderList() {
  const q = $('searchInput').value.trim().toLowerCase(), status = $('statusFilter').value;
  const items = allNews.filter(n => {
    const allText = LANGS.map(l => { const t=tr(n,l); return `${t.title||''} ${t.category||''}`; }).join(' ').toLowerCase();
    return (status === 'all' || (n.status || 'published') === status) && (!q || allText.includes(q));
  });
  $('newsCount').textContent = allNews.length;
  $('newsList').innerHTML = items.length ? items.map(n => {
    const u = tr(n); const fallbackTitle = LANGS.map(l => tr(n,l).title).find(Boolean) || 'Sarlavhasiz';
    return `<article class="news-item ${$('editingId').value === n.id ? 'active' : ''}"><div class="news-item-top"><div><span class="eyebrow">${escapeHtml(u.category || 'Yangilik')}</span><h3>${escapeHtml(u.title || fallbackTitle)}</h3></div><span class="status-chip ${n.status || 'published'}">${(n.status || 'published') === 'draft' ? 'Qoralama' : 'Naşr qilingan'}</span></div><p>${escapeHtml(n.date)}</p>${languageBadges(n)}<div class="item-actions"><button data-edit="${escapeHtml(n.id)}">Tahrirlaş</button><button class="delete" data-delete="${escapeHtml(n.id)}">Öçiriş</button></div></article>`;
  }).join('') : '<div class="news-item"><p>Yangilik topilmadi.</p></div>';
  $('newsList').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editNews(b.dataset.edit));
  $('newsList').querySelectorAll('[data-delete]').forEach(b => b.onclick = () => deleteNews(b.dataset.delete));
}
function resetForm() {
  $('newsForm').reset(); $('editingId').value=''; $('formTitle').textContent='Yangi yangilik'; $('date').value=today(); $('status').value='published';
  imageData=''; imageName=''; removeImage=false; $('imagePreviewWrap').classList.add('hidden'); $('imagePreview').removeAttribute('src');
  $('compressionInfo').textContent=''; showMessage($('formMessage'),''); renderList(); window.scrollTo({top:0, behavior:'smooth'});
}
function editNews(id) {
  const n=allNews.find(x=>x.id===id); if(!n) return;
  $('editingId').value=n.id; $('formTitle').textContent='Yangilikni tahrirlaş'; $('date').value=n.date||today(); $('status').value=n.status||'published';
  LANGS.forEach(l=>{ const x=tr(n,l); $(`title_${l}`).value=x.title||''; $(`category_${l}`).value=x.category||''; $(`excerpt_${l}`).value=x.excerpt||''; $(`contentText_${l}`).value=htmlToText(x.content||''); });
  imageData=''; imageName=''; removeImage=false; $('compressionInfo').textContent='';
  if(n.image){ $('imagePreview').src=n.image; $('imagePreviewWrap').classList.remove('hidden'); } else $('imagePreviewWrap').classList.add('hidden');
  showMessage($('formMessage'),''); renderList(); window.scrollTo({top:0,behavior:'smooth'});
}
function readBlobAsDataURL(blob) { return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(blob); }); }
async function compressImageFile(file) {
  if (file.size > 10_000_000) throw new Error('Rasm hajmi 10 MB dan oşmasligi kerak');
  const bitmap = 'createImageBitmap' in window ? await createImageBitmap(file) : await new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=URL.createObjectURL(file); });
  const maxW=1600, maxH=1200; const scale=Math.min(1,maxW/bitmap.width,maxH/bitmap.height);
  const width=Math.max(1,Math.round(bitmap.width*scale)), height=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false}); ctx.fillStyle='#fff'; ctx.fillRect(0,0,width,height); ctx.drawImage(bitmap,0,0,width,height);
  if (bitmap.close) bitmap.close();
  let quality=.84;
  let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
  while(blob && blob.size>1_800_000 && quality>.55){ quality-=.08; blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality)); }
  if(!blob) blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
  if(!blob) throw new Error('Rasmni siqib bölmadi');
  return {data:await readBlobAsDataURL(blob), name:(file.name.replace(/\.[^.]+$/,'')||'news')+'.webp', size:blob.size, width, height};
}
$('imageFile').addEventListener('change', async () => {
  const f=$('imageFile').files[0]; if(!f) return;
  showMessage($('formMessage'),'Rasm siqilmoqda...'); $('compressionInfo').textContent='';
  try {
    const compressed=await compressImageFile(f); imageData=compressed.data; imageName=compressed.name; removeImage=false;
    $('imagePreview').src=imageData; $('imagePreviewWrap').classList.remove('hidden');
    $('compressionInfo').textContent=`${(f.size/1024/1024).toFixed(2)} MB → ${(compressed.size/1024/1024).toFixed(2)} MB · ${compressed.width}×${compressed.height}`;
    showMessage($('formMessage'),'Rasm avtomatik siqildi.',true);
  } catch(err) { showMessage($('formMessage'),err.message); $('imageFile').value=''; }
});
$('removeImageBtn').addEventListener('click',()=>{ imageData=''; imageName=''; removeImage=true; $('imageFile').value=''; $('imagePreviewWrap').classList.add('hidden'); $('compressionInfo').textContent=''; });
$('newsForm').addEventListener('submit',async e=>{
  e.preventDefault(); const id=$('editingId').value; const translations={};
  LANGS.forEach(l=>translations[l]={title:$(`title_${l}`).value,category:$(`category_${l}`).value,excerpt:$(`excerpt_${l}`).value,contentText:$(`contentText_${l}`).value});
  const payload={date:$('date').value,status:$('status').value,translations,imageData,imageName,removeImage};
  showMessage($('formMessage'),'Saqlanmoqda...');
  try { await api(id?`/api/admin/news/${encodeURIComponent(id)}`:'/api/admin/news',{method:id?'PUT':'POST',body:JSON.stringify(payload)}); showMessage($('formMessage'),'Yangilik muvaffaqiyatli saqlandi.',true); await loadNews(); if(!id) resetForm(); else editNews(id); }
  catch(err){ showMessage($('formMessage'),err.message); }
});
async function deleteNews(id){ const n=allNews.find(x=>x.id===id),u=tr(n); if(!n||!confirm(`“${u.title||id}” yangiligini öçirasizmi?`))return; try{await api(`/api/admin/news/${encodeURIComponent(id)}`,{method:'DELETE'}); if($('editingId').value===id)resetForm(); await loadNews();}catch(err){alert(err.message);} }
$('previewBtn').addEventListener('click',()=>{ const active=document.querySelector('[data-lang-tab].active')?.dataset.langTab||'uz'; $('previewArticle').innerHTML=`<div class="eyebrow">${escapeHtml($(`category_${active}`).value||'Category')} · ${escapeHtml($('date').value||today())}</div><h1>${escapeHtml($(`title_${active}`).value||'Title')}</h1><p class="lead">${escapeHtml($(`excerpt_${active}`).value||'Short description')}</p>${textToPreviewHtml($(`contentText_${active}`).value)}`; $('previewDialog').showModal(); });
$('closePreview').addEventListener('click',()=>$('previewDialog').close());
checkSession();
