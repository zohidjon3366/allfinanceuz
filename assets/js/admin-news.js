const $ = id => document.getElementById(id);
let allNews = [];
let imageData = '';
let imageName = '';
let removeImage = false;

function showMessage(el, text, success = false){ el.textContent = text || ''; el.classList.toggle('success', success); }
function today(){ return new Date().toISOString().slice(0,10); }
function escapeHtml(v){ return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function htmlToText(html){
  const div=document.createElement('div'); div.innerHTML=html||'';
  div.querySelectorAll('h1,h2,h3,h4').forEach(el=>el.replaceWith(document.createTextNode(`\n## ${el.textContent.trim()}\n`)));
  div.querySelectorAll('li').forEach(el=>el.replaceWith(document.createTextNode(`\n- ${el.textContent.trim()}`)));
  div.querySelectorAll('p').forEach(el=>el.append(document.createTextNode('\n\n')));
  return div.textContent.replace(/\n{3,}/g,'\n\n').trim();
}
function textToPreviewHtml(value){
  const lines=String(value||'').replace(/\r/g,'').split('\n'); let out=''; let list=false;
  const close=()=>{if(list){out+='</ul>';list=false;}};
  lines.forEach(raw=>{const line=raw.trim();if(!line){close();return;}if(line.startsWith('## ')){close();out+=`<h3>${escapeHtml(line.slice(3))}</h3>`;}else if(line.startsWith('- ')){if(!list){out+='<ul>';list=true;}out+=`<li>${escapeHtml(line.slice(2))}</li>`;}else{close();out+=`<p>${escapeHtml(line)}</p>`;}}); close(); return out;
}
async function api(url, options={}){
  const res=await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  let data={}; try{data=await res.json();}catch{}
  if(res.status===401){ showLogin(); throw new Error(data.message||'Sessiya tugadi'); }
  if(!res.ok) throw new Error(data.message||'Xatolik yuz berdi'); return data;
}
function showLogin(){ $('loginView').classList.remove('hidden'); $('panelView').classList.add('hidden'); }
function showPanel(){ $('loginView').classList.add('hidden'); $('panelView').classList.remove('hidden'); }
async function checkSession(){ try{await api('/api/admin/session');showPanel();await loadNews();resetForm();}catch{showLogin();} }
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();showMessage($('loginMessage'),'');try{await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:$('password').value})});$('password').value='';showPanel();await loadNews();resetForm();}catch(err){showMessage($('loginMessage'),err.message);}});
$('logoutBtn').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST',body:'{}'});}finally{showLogin();}});
$('exportBtn').addEventListener('click',()=>{location.href='/api/admin/news/export';});
$('newBtn').addEventListener('click',resetForm);
$('searchInput').addEventListener('input',renderList);
$('statusFilter').addEventListener('change',renderList);

async function loadNews(){ allNews=await api('/api/admin/news'); renderList(); }
function renderList(){
  const q=$('searchInput').value.trim().toLowerCase(); const status=$('statusFilter').value;
  const items=allNews.filter(n=>(status==='all'||(n.status||'published')===status)&&(!q||`${n.title} ${n.category}`.toLowerCase().includes(q)));
  $('newsCount').textContent=allNews.length;
  $('newsList').innerHTML=items.length?items.map(n=>`<article class="news-item ${$('editingId').value===n.id?'active':''}"><div class="news-item-top"><div><span class="eyebrow">${escapeHtml(n.category)}</span><h3>${escapeHtml(n.title)}</h3></div><span class="status-chip ${(n.status||'published')}">${(n.status||'published')==='draft'?'Qoralama':'Nashr qilingan'}</span></div><p>${escapeHtml(n.date)} · ${escapeHtml(n.excerpt||'')}</p><div class="item-actions"><button data-edit="${escapeHtml(n.id)}">Tahrirlash</button><button class="delete" data-delete="${escapeHtml(n.id)}">O‘chirish</button></div></article>`).join(''):'<div class="news-item"><p>Yangilik topilmadi.</p></div>';
  $('newsList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editNews(b.dataset.edit));
  $('newsList').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteNews(b.dataset.delete));
}
function resetForm(){
  $('newsForm').reset(); $('editingId').value=''; $('formTitle').textContent='Yangi yangilik'; $('date').value=today(); $('status').value='published'; imageData='';imageName='';removeImage=false; $('imagePreviewWrap').classList.add('hidden'); $('imagePreview').removeAttribute('src'); showMessage($('formMessage'),''); renderList(); window.scrollTo({top:0,behavior:'smooth'});
}
function editNews(id){
  const n=allNews.find(x=>x.id===id);if(!n)return;
  $('editingId').value=n.id;$('formTitle').textContent='Yangilikni tahrirlash';$('title').value=n.title||'';$('category').value=n.category||'';$('date').value=n.date||today();$('status').value=n.status||'published';$('excerpt').value=n.excerpt||'';$('contentText').value=htmlToText(n.content||'');imageData='';imageName='';removeImage=false;
  if(n.image){$('imagePreview').src=n.image;$('imagePreviewWrap').classList.remove('hidden');}else{$('imagePreviewWrap').classList.add('hidden');}
  showMessage($('formMessage'),'');renderList();window.scrollTo({top:0,behavior:'smooth'});
}
$('imageFile').addEventListener('change',()=>{const f=$('imageFile').files[0];if(!f)return;if(f.size>3_000_000){showMessage($('formMessage'),'Rasm 3 MB dan katta bo‘lmasligi kerak');$('imageFile').value='';return;}const r=new FileReader();r.onload=()=>{imageData=r.result;imageName=f.name;removeImage=false;$('imagePreview').src=imageData;$('imagePreviewWrap').classList.remove('hidden');};r.readAsDataURL(f);});
$('removeImageBtn').addEventListener('click',()=>{imageData='';imageName='';removeImage=true;$('imageFile').value='';$('imagePreviewWrap').classList.add('hidden');});
$('newsForm').addEventListener('submit',async e=>{e.preventDefault();const id=$('editingId').value;const payload={title:$('title').value,category:$('category').value,date:$('date').value,status:$('status').value,excerpt:$('excerpt').value,contentText:$('contentText').value,imageData,imageName,removeImage};showMessage($('formMessage'),'Saqlanmoqda...');try{await api(id?`/api/admin/news/${encodeURIComponent(id)}`:'/api/admin/news',{method:id?'PUT':'POST',body:JSON.stringify(payload)});showMessage($('formMessage'),'Yangilik muvaffaqiyatli saqlandi.',true);await loadNews();if(!id)resetForm();else editNews(id);}catch(err){showMessage($('formMessage'),err.message);}});
async function deleteNews(id){const n=allNews.find(x=>x.id===id);if(!n||!confirm(`“${n.title}” yangiligini o‘chirasizmi?`))return;try{await api(`/api/admin/news/${encodeURIComponent(id)}`,{method:'DELETE'});if($('editingId').value===id)resetForm();await loadNews();}catch(err){alert(err.message);}}
$('previewBtn').addEventListener('click',()=>{$('previewArticle').innerHTML=`<div class="eyebrow">${escapeHtml($('category').value||'Kategoriya')} · ${escapeHtml($('date').value||today())}</div><h1>${escapeHtml($('title').value||'Yangilik sarlavhasi')}</h1><p class="lead">${escapeHtml($('excerpt').value||'Qisqa tavsif')}</p>${textToPreviewHtml($('contentText').value)}`;$('previewDialog').showModal();});
$('closePreview').addEventListener('click',()=>$('previewDialog').close());
checkSession();