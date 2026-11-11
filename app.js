const $ = id => document.getElementById(id);
let currentProject = null;

const translations = {
  en:{headline:"Turn your story into a storyboard.",intro:"Paste a story. My AI Studio will organize it into scenes, characters and visual prompts.",storyTitle:"1. Your story",storyHint:"Paste or write your story below.",analyze:"✦ Generate storyboard"},
  bn:{headline:"তোমার গল্পকে Storyboard-এ রূপ দাও।",intro:"গল্প লিখো বা paste করো। My AI Studio সেটিকে scene, character ও visual prompt-এ সাজাবে।",storyTitle:"১. তোমার গল্প",storyHint:"নিচে গল্প লিখো বা paste করো।",analyze:"✦ Storyboard তৈরি করো"},
  hi:{headline:"अपनी कहानी को स्टोरीबोर्ड में बदलें।",intro:"अपनी कहानी लिखें या paste करें। My AI Studio उसे scenes, characters और visual prompts में व्यवस्थित करेगा।",storyTitle:"१. आपकी कहानी",storyHint:"नीचे अपनी कहानी लिखें।",analyze:"✦ स्टोरीबोर्ड बनाएँ"},
  ur:{headline:"اپنی کہانی کو اسٹوری بورڈ میں بدلیں۔",intro:"اپنی کہانی لکھیں یا پیسٹ کریں۔ My AI Studio اسے مناظر، کرداروں اور visual prompts میں ترتیب دے گا۔",storyTitle:"۱. آپ کی کہانی",storyHint:"نیچے اپنی کہانی لکھیں۔",analyze:"✦ اسٹوری بورڈ بنائیں"}
};

// Known character names and aliases. Multi-word names are checked as one character.
const CHARACTER_DB = [
  {
    name: "Zayn",
    aliases: ["Zayn", "জেইন", "জাইন"],
    description: "17-year-old orphan boy with messy black hair and brown eyes, wearing simple dark medieval clothes; keep the same face, hairstyle, age and outfit design in every scene."
  },
  {
    name: "Phoenix",
    aliases: ["Phoenix", "the Phoenix", "ফিনিক্স"],
    description: "Gigantic magical golden bird with luminous golden feathers, burning wings and bright amber eyes; keep the same bird design, feather pattern and proportions in every scene."
  },
  {
    name: "Dark King",
    aliases: ["Dark King", "the Dark King"],
    description: "Tall sinister ruler wearing dark armor and a black crown, with glowing purple eyes; keep the same armor, crown, face and proportions in every scene."
  },
  {
    name: "Dark Creatures",
    aliases: ["dark creatures", "Dark Creatures"],
    description: "A group of frightening shadow creatures with smoky dark bodies and glowing eyes; maintain a consistent monster design."
  }
];

const NON_CHARACTER_WORDS = new Set([
  "Unlike","Everyone","One","Forbidden","Forest","Suddenly","The","For","But",
  "And","A","An","In","On","At","It","Its","He","She","They","His","Her",
  "When","While","After","Before","Then","There","Their","This","That",
  "From","Into","Through","Beyond","Other","First","Last","Now","Night",
  "Kingdom","Village","Mountain","Mountains","Castle","Sky","Heavens",
  "Ancient","Mysterious","Powerful","Greatest","Guardian","Warriors"
]);

const ENVIRONMENT_TERMS = [
  "Forbidden Forest",
  "Ancient Kingdom",
  "Small Village",
  "Dark King's Castle"
];

$("language").addEventListener("change", e => {
  const t = translations[e.target.value] || translations.en;
  $("headline").textContent = t.headline;
  $("intro").textContent = t.intro;
  $("storyTitle").textContent = t.storyTitle;
  $("storyHint").textContent = t.storyHint;
  $("analyzeBtn").textContent = t.analyze;
});

function splitStory(text) {
  const clean = text.trim().replace(/\r/g, "");
  let chunks = clean
    .split(/\n{2,}|(?<=[.!?।])\s+(?=[A-Zঅ-হআ-ঔ০-৯])/)
    .map(x => x.trim())
    .filter(Boolean);

  if (chunks.length < 2) {
    const sentences = clean.match(/[^.!?।]+[.!?।]?/g) || [clean];
    chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
      chunks.push(sentences.slice(i, i + 2).join(" ").trim());
    }
  }

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

function containsAlias(text, alias) {
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(alias)}(?=$|[^\\p{L}\\p{N}])`, "iu");
  return pattern.test(text);
}

function detectNames(text) {
  const found = [];

  // First detect known characters, including multi-word names.
  for (const character of CHARACTER_DB) {
    if (character.aliases.some(alias => containsAlias(text, alias))) {
      found.push(character.name);
    }
  }

  // Keep support for the names used by the original MVP, without treating
  // ordinary capitalized sentence words as people.
  const legacyNames = [
    "Ayan","আয়ান","আয়ান","রহিম","করিম","রাফি","সারা",
    "Maya","Arif","Rahim","Karim","Sara","Mira","Rohan","Zara"
  ];
  for (const name of legacyNames) {
    if (!found.includes(name) && containsAlias(text, name)) found.push(name);
  }

  // Conservative fallback for additional English proper names:
  // ignore sentence starters and common nouns/adjectives.
  const tokens = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
  for (const token of tokens) {
    if (NON_CHARACTER_WORDS.has(token)) continue;
    if (ENVIRONMENT_TERMS.some(term => term.toLowerCase().includes(token.toLowerCase()))) continue;
    if (found.some(name => name.toLowerCase() === token.toLowerCase())) continue;
    // Only accept likely names when they occur more than once in the story.
    const occurrences = text.match(new RegExp(`\\b${escapeRegex(token)}\\b`, "g")) || [];
    if (occurrences.length >= 2) found.push(token);
  }

  return [...new Set(found)].slice(0, 12);
}

function getCharacterDescription(name) {
  const known = CHARACTER_DB.find(c => c.name === name);
  if (known) return known.description;
  return `Keep ${name}'s face, age, hairstyle, clothing, body proportions and distinguishing features identical in every scene where this character appears.`;
}

function charactersInScene(scene, allNames) {
  return allNames.filter(name => {
    const known = CHARACTER_DB.find(c => c.name === name);
    const aliases = known ? known.aliases : [name];
    return aliases.some(alias => containsAlias(scene, alias));
  });
}

function makePrompt(scene, index, allNames) {
  const sceneNames = charactersInScene(scene, allNames);
  const characterReference = sceneNames.length
    ? sceneNames.map(name => `${name}: ${getCharacterDescription(name)}`).join("\n")
    : "No recurring named character detected in this scene; do not invent a new character reference.";

  return `Cinematic story illustration, scene ${index + 1}. ${scene}\nCharacter consistency references:\n${characterReference}\nDetailed environment, expressive emotion, dramatic cinematic lighting, coherent composition, high visual quality.`;
}

function analyze() {
  const story = $("story").value.trim();
  if (!story) {
    alert("Please paste your story first.");
    return;
  }

  const chunks = splitStory(story);
  const names = detectNames(story);

  currentProject = {
    id: Date.now(),
    name: $("projectName").value.trim() || "Untitled Story",
    story,
    characters: names.map(name => ({
      name,
      description: getCharacterDescription(name)
    })),
    scenes: chunks.map((scene, i) => ({
      title: `Scene ${i + 1}`,
      description: scene,
      prompt: makePrompt(scene, i, names)
    })),
    created: new Date().toISOString()
  };

  renderProject();
  $("results").classList.remove("hidden");
  $("characters").classList.remove("hidden");
  $("results").scrollIntoView({behavior: "smooth"});
}

function renderProject() {
  $("summary").innerHTML =
    `<span class="chip">${currentProject.scenes.length} scenes</span>` +
    `<span class="chip">${currentProject.characters.length} detected character(s)</span>` +
    `<span class="chip">${escapeHtml(currentProject.name)}</span>`;

  $("sceneList").innerHTML = "";
  currentProject.scenes.forEach((scene, i) => {
    const el = document.createElement("article");
    el.className = "scene";
    el.innerHTML =
      `<div class="scene-top"><h3>🎬 ${escapeHtml(scene.title)}</h3><span class="chip">Shot ${i + 1}</span></div>` +
      `<label>Scene description</label><textarea data-scene="${i}" data-field="description">${escapeHtml(scene.description)}</textarea>` +
      `<label>Visual prompt</label><textarea data-scene="${i}" data-field="prompt">${escapeHtml(scene.prompt)}</textarea>`;
    $("sceneList").appendChild(el);
  });

  $("characterList").innerHTML = "";
  currentProject.characters.forEach((character, i) => {
    const el = document.createElement("div");
    el.className = "character";
    el.innerHTML =
      `<strong>👤 ${escapeHtml(character.name)}</strong>` +
      `<label>Character reference description</label>` +
      `<input data-character="${i}" value="${escapeAttr(character.description)}">`;
    $("characterList").appendChild(el);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function syncEdits() {
  if (!currentProject) return;
  document.querySelectorAll("[data-scene]").forEach(el => {
    currentProject.scenes[+el.dataset.scene][el.dataset.field] = el.value;
  });
  document.querySelectorAll("[data-character]").forEach(el => {
    currentProject.characters[+el.dataset.character].description = el.value;
  });
}

function save() {
  if (!currentProject) return;
  syncEdits();
  const all = JSON.parse(localStorage.getItem("myAiStudioProjects") || "[]");
  const idx = all.findIndex(p => p.id === currentProject.id);
  if (idx >= 0) all[idx] = currentProject;
  else all.unshift(currentProject);
  localStorage.setItem("myAiStudioProjects", JSON.stringify(all));
  renderRecent();
  alert("Project saved on this device.");
}

function renderRecent() {
  const all = JSON.parse(localStorage.getItem("myAiStudioProjects") || "[]");
  $("recent").innerHTML = all.length
    ? all.slice(0, 5).map(p =>
        `<div class="recent-item"><span>${escapeHtml(p.name)} · ${p.scenes.length} scenes</span><button class="secondary" data-open="${p.id}">Open</button></div>`
      ).join("")
    : "No saved projects yet.";

  document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
      const project = all.find(p => p.id === +button.dataset.open);
      if (project) {
        currentProject = project;
        $("story").value = project.story;
        $("projectName").value = project.name;
        renderProject();
        $("results").classList.remove("hidden");
        $("characters").classList.remove("hidden");
      }
    });
  });
}

function download(filename, content, type) {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

$("analyzeBtn").addEventListener("click", analyze);
$("saveBtn").addEventListener("click", save);

$("exportBtn").addEventListener("click", () => {
  if (!currentProject) return;
  syncEdits();
  download("my-ai-studio-project.json", JSON.stringify(currentProject, null, 2), "application/json");
});

$("copyBtn").addEventListener("click", async () => {
  if (!currentProject) return;
  syncEdits();
  const prompts = currentProject.scenes.map(scene => scene.title + "\n" + scene.prompt).join("\n\n");
  try {
    await navigator.clipboard.writeText(prompts);
    alert("All prompts copied.");
  } catch (e) {
    alert("Clipboard not available. Export the project JSON instead.");
  }
});

renderRecent();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
