(function(){
  "use strict";
  const $ = (selector, parent=document) => parent.querySelector(selector);
  const state = { items: [], imageDataUrl: "" };
  const loginPanel = $("#loginPanel");
  const cmsPanel = $("#cmsPanel");
  const status = $("#status");
  const form = $("#newsForm");
  const posts = $("#posts");
  const warning = $("#cmsWarning");
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const slugify = value => String(value || "").toLowerCase().normalize("NFKD").replace(/[‘’']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120);
  function message(text, error=false){status.textContent=text;status.className=`status${error?" error":""}`;status.style.display="block";}
  async function api(url, options={}){
    const response = await fetch(url, { ...options, headers:{ "Content-Type":"application/json", ...(options.headers||{}) } });
    const data = await response.json().catch(()=>({ok:false,message:"Noma’lum xatolik"}));
    if(!response.ok || !data.ok) throw new Error(data.message || "Xatolik");
    return data;
  }
  async function check(){
    try{await api("/api/admin/status");showCms();await load();}catch{loginPanel.hidden=false;cmsPanel.hidden=true;}
  }
  function showCms(){loginPanel.hidden=true;cmsPanel.hidden=false;}
  $("#loginForm").addEventListener("submit",async event=>{
    event.preventDefault();
    const button=$("button",event.currentTarget);button.disabled=true;
    try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:$("#password").value})});showCms();await load();}
    catch(error){alert(error.message);}finally{button.disabled=false;}
  });
  $("#logoutBtn").addEventListener("click",async()=>{await api("/api/admin/logout",{method:"POST",body:"{}"}).catch(()=>{});location.reload();});
  $("#title").addEventListener("input",()=>{if(!$("#id").value)$("#slug").value=slugify($("#title").value);});
  $("#image").addEventListener("change",event=>{
    const file=event.target.files[0];state.imageDataUrl="";const preview=$("#preview");preview.style.display="none";
    if(!file)return;if(file.size>3*1024*1024){alert("Rasm 3 MB dan oshmasligi kerak");event.target.value="";return;}
    const reader=new FileReader();reader.onload=()=>{state.imageDataUrl=String(reader.result);preview.src=state.imageDataUrl;preview.style.display="block";};reader.readAsDataURL(file);
  });
  function reset(){form.reset();$("#id").value="";$("#published").checked=true;$("#published_at").value=new Date().toISOString().slice(0,16);state.imageDataUrl="";$("#preview").style.display="none";$("#saveBtn").textContent="Yangilikni saqlash";}
  $("#resetBtn").addEventListener("click",reset);
  form.addEventListener("submit",async event=>{
    event.preventDefault();const button=$("#saveBtn");button.disabled=true;message("Saqlanmoqda...");
    const fd=new FormData(form);const payload=Object.fromEntries(fd.entries());payload.published=$("#published").checked;payload.image_data_url=state.imageDataUrl;
    try{await api("/api/admin/news",{method:"POST",body:JSON.stringify(payload)});message("Yangilik muvaffaqiyatli saqlandi.");reset();await load();}
    catch(error){message(error.message,true);}finally{button.disabled=false;}
  });
  async function load(){
    try{
      const data=await api("/api/admin/news");state.items=data.items||[];warning.style.display=data.persistent?"none":"block";
      posts.innerHTML=state.items.length?state.items.map(item=>`<article class="post-row"><h3>${escapeHtml(item.title)}</h3><div class="post-meta"><span>${escapeHtml(item.category)}</span><span>${new Date(item.published_at).toLocaleDateString("uz-UZ")}</span><span>${item.published?"Nashr qilingan":"Qoralama"}</span></div><div class="post-buttons"><button class="btn outline" data-edit="${escapeHtml(item.id)}">Tahrirlash</button>${item.external_url?"":`<a class="btn outline" target="_blank" href="/maqola.html?slug=${encodeURIComponent(item.slug)}">Ko‘rish</a>`}<button class="btn danger" data-delete="${escapeHtml(item.id)}">O‘chirish</button></div></article>`).join(""):"<p>Yangiliklar mavjud emas.</p>";
    }catch(error){message(error.message,true);}
  }
  posts.addEventListener("click",async event=>{
    const edit=event.target.closest("[data-edit]");const del=event.target.closest("[data-delete]");
    if(edit){const item=state.items.find(x=>String(x.id)===edit.dataset.edit);if(!item)return;Object.entries(item).forEach(([key,value])=>{const el=$(`#${key}`);if(el&&key!=="published")el.value=value??"";});$("#published").checked=!!item.published;$("#published_at").value=new Date(item.published_at).toISOString().slice(0,16);$("#saveBtn").textContent="O‘zgarishlarni saqlash";if(item.image_url){$("#preview").src=item.image_url;$("#preview").style.display="block";}scrollTo({top:0,behavior:"smooth"});}
    if(del){if(!confirm("Yangilikni o‘chirasizmi?"))return;try{await api(`/api/admin/news/${encodeURIComponent(del.dataset.delete)}`,{method:"DELETE"});message("Yangilik o‘chirildi.");await load();}catch(error){message(error.message,true);}}
  });
  reset();check();
})();
