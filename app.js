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
    aliases: ["Mia"],
    description: "A little girl with straight black hair, a pink dress and white shoes. Keep exactly the same face, hairstyle, hair length, dress design, clothing colors, age and body proportions in every scene."
  },
  {
    name: "Coco",
    aliases: ["Coco"],
    description: "A small clever monkey with warm brown fur, a cream-colored face and chest, large expressive brown eyes, small rounded ears and a long flexible tail. Keep exactly the same face, fur colors, eye color, body size, tail and proportions in every scene. Do not turn Coco into a human or another animal."
  },
  {
    name: "Mama Elephant",
    aliases: ["Mama Elephant", "mother elephant", "elephant mother"],
    description: "A large gentle adult female elephant with soft gray skin, broad fan-shaped ears, kind dark eyes, a long trunk and sturdy legs. She has no tusks unless the story explicitly says otherwise. Keep exactly the same face, skin tone, ear shape, trunk, body size and proportions in every scene."
  },
  {
    name: "Bobo",
    aliases: ["Bobo", "baby elephant", "elephant calf"],
    description: "A cute small gray baby elephant with a round little body, oversized soft ears, a short trunk, large expressive dark eyes and short sturdy legs. Keep exactly the same face, skin tone, ear shape, trunk length, body size and proportions in every scene."
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

let CHARACTER_DB = BUILTIN_CHARACTERS.map(c => ({ ...c, aliases: [...c.aliases] }));

// Words that may begin a sentence but are not character names.
// This list is intentionally conservative: custom characters are added only
// when introduced with "named" or "called" and the candidate is not a stop word.
const NON_NAME_WORDS = new Set([
  "a", "an", "the", "this", "that", "these", "those", "when", "while",
  "where", "what", "who", "why", "how", "after", "before", "although",
  "because", "since", "until", "unless", "without", "within", "together",
  "suddenly", "finally", "carefully", "slowly", "quickly", "happily",
  "sadly", "gently", "quietly", "bravely", "from", "into", "onto", "over",
  "under", "through", "across", "around", "behind", "beside", "between",
  "but", "and", "or", "so", "yet", "then", "now", "once", "one", "some",
  "many", "all", "both", "each", "every", "another", "their", "there",
  "here", "he", "she", "it", "they", "them", "his", "her", "its", "we",
  "you", "i", "me", "my", "our", "your", "back", "again", "at", "on", "in",
  "as", "is", "was", "were", "are", "be", "been", "being", "do", "does",
  "did", "has", "have", "had", "can", "could", "will", "would", "shall",
  "should", "may", "might", "must", "not", "very", "too", "more", "most",
  "little", "big", "small", "beautiful", "important", "adventure"
]);

function resetCharacterDB() {
  // Prevent characters discovered in an older story leaking into a new story.
  CHARACTER_DB = BUILTIN_CHARACTERS.map(c => ({ ...c, aliases: [...c.aliases] }));
}

function discoverCustomCharacters(text) {
  const source = String(text || "");
  const candidates = new Map();

  const addCandidate = (rawName, explicit = false) => {
    const name = String(rawName || "").trim().replace(/\s+/g, " ");
    if (!name) return;

    const words = name.split(" ");
    const first = words[0].toLowerCase();
    const normalized = name.toLowerCase();

    // Exclude grammar words, sentence starters and non-name phrases.
    if (NON_NAME_WORDS.has(first) || words.some(w => NON_NAME_WORDS.has(w.toLowerCase()))) return;
    if (words.length > 4 || !/^[A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*){0,3}$/.test(name)) return;

    const existing = CHARACTER_DB.some(c =>
      c.name.toLowerCase() === normalized ||
      c.aliases.some(alias => alias.toLowerCase() === normalized)
    );
    if (existing) return;

    const previous = candidates.get(normalized) || { name, count: 0, explicit: false };
    previous.count += 1;
    previous.explicit = previous.explicit || explicit;
    candidates.set(normalized, previous);
  };

  // Strong evidence: explicit character introductions.
  const explicitPatterns = [
    /\b(?:named|called)\s+([A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*){0,3})/g,
    /\b(?:his|her|their)\s+name\s+(?:was|is)\s+([A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*){0,3})/g,
    /\b(?:this|the)\s+(?:boy|girl|man|woman|king|queen|prince|princess|wizard|witch|dragon|lion|tiger|elephant|monkey|rabbit|fox|wolf|bear|bird|dog|cat|robot|alien)\s+is\s+([A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*){0,2})/gi
  ];
  for (const pattern of explicitPatterns) {
    for (const match of source.matchAll(pattern)) addCandidate(match[1], true);
  }

  // Also find recurring proper names anywhere in the story, not just after
  // "named/called". Ignore the first capitalized word of each sentence.
  const sentencePattern = /[^.!?\n]+[.!?]?/g;
  for (const sentenceMatch of source.matchAll(sentencePattern)) {
    const sentence = sentenceMatch[0].trim();
    const wordPattern = /\b[A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*){0,2}\b/g;
    const matches = [...sentence.matchAll(wordPattern)];
    for (const match of matches) {
      const candidate = match[0].trim();
      // A capitalized first word is usually just sentence capitalization.
      if (match.index === 0) continue;
      addCandidate(candidate, false);
    }
  }

  for (const item of candidates.values()) {
    // A single occurrence is accepted only when introduced explicitly.
    if (!item.explicit && item.count < 2) continue;
    CHARACTER_DB.push({
      name: item.name,
      aliases: [item.name],
      description: `Consistent original story character: ${item.name}. Infer the character's species, age, role, clothing and visual traits from the story wherever stated. Keep the same face, body shape, colors, clothing, hairstyle, age and proportions in every scene. Do not redesign this character between scenes.`
    });
  }
}

function detectCharacters(text) {
  const source = String(text || "");
  const found = [];

  for (const character of CHARACTER_DB) {
    const matched = character.aliases.some(alias => {
      const cleanAlias = String(alias || "").trim();
      if (!cleanAlias) return false;
      const parts = cleanAlias.split(/\s+/);
      if (parts.some(part => NON_NAME_WORDS.has(part.toLowerCase()))) return false;
      return containsPhrase(source, cleanAlias);
    });
    if (matched) found.push(character.name);
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

LANGUAGE AND CHARACTER DETECTION RULE:
Understand the complete English text naturally. Every English word must be interpreted according to its grammatical meaning and the story context. A word is a CHARACTER only when it is clearly a proper name or an explicitly identified story entity. Do NOT turn ordinary English words into characters. This includes articles, pronouns, verbs, adjectives, adverbs, conjunctions, prepositions, transition words, sentence starters, time words, and abstract nouns. Examples that are NOT characters unless the story clearly establishes them as proper names: Without, Together, When, But, Carefully, That, From, Adventure, Suddenly, Finally, Beautiful, River, Forest, Morning and Happiness.

Use only actual characters discovered from the story and listed in GLOBAL CHARACTER REFERENCE. Do not invent extra characters, split one character into multiple characters, or treat a species/role word as a separate character when it refers to an already identified character. Preserve each character's exact identity and visual design throughout the story. Infer visual details only from the story; do not contradict details the story gives. Depict the exact action described in this scene.`;
}

function analyze() {
  const story = safeText("story").trim();

  if (!story) {
    alert("Please paste your story first.");
    return;
  }

  resetCharacterDB();
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
