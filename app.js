const $ = id => document.getElementById(id);
let currentProject = null;
const translations = {
  en:{headline:"Turn your story into a storyboard.",intro:"Paste a story. My AI Studio will organize it into scenes, characters and visual prompts.",storyTitle:"1. Your story",storyHint:"Paste or write your story below.",analyze:"✦ Generate storyboard"},
  bn:{headline:"তোমার গল্পকে Storyboard-এ রূপ দাও।",intro:"গল্প লিখো বা paste করো। My AI Studio সেটিকে scene, character ও visual prompt-এ সাজাবে।",storyTitle:"১. তোমার গল্প",storyHint:"নিচে গল্প লিখো বা paste করো।",analyze:"✦ Storyboard তৈরি করো"},
  hi:{headline:"अपनी कहानी को स्टोरीबोर्ड में बदलें।",intro:"अपनी कहानी लिखें या paste करें। My AI Studio उसे scenes, characters और visual prompts में व्यवस्थित करेगा।",storyTitle:"१. आपकी कहानी",storyHint:"नीचे अपनी कहानी लिखें।",analyze:"✦ स्टोरीबोर्ड बनाएँ"},
  ur:{headline:"اپنی کہانی کو اسٹوری بورڈ میں بدلیں۔",intro:"اپنی کہانی لکھیں یا پیسٹ کریں۔ My AI Studio اسے مناظر، کرداروں اور visual prompts میں ترتیب دے گا۔",storyTitle:"۱. آپ کی کہانی",storyHint:"نیچے اپنی کہانی لکھیں۔",analyze:"✦ اسٹوری بورڈ بنائیں"}
};
$("language").addEventListener("change",e=>{
 const t=translations[e.target.value]; $("headline").textContent=t.headline;$("intro").textContent=t.intro;$("storyTitle").textContent=t.storyTitle;$("storyHint").textContent=t.storyHint;$("analyzeBtn").textContent=t.analyze;
});

function splitStory(text){
 let clean=text.trim().replace(/\r/g,"");
 let chunks=clean.split(/\n{2,}|(?<=[.!?।])\s+(?=[A-Zঅ-হআ-ঔ০-৯])/).map(x=>x.trim()).filter(Boolean);
 if(chunks.length<2){
   const sentences=clean.match(/[^.!?।]+[.!?।]?/g)||[clean];
   chunks=[];for(let i=0;i<sentences.length;i+=2)chunks.push(sentences.slice(i,i+2).join(" ").trim());
 }
 if(chunks.length===1 && chunks[0].length>380){
   const words=chunks[0].split(/\s+/);chunks=[];for(let i=0;i<words.length;i+=65)chunks.push(words.slice(i,i+65).join(" "));
 }
 return chunks.slice(0,20);
}
function detectNames(text){
 const patterns=[
  /\b(?:Ayan|আয়ান|আয়ান|রহিম|করিম|রাফি|সারা|Maya|Arif|Rahim|Karim|Sara|Mira|Rohan|Zara)\b/g,
  /\b[A-Z][a-z]{2,}\b/g
 ];
 const found=new Set();patterns.forEach(p=>{for(const m of text.matchAll(p))found.add(m[0]);});
 return [...found].slice(0,12);
}
function makePrompt(scene,index,characters){
 const chars=characters.length?characters.join(", "):"main story character";
 return `Cinematic story illustration, scene ${index+1}. ${scene}\nMaintain consistent appearance for: ${chars}.\nDetailed environment, expressive emotion, dramatic cinematic lighting, coherent composition, high visual quality.`;
}
function analyze(){
 const story=$("story").value.trim();if(!story){alert("Please paste your story first.");return;}
 const chunks=splitStory(story);const names=detectNames(story);
 currentProject={id:Date.now(),name:$("projectName").value.trim()||"Untitled Story",story,characters:names.map(n=>({name:n,description:`Describe the appearance, age, clothing and distinguishing features of ${n}. Keep this design consistent in every scene.`})),scenes:chunks.map((s,i)=>({title:`Scene ${i+1}`,description:s,prompt:makePrompt(s,i,names)})),created:new Date().toISOString()};
 renderProject();$("results").classList.remove("hidden");$("characters").classList.remove("hidden");$("results").scrollIntoView({behavior:"smooth"});
}
function renderProject(){
 $("summary").innerHTML=`<span class="chip">${currentProject.scenes.length} scenes</span><span class="chip">${currentProject.characters.length} detected character(s)</span><span class="chip">${escapeHtml(currentProject.name)}</span>`;
 $("sceneList").innerHTML="";
 currentProject.scenes.forEach((s,i)=>{
  const el=document.createElement("article");el.className="scene";
  el.innerHTML=`<div class="scene-top"><h3>🎬 ${escapeHtml(s.title)}</h3><span class="chip">Shot ${i+1}</span></div><label>Scene description</label><textarea data-scene="${i}" data-field="description">${escapeHtml(s.description)}</textarea><label>Visual prompt</label><textarea data-scene="${i}" data-field="prompt">${escapeHtml(s.prompt)}</textarea>`;
  $("sceneList").appendChild(el);
 });
 $("characterList").innerHTML="";
 currentProject.characters.forEach((c,i)=>{
  const el=document.createElement("div");el.className="character";
  el.innerHTML=`<strong>👤 ${escapeHtml(c.name)}</strong><label>Character reference description</label><input data-character="${i}" value="${escapeAttr(c.description)}">`;
  $("characterList").appendChild(el);
 });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function escapeAttr(s){return escapeHtml(s);}
function syncEdits(){
 if(!currentProject)return;
 document.querySelectorAll("[data-scene]").forEach(el=>currentProject.scenes[+el.dataset.scene][el.dataset.field]=el.value);
 document.querySelectorAll("[data-character]").forEach(el=>currentProject.characters[+el.dataset.character].description=el.value);
}
function save(){
 if(!currentProject)return;syncEdits();
 const all=JSON.parse(localStorage.getItem("myAiStudioProjects")||"[]");
 const idx=all.findIndex(p=>p.id===currentProject.id);if(idx>=0)all[idx]=currentProject;else all.unshift(currentProject);
 localStorage.setItem("myAiStudioProjects",JSON.stringify(all));renderRecent();alert("Project saved on this device.");
}
function renderRecent(){
 const all=JSON.parse(localStorage.getItem("myAiStudioProjects")||"[]");
 $("recent").innerHTML=all.length?all.slice(0,5).map(p=>`<div class="recent-item"><span>${escapeHtml(p.name)} · ${p.scenes.length} scenes</span><button class="secondary" data-open="${p.id}">Open</button></div>`).join(""):"No saved projects yet.";
 document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{const p=all.find(x=>x.id===+b.dataset.open);if(p){currentProject=p;$("story").value=p.story;$("projectName").value=p.name;renderProject();$("results").classList.remove("hidden");$("characters").classList.remove("hidden");}}));
}
function download(filename,content,type){
 const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
$("analyzeBtn").addEventListener("click",analyze);
$("saveBtn").addEventListener("click",save);
$("exportBtn").addEventListener("click",()=>{if(!currentProject)return;syncEdits();download("my-ai-studio-project.json",JSON.stringify(currentProject,null,2),"application/json");});
$("copyBtn").addEventListener("click",async()=>{if(!currentProject)return;syncEdits();const text=currentProject.scenes.map(s=>s.title+"\n"+s.prompt).join("\n\n");try{await navigator.clipboard.writeText(text);alert("All prompts copied.");}catch(e){alert("Clipboard not available. Export the project JSON instead.");}});
renderRecent();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
