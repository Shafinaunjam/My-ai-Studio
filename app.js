const $ = id => document.getElementById(id);
let currentProject = null;

const translations = {
  en:{headline:"Turn your story into a storyboard.",intro:"Paste a story. My AI Studio will organize it into scenes, characters and visual prompts.",storyTitle:"1. Your story",storyHint:"Paste or write your story below.",analyze:"✦ Generate storyboard"},
  bn:{headline:"তোমার গল্পকে Storyboard-এ রূপ দাও।",intro:"গল্প লিখো বা paste করো। My AI Studio সেটিকে scene, character ও visual prompt-এ সাজাবে।",storyTitle:"১. তোমার গল্প",storyHint:"নিচে গল্প লিখো বা paste করো।",analyze:"✦ Storyboard তৈরি করো"},
  hi:{headline:"अपनी कहानी को स्टोरीबोर्ड में बदलें।",intro:"अपनी कहानी लिखें या paste करें। My AI Studio उसे scenes, characters और visual prompts में व्यवस्थित करेगा।",storyTitle:"१. आपकी कहानी",storyHint:"नीचे अपनी कहानी लिखें।",analyze:"✦ स्टोरीबोर्ड बनाएँ"},
  ur:{headline:"اپنی کہانی کو اسٹوری بورڈ میں بدلیں۔",intro:"اپنی کہانی لکھیں یا پیسٹ کریں۔ My AI Studio اسے مناظر، کرداروں اور visual prompts میں ترتیب دے گا۔",storyTitle:"۱. آپ کی کہانی",storyHint:"نیچے اپنی کہانی لکھیں۔",analyze:"✦ اسٹوری بورڈ بنائیں"}
};

// Character names are detected ONLY from this database or explicit
// "named/called" introductions. Ordinary capitalized words are ignored.
const CHARACTER_DB = [
  {name:"Arin", aliases:["Arin"], description:"17-year-old orphan boy, messy dark hair, brown eyes, simple dark medieval clothes. Keep his face, hairstyle, age and outfit consistent. In later scenes he may carry a magical silver sword."},
  {name:"Drakor", aliases:["Drakor","silver dragon","the dragon"], description:"Enormous majestic silver dragon with glowing blue eyes, detailed silver scales and powerful wings. Keep the same head, horns, scale pattern, eye color and proportions in every scene."},
  {name:"Lyra", aliases:["Lyra"], description:"Mysterious young girl wearing a dark blue cloak and carrying a glowing crystal staff. Keep her face, hair, cloak and staff design consistent."},
  {name:"Malgor", aliases:["Malgor"], description:"Terrifying evil sorcerer with long white hair, black armor and glowing red eyes. Keep his face, hair, armor and eye color consistent."},
  {name:"Shadow Monsters", aliases:["shadow monsters","army of shadow monsters"], description:"An army of dark smoky shadow creatures with glowing eyes. Keep their smoky bodies, silhouettes and glowing eyes visually consistent."}
];

const ENVIRONMENT_DB = [
  {name:"Ancient Kingdom", aliases:["kingdom","ancient kingdom","ancient kingdoms"]},
  {name:"Small Village", aliases:["small village","village"]},
  {name:"Forbidden Forest", aliases:["Forbidden Forest"]},
  {name:"Ancient Cave", aliases:["ancient cave","cave"]},
  {name:"Dark Castle", aliases:["dark castle","castle"]},
  {name:"Mountains", aliases:["mountains","mountain"]}
];

$("language").addEventListener("change", e => {
  const t = translations[e.target.value] || translations.en;
  $("headline").textContent=t.headline;
  $("intro").textContent=t.intro;
  $("storyTitle").textContent=t.storyTitle;
  $("storyHint").textContent=t.storyHint;
  $("analyzeBtn").textContent=t.analyze;
});

function splitStory(text) {
  let clean = text.trim().replace(/\r/g, "");

  // Protect common titles/abbreviations so "Mr. Anderson" stays together.
  const abbreviations = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "St.", "Jr.", "Sr."];
  const placeholders = [];
  abbreviations.forEach((abbr, i) => {
    const token = `__ABBR_${i}__`;
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    clean = clean.replace(new RegExp(escaped, "g"), token);
    placeholders.push([token, abbr]);
  });

  let chunks = clean
    .split(/\n{2,}|(?<=[!?।])\s+(?=[A-Zঅ-হআ-ঔ০-৯])|(?<=\.)\s+(?=[A-Zঅ-হআ-ঔ০-৯])/)
    .map(x => x.trim())
    .filter(Boolean);

  // Remove a standalone short title from the scene list.
  if (chunks.length > 1 && chunks[0].length <= 90 && !/[.!?।]$/.test(chunks[0])) {
    chunks.shift();
  }

  if (chunks.length < 2) {
    const sentences = clean.match(/[^.!?।]+[.!?।]?/g) || [clean];
    chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
      chunks.push(sentences.slice(i, i + 2).join(" ").trim());
    }
  }

  // Restore abbreviations after splitting.
  chunks = chunks.map(chunk => {
    for (const [token, abbr] of placeholders) {
      chunk = chunk.replaceAll(token, abbr);
    }
    return chunk;
  });

  if (chunks.length === 1 && chunks[0].length > 380) {
    const words = chunks[0].split(/\s+/);
    chunks = [];
    for (let i = 0; i < words.length; i += 65) {
      chunks.push(words.slice(i, i + 65).join(" "));
    }
  }

  return chunks.slice(0, 20);
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text, phrase) {
  const escaped = escapeRegex(phrase);
  const pattern = new RegExp("(^|[^\\p{L}\\p{N}])" + escaped + "(?=$|[^\\p{L}\\p{N}])", "iu");
  return pattern.test(text);
}

function discoverCustomCharacters(text) {
  const pattern = /\b(?:named|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g;
  for (const match of text.matchAll(pattern)) {
    const name = match[1].trim();
    if (!CHARACTER_DB.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      CHARACTER_DB.push({
        name,
        aliases:[name],
        description:`Story character ${name}. Keep the same face, age, hairstyle, clothing, colors and body proportions in every scene.`
      });
    }
  }
}

function detectCharacters(text) {
  const found = [];
  for (const character of CHARACTER_DB) {
    if (character.aliases.some(alias => containsPhrase(text, alias))) {
      found.push(character.name);
    }
  }
  return found;
}

function detectEnvironments(text) {
  return ENVIRONMENT_DB
    .filter(place => place.aliases.some(alias => containsPhrase(text, alias)))
    .map(place => place.name);
}

function characterDescription(name) {
  return CHARACTER_DB.find(c => c.name === name)?.description ||
    `Maintain the same visual design for ${name} in every scene.`;
}

function makePrompt(scene, index) {
  const names = detectCharacters(scene);
  const places = detectEnvironments(scene);

  const characterBlock = names.length
    ? names.map(name => `${name}: ${characterDescription(name)}`).join("\n")
    : "No named character is explicitly identified in this scene. Do not invent character names.";

  const environmentBlock = places.length
    ? places.join(", ")
    : "Environment should follow the location described in the scene.";

  return `MY AI STUDIO CHARACTER ENGINE V3. Cinematic story illustration, scene ${index+1}. ${scene}

CHARACTER CONSISTENCY:
${characterBlock}

ENVIRONMENT:
${environmentBlock}

Detailed environment, expressive emotion, dramatic cinematic lighting, coherent composition, high visual quality.`;
}

function analyze() {
  const story = $("story").value.trim();
  if (!story) {
    alert("Please paste your story first.");
    return;
  }

  discoverCustomCharacters(story);
  const chunks = splitStory(story);
  const allNames = [...new Set(chunks.flatMap(scene => detectCharacters(scene)))];

  currentProject = {
    id:Date.now(),
    name:$("projectName").value.trim() || "Untitled Story",
    story,
    characters:allNames.map(name => ({name,description:characterDescription(name)})),
    environments:[...new Set(chunks.flatMap(scene => detectEnvironments(scene)))],
    scenes:chunks.map((scene,i) => ({
      title:`Scene ${i+1}`,
      description:scene,
      characters:detectCharacters(scene),
      environments:detectEnvironments(scene),
      prompt:makePrompt(scene,i)
    })),
    created:new Date().toISOString()
  };

  renderProject();
  $("results").classList.remove("hidden");
  $("characters").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth"});
}

function renderProject() {
  $("summary").innerHTML =
    `<span class="chip">${currentProject.scenes.length} scenes</span>`+
    `<span class="chip">${currentProject.characters.length} detected character(s)</span>`+
    `<span class="chip">${escapeHtml(currentProject.name)}</span>`;

  $("sceneList").innerHTML="";
  currentProject.scenes.forEach((s,i)=>{
    const el=document.createElement("article");
    el.className="scene";
    el.innerHTML=
      `<div class="scene-top"><h3>🎬 ${escapeHtml(s.title)}</h3><span class="chip">Shot ${i+1}</span></div>`+
      `<label>Scene description</label><textarea data-scene="${i}" data-field="description">${escapeHtml(s.description)}</textarea>`+
      `<label>Visual prompt</label><textarea data-scene="${i}" data-field="prompt">${escapeHtml(s.prompt)}</textarea>`+
      `<small>Characters: ${escapeHtml(s.characters.join(", ") || "None detected")} · Environment: ${escapeHtml(s.environments.join(", ") || "Not detected")}</small>`;
    $("sceneList").appendChild(el);
  });

  $("characterList").innerHTML="";
  currentProject.characters.forEach((c,i)=>{
    const el=document.createElement("div");
    el.className="character";
    el.innerHTML=`<strong>👤 ${escapeHtml(c.name)}</strong><label>Character reference description</label><input data-character="${i}" value="${escapeAttr(c.description)}">`;
    $("characterList").appendChild(el);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

function syncEdits() {
  if (!currentProject) return;
  document.querySelectorAll("[data-scene]").forEach(el=>{
    currentProject.scenes[+el.dataset.scene][el.dataset.field]=el.value;
  });
  document.querySelectorAll("[data-character]").forEach(el=>{
    currentProject.characters[+el.dataset.character].description=el.value;
  });
}

function save() {
  if (!currentProject) return;
  syncEdits();
  const all=JSON.parse(localStorage.getItem("myAiStudioProjects")||"[]");
  const idx=all.findIndex(p=>p.id===currentProject.id);
  if(idx>=0) all[idx]=currentProject; else all.unshift(currentProject);
  localStorage.setItem("myAiStudioProjects",JSON.stringify(all));
  renderRecent();
  alert("Project saved on this device.");
}

function renderRecent() {
  const all=JSON.parse(localStorage.getItem("myAiStudioProjects")||"[]");
  $("recent").innerHTML=all.length
    ? all.slice(0,5).map(p=>`<div class="recent-item"><span>${escapeHtml(p.name)} · ${p.scenes.length} scenes</span><button class="secondary" data-open="${p.id}">Open</button></div>`).join("")
    : "No saved projects yet.";

  document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{
    const p=all.find(x=>x.id===+b.dataset.open);
    if(p){
      currentProject=p;
      $("story").value=p.story;
      $("projectName").value=p.name;
      renderProject();
      $("results").classList.remove("hidden");
      $("characters").classList.remove("hidden");
    }
  }));
}

function download(filename,content,type) {
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}

$("analyzeBtn").addEventListener("click",analyze);
$("saveBtn").addEventListener("click",save);
$("exportBtn").addEventListener("click",()=>{
  if(!currentProject)return;
  syncEdits();
  download("my-ai-studio-project.json",JSON.stringify(currentProject,null,2),"application/json");
});
$("copyBtn").addEventListener("click",async()=>{
  if(!currentProject)return;
  syncEdits();
  const text=currentProject.scenes.map(s=>s.title+"\n"+s.prompt).join("\n\n");
  try {
    await navigator.clipboard.writeText(text);
    alert("All prompts copied.");
  } catch(e) {
    alert("Clipboard not available. Export the project JSON instead.");
  }
});

renderRecent();
if("serviceWorker" in navigator) {
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
