const $ = id => document.getElementById(id);
let currentProject = null;

// ------------------------------------------------------------
// MY AI STUDIO — Storyboard + Character Consistency Engine
// ------------------------------------------------------------

const translations = {
  en: {
    headline: "Turn your story into a storyboard.",
    intro: "Paste a story. My AI Studio will organize it into scenes, characters and visual prompts.",
    storyTitle: "1. Your story",
    storyHint: "Paste or write your story below.",
    analyze: "✦ Generate storyboard"
  },
  bn: {
    headline: "তোমার গল্পকে Storyboard-এ রূপ দাও।",
    intro: "গল্প লিখো বা paste করো। My AI Studio সেটিকে scene, character ও visual prompt-এ সাজাবে।",
    storyTitle: "১. তোমার গল্প",
    storyHint: "নিচে গল্প লিখো বা paste করো।",
    analyze: "✦ Storyboard তৈরি করো"
  },
  hi: {
    headline: "अपनी कहानी को स्टोरीबोर्ड में बदलें।",
    intro: "अपनी कहानी लिखें या paste करें। My AI Studio उसे scenes, characters और visual prompts में व्यवस्थित करेगा।",
    storyTitle: "१. आपकी कहानी",
    storyHint: "नीचे अपनी कहानी लिखें।",
    analyze: "✦ स्टोरीबोर्ड बनाएँ"
  },
  ur: {
    headline: "اپنی کہانی کو اسٹوری بورڈ میں بدلیں۔",
    intro: "اپنی کہانی لکھیں یا پیسٹ کریں۔ My AI Studio اسے مناظر، کرداروں اور visual prompts میں ترتیب دے گا۔",
    storyTitle: "۱. آپ کی کہانی",
    storyHint: "نیچے اپنی کہانی لکھیں۔",
    analyze: "✦ اسٹوری بورڈ بنائیں"
  }
};

// Built-in characters. Add more story-specific characters here when needed.
// Generic words such as "the", "she", "together", "after" are NEVER character names.
const BUILTIN_CHARACTERS = [
  {
    name: "Leo",
    aliases: ["Leo", "little lion", "lion cub", "the lion cub"],
    description: "A cute small lion cub with fluffy golden fur, big amber eyes, tiny rounded ears, a small black nose and a small fluffy tail. Keep exactly the same face, fur color, eye color, body size, ear shape and proportions in every scene."
  },
  {
    name: "Mama Lion",
    aliases: ["Mama Lion", "mother lion", "lioness"],
    description: "An adult golden lioness with smooth golden fur, kind amber eyes, a gentle expression and a graceful strong body. She has no mane. Keep exactly the same face, fur color, eye color, body size and proportions in every scene."
  },
  {
    name: "Mia",
    aliases: ["Mia", "little girl", "the girl"],
    description: "A little girl with straight black hair, a pink dress and white shoes. Keep exactly the same face, hairstyle, hair length, dress design, clothing colors, age and body proportions in every scene."
  },
  {
    name: "Arin",
    aliases: ["Arin"],
    description: "A 17-year-old orphan boy with messy dark hair, brown eyes and simple dark medieval clothes. Keep his face, hairstyle, age and outfit consistent."
  },
  {
    name: "Drakor",
    aliases: ["Drakor", "silver dragon", "the dragon"],
    description: "An enormous majestic silver dragon with glowing blue eyes, detailed silver scales and powerful wings. Keep the same head, horns, scale pattern, eye color and proportions in every scene."
  },
  {
    name: "Lyra",
    aliases: ["Lyra"],
    description: "A mysterious young girl wearing a dark blue cloak and carrying a glowing crystal staff. Keep her face, hair, cloak and staff design consistent."
  },
  {
    name: "Malgor",
    aliases: ["Malgor"],
    description: "A terrifying evil sorcerer with long white hair, black armor and glowing red eyes. Keep his face, hair, armor and eye color consistent."
  },
  {
    name: "Shadow Monsters",
    aliases: ["shadow monsters", "army of shadow monsters"],
    description: "An army of dark smoky shadow creatures with glowing eyes. Keep their smoky bodies, silhouettes and glowing eyes visually consistent."
  }
];

const CHARACTER_DB = BUILTIN_CHARACTERS.map(c => ({ ...c, aliases: [...c.aliases] }));

const ENVIRONMENT_DB = [
  { name: "Jungle", aliases: ["jungle", "forest"] },
  { name: "River", aliases: ["river", "riverbank", "waterfall", "stream"] },
  { name: "Small Village", aliases: ["small village", "village"] },
  { name: "Ancient Kingdom", aliases: ["kingdom", "ancient kingdom", "ancient kingdoms"] },
  { name: "Forbidden Forest", aliases: ["forbidden forest"] },
  { name: "Ancient Cave", aliases: ["ancient cave", "cave"] },
  { name: "Dark Castle", aliases: ["dark castle", "castle"] },
  { name: "Mountains", aliases: ["mountains", "mountain"] }
];

const VISUAL_STYLE =
  "High-quality 3D animated family movie, cinematic composition, expressive emotions, detailed environment, beautiful natural lighting, consistent character design, professional animation-film quality, 16:9 widescreen, no text, no subtitles, no logo, no watermark.";

function safeText(id) {
  const element = $(id);
  return element ? element.value : "";
}

function updateLanguage(language) {
  const t = translations[language] || translations.en;
  const fields = [
    ["headline", "headline"],
    ["intro", "intro"],
    ["storyTitle", "storyTitle"],
    ["storyHint", "storyHint"],
    ["analyzeBtn", "analyze"]
  ];

  fields.forEach(([id, key]) => {
    const element = $(id);
    if (element) element.textContent = t[key];
  });
}

if ($("language")) {
  $("language").addEventListener("change", e => updateLanguage(e.target.value));
}

// Split the story into readable scene-sized units without splitting common titles.
function splitStory(text) {
  let clean = String(text || "").trim().replace(/\r/g, "");
  if (!clean) return [];

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

  // Remove a short heading such as "The Brave Little Lion".
  if (
    chunks.length > 1 &&
    chunks[0].length <= 90 &&
    !/[.!?।]$/.test(chunks[0])
  ) {
    chunks.shift();
  }

  if (chunks.length < 2) {
    const sentences = clean.match(/[^.!?।]+[.!?।]?/g) || [clean];
    chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const part = sentences.slice(i, i + 2).join(" ").trim();
      if (part) chunks.push(part);
    }
  }

  chunks = chunks.map(chunk => {
    for (const [token, abbr] of placeholders) {
      chunk = chunk.replaceAll(token, abbr);
    }
    return chunk;
  });

  // Avoid one very long scene if the input has no sentence punctuation.
  if (chunks.length === 1 && chunks[0].length > 380) {
    const words = chunks[0].split(/\s+/);
    chunks = [];
    for (let i = 0; i < words.length; i += 65) {
      chunks.push(words.slice(i, i + 65).join(" "));
    }
  }

  return chunks.slice(0, 30);
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text, phrase) {
  if (!phrase) return false;
  const escaped = escapeRegex(phrase.trim());
  const pattern = new RegExp(
    "(^|[^\\p{L}\\p{N}])" + escaped + "(?=$|[^\\p{L}\\p{N}])",
    "iu"
  );
  return pattern.test(text);
}

// Detect only explicitly introduced proper names. Do not add ordinary words.
function discoverCustomCharacters(text) {
  const pattern = /\b(?:named|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g;
  const reserved = new Set([
    "The", "This", "That", "When", "After", "Before", "Without",
    "Although", "Together", "Suddenly", "From", "Once", "One"
  ]);

  for (const match of text.matchAll(pattern)) {
    const name = match[1].trim();
    if (reserved.has(name.split(/\s+/)[0])) continue;

    const exists = CHARACTER_DB.some(
      c => c.name.toLowerCase() === name.toLowerCase()
    );

    if (!exists) {
      CHARACTER_DB.push({
        name,
        aliases: [name],
        description: `A story character named ${name}. Keep the same face, age, hairstyle, clothing, colors, body shape and proportions in every scene.`
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
  return [...new Set(found)];
}

function detectEnvironments(text) {
  return ENVIRONMENT_DB
    .filter(place => place.aliases.some(alias => containsPhrase(text, alias)))
    .map(place => place.name);
}

function characterDescription(name) {
  const character = CHARACTER_DB.find(
    c => c.name.toLowerCase() === String(name).toLowerCase()
  );
  return character
    ? character.description
    : `Story character ${name}. Keep exactly the same visual appearance in every scene.`;
}

function getSceneCast(scene, allNames) {
  const detected = detectCharacters(scene);
  // Resolve pronouns by using the scene's detected characters only.
  // The full cast is described separately in every prompt for consistency.
  return detected.filter(name => allNames.includes(name));
}

function makePrompt(scene, index, allNames, allPlaces) {
  const sceneNames = getSceneCast(scene, allNames);
  const scenePlaces = detectEnvironments(scene);
  const castNames = allNames.length ? allNames : [];

  const fullCharacterReference = castNames.length
    ? castNames.map(name => `${name}: ${characterDescription(name)}`).join("\n")
    : "No confirmed named characters. Follow only the characters explicitly described in this scene.";

  const sceneCharacterInstruction = sceneNames.length
    ? `CHARACTERS TO SHOW IN THIS SCENE:\n${sceneNames.join(", ")}.\nShow only these characters if they are explicitly present in the scene.`
    : "CHARACTERS TO SHOW IN THIS SCENE:\nUse the story context to show only the character or characters who are actually present. Do not add the entire cast automatically.";

  const environmentReference = scenePlaces.length
    ? scenePlaces.join(", ")
    : (allPlaces.length
        ? `Story locations for visual continuity: ${allPlaces.join(", ")}. Choose the location that matches this scene's action.`
        : "Use the location described in the scene and keep the story world visually coherent.");

  return `MY AI STUDIO — CONSISTENT STORYBOARD PROMPT
SCENE ${index + 1}

SCENE ACTION:
${scene}

GLOBAL CHARACTER REFERENCE — KEEP THESE DESIGNS IDENTICAL THROUGHOUT THE WHOLE STORY:
${fullCharacterReference}

${sceneCharacterInstruction}

ENVIRONMENT AND CONTINUITY:
${environmentReference}
Keep the jungle, river, rocks, trees, water and lighting geographically coherent when the scene returns to the same location. Preserve the same character scale and visual style between shots.

VISUAL DIRECTION:
${VISUAL_STYLE}

IMPORTANT:
Do not turn ordinary words, pronouns or conjunctions into characters. Do not change character faces, fur colors, clothing, age, hairstyle or proportions. Depict the exact action described in this scene.`;
}

function analyze() {
  const story = safeText("story").trim();

  if (!story) {
    alert("Please paste your story first.");
    return;
  }

  discoverCustomCharacters(story);

  const chunks = splitStory(story);
  if (!chunks.length) {
    alert("Please enter a readable story.");
    return;
  }

  const allNames = [...new Set(chunks.flatMap(scene => detectCharacters(scene)))];
  const allPlaces = [...new Set(chunks.flatMap(scene => detectEnvironments(scene)))];

  currentProject = {
    id: Date.now(),
    name: safeText("projectName").trim() || "Untitled Story",
    story,
    characters: allNames.map(name => ({
      name,
      description: characterDescription(name)
    })),
    environments: allPlaces,
    scenes: chunks.map((scene, i) => ({
      title: `Scene ${i + 1}`,
      description: scene,
      characters: detectCharacters(scene),
      environments: detectEnvironments(scene),
      prompt: makePrompt(scene, i, allNames, allPlaces)
    })),
    created: new Date().toISOString()
  };

  renderProject();
  if ($("results")) {
    $("results").classList.remove("hidden");
    $("results").scrollIntoView({ behavior: "smooth" });
  }
  if ($("characters")) $("characters").classList.remove("hidden");
}

function renderProject() {
  if (!currentProject) return;

  if ($("summary")) {
    $("summary").innerHTML =
      `<span class="chip">${currentProject.scenes.length} scenes</span>` +
      `<span class="chip">${currentProject.characters.length} detected character(s)</span>` +
      `<span class="chip">${escapeHtml(currentProject.name)}</span>`;
  }

  if ($("sceneList")) {
    $("sceneList").innerHTML = "";

    currentProject.scenes.forEach((scene, i) => {
      const el = document.createElement("article");
      el.className = "scene";

      const descriptionLabel = document.createElement("label");
      descriptionLabel.textContent = "Scene description";

      const description = document.createElement("textarea");
      description.value = scene.description;
      description.dataset.scene = String(i);
      description.dataset.field = "description";

      const promptLabel = document.createElement("label");
      promptLabel.textContent = "Visual prompt";

      const prompt = document.createElement("textarea");
      prompt.value = scene.prompt;
      prompt.dataset.scene = String(i);
      prompt.dataset.field = "prompt";

      const top = document.createElement("div");
      top.className = "scene-top";

      const heading = document.createElement("h3");
      heading.textContent = `🎬 ${scene.title}`;

      const shot = document.createElement("span");
      shot.className = "chip";
      shot.textContent = `Shot ${i + 1}`;

      top.append(heading, shot);

      const small = document.createElement("small");
      small.textContent =
        `Characters: ${scene.characters.join(", ") || "Context-based"} · ` +
        `Environment: ${scene.environments.join(", ") || "Not detected"}`;

      el.append(top, descriptionLabel, description, promptLabel, prompt, small);
      $("sceneList").appendChild(el);
    });
  }

  if ($("characterList")) {
    $("characterList").innerHTML = "";

    currentProject.characters.forEach((character, i) => {
      const el = document.createElement("div");
      el.className = "character";

      const heading = document.createElement("strong");
      heading.textContent = `👤 ${character.name}`;

      const label = document.createElement("label");
      label.textContent = "Character reference description";

      const input = document.createElement("input");
      input.value = character.description;
      input.dataset.character = String(i);

      el.append(heading, label, input);
      $("characterList").appendChild(el);
    });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function syncEdits() {
  if (!currentProject) return;

  document.querySelectorAll("[data-scene]").forEach(el => {
    const scene = currentProject.scenes[Number(el.dataset.scene)];
    if (scene) scene[el.dataset.field] = el.value;
  });

  document.querySelectorAll("[data-character]").forEach(el => {
    const character = currentProject.characters[Number(el.dataset.character)];
    if (character) character.description = el.value;
  });
}

function save() {
  if (!currentProject) {
    alert("Generate a storyboard first.");
    return;
  }

  syncEdits();

  try {
    const all = JSON.parse(localStorage.getItem("myAiStudioProjects") || "[]");
    const index = all.findIndex(p => p.id === currentProject.id);
    if (index >= 0) all[index] = currentProject;
    else all.unshift(currentProject);

    localStorage.setItem("myAiStudioProjects", JSON.stringify(all));
    renderRecent();
    alert("Project saved on this device.");
  } catch (error) {
    alert("Could not save the project. Your device storage may be full.");
  }
}

function renderRecent() {
  if (!$("recent")) return;

  let all = [];
  try {
    all = JSON.parse(localStorage.getItem("myAiStudioProjects") || "[]");
  } catch (error) {
    all = [];
  }

  $("recent").innerHTML = "";

  if (!all.length) {
    $("recent").textContent = "No saved projects yet.";
    return;
  }

  all.slice(0, 5).forEach(project => {
    const item = document.createElement("div");
    item.className = "recent-item";

    const label = document.createElement("span");
    label.textContent = `${project.name} · ${project.scenes.length} scenes`;

    const button = document.createElement("button");
    button.className = "secondary";
    button.type = "button";
    button.textContent = "Open";
    button.dataset.open = String(project.id);

    button.addEventListener("click", () => {
      currentProject = project;
      if ($("story")) $("story").value = project.story || "";
      if ($("projectName")) $("projectName").value = project.name || "";
      renderProject();
      if ($("results")) $("results").classList.remove("hidden");
      if ($("characters")) $("characters").classList.remove("hidden");
    });

    item.append(label, button);
    $("recent").appendChild(item);
  });
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

if ($("analyzeBtn")) $("analyzeBtn").addEventListener("click", analyze);
if ($("saveBtn")) $("saveBtn").addEventListener("click", save);

if ($("exportBtn")) {
  $("exportBtn").addEventListener("click", () => {
    if (!currentProject) {
      alert("Generate a storyboard first.");
      return;
    }
    syncEdits();
    download(
      "my-ai-studio-project.json",
      JSON.stringify(currentProject, null, 2),
      "application/json"
    );
  });
}

if ($("copyBtn")) {
  $("copyBtn").addEventListener("click", async () => {
    if (!currentProject) {
      alert("Generate a storyboard first.");
      return;
    }

    syncEdits();
    const prompts = currentProject.scenes
      .map(scene => `${scene.title}\n${scene.prompt}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(prompts);
      alert("All prompts copied.");
    } catch (error) {
      // Fallback for browsers where Clipboard API is unavailable.
      const textarea = document.createElement("textarea");
      textarea.value = prompts;
      document.body.appendChild(textarea);
      textarea.select();

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (copyError) {
        copied = false;
      }

      textarea.remove();
      alert(copied
        ? "All prompts copied."
        : "Clipboard not available. Export the project JSON instead.");
    }
  });
}

renderRecent();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
