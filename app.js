const $ = id => document.getElementById(id);
let currentProject = null;
const MANUAL_CAST_KEY = "myAiStudioManualCastV1";
let manualCast = (() => { try { const x = JSON.parse(localStorage.getItem(MANUAL_CAST_KEY) || "[]"); return Array.isArray(x) ? x.filter(c => c && c.name) : []; } catch (_) { return []; } })();
function saveManualCast() { try { localStorage.setItem(MANUAL_CAST_KEY, JSON.stringify(manualCast)); } catch (_) {} }


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


// ------------------------------------------------------------
// UNIVERSAL STORY UNDERSTANDING
// Optional backend: set STORY_AI_ENDPOINT to your own secure API route.
// Never put a private AI API key in this browser file.
// ------------------------------------------------------------
const STORY_AI_ENDPOINT = ""; // Example: "/api/analyze-story"

const VISUAL_STYLE = "High-quality cinematic 3D animated storybook illustration, expressive characters, detailed environment, soft dramatic lighting, rich natural colors, coherent camera composition, family-friendly.";

const ENVIRONMENT_DB = [
  { name: "Forest", aliases: ["forest", "woods", "woodland", "trees"] },
  { name: "Jungle", aliases: ["jungle", "rainforest", "tropical forest"] },
  { name: "River", aliases: ["river", "stream", "waterfall", "riverbank"] },
  { name: "Village", aliases: ["village", "town", "farm", "cottage"] },
  { name: "Mountain", aliases: ["mountain", "hill", "cliff", "cave"] },
  { name: "Ocean", aliases: ["ocean", "sea", "beach", "shore"] },
  { name: "Desert", aliases: ["desert", "sand dunes"] },
  { name: "Meadow", aliases: ["meadow", "grassland", "field", "prairie"] }
];

function safeText(id) {
  const el = document.getElementById(id);
  return el && typeof el.value === "string" ? el.value : "";
}

function containsPhrase(text, phrase) {
  if (!text || !phrase) return false;
  const escaped = String(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "iu").test(String(text));
}

function splitStory(story) {
  const clean = String(story || "").replace(/\r/g, "").trim();
  if (!clean) return [];
  // Prefer blank-line paragraphs; otherwise split at sentence boundaries.
  let parts = clean.split(/\n\s*\n+/).map(x => x.trim()).filter(Boolean);
  if (parts.length < 2) {
    parts = (clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean])
      .map(x => x.trim()).filter(Boolean);
    const grouped = [];
    for (let i = 0; i < parts.length; i += 2) grouped.push(parts.slice(i, i + 2).join(" "));
    parts = grouped;
  }
  return parts;
}

const GENERIC_ENTITY_WORDS = new Set([
  ...NON_NAME_WORDS, "fox", "lion", "elephant", "deer", "beaver", "rabbit",
  "bird", "wolf", "bear", "monkey", "dragon", "boy", "girl", "man", "woman",
  "mother", "father", "mama", "papa", "king", "queen", "forest", "river",
  "jungle", "village", "mountain", "day", "night", "morning", "evening",
  "sun", "moon", "wind", "rain", "story", "scene"
]);

function heuristicStoryCharacters(story) {
  const source = String(story || "");
  const found = [];
  const add = (name, type = "individual") => {
    name = String(name || "").trim().replace(/\s+/g, " ").replace(/[.,!?;:]+$/, "");
    if (!name || name.length > 45) return;
    if (!found.some(x => x.name.toLowerCase() === name.toLowerCase())) found.push({ name, type });
  };

  // Animal identities: recognize animal kinds only when the story refers to them.
  const animals = [
    "Fox", "Lion", "Elephant", "Deer", "Beaver", "Rabbit", "Bird", "Wolf", "Bear",
    "Monkey", "Dragon", "Tiger", "Horse", "Dog", "Cat", "Mouse", "Rat", "Squirrel",
    "Owl", "Eagle", "Duck", "Goose", "Swan", "Hedgehog", "Turtle", "Tortoise",
    "Snake", "Frog", "Dolphin", "Whale", "Shark", "Giraffe", "Zebra", "Giraffe",
    "Crocodile", "Alligator", "Penguin", "Panda", "Koala", "Kangaroo", "Camel", "Donkey",
    "Chicken", "Rooster", "Hen", "Sheep", "Goat", "Cow", "Pig", "Boar", "Raccoon",
    "Badger", "Otter", "Bees", "Butterfly", "Parrot", "Peacock", "Woodpecker"
  ];
  for (const animal of new Set(animals)) {
    const re = new RegExp(`\\b(?:a|an|the|one|little|baby|young|old|small|big|another|some|many|two|three)?\\s*${animal.toLowerCase()}s?\\b`, "i");
    if (re.test(source)) add(animal, "animal");
  }

  // Family/relationship roles count only when the story uses them as a person/animal.
  const roles = [
    ["Mother", /\b(?:his|her|their|the)\s+mother\b|\bmother\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Father", /\b(?:his|her|their|the)\s+father\b|\bfather\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Mama", /\b(?:his|her|their|the)\s+mama\b|\bmama\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Papa", /\b(?:his|her|their|the)\s+papa\b|\bpapa\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Grandmother", /\b(?:his|her|their|the)\s+grandmother\b|\bgrandmother\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Grandfather", /\b(?:his|her|their|the)\s+grandfather\b|\bgrandfather\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Grandma", /\b(?:his|her|their|the)\s+grandma\b|\bgrandma\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Grandpa", /\b(?:his|her|their|the)\s+grandpa\b|\bgrandpa\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Sister", /\b(?:his|her|their|the)\s+sister\b|\bsister\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Brother", /\b(?:his|her|their|the)\s+brother\b|\bbrother\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Uncle", /\b(?:his|her|their|the)\s+uncle\b|\buncle\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig],
    ["Aunt", /\b(?:his|her|their|the)\s+aunt\b|\baunt\s+(?:said|asked|replied|came|looked|smiled|called|told|hugged)\b/ig]
  ];
  for (const [role, re] of roles) if (re.test(source)) add(role, "family");

  // Compound family + animal identities, e.g. "Mama Fox"; keep as one character.
  const roleWords = "Mama|Mom|Mother|Papa|Dad|Father|Grandma|Grandmother|Grandpa|Grandfather";
  const animalWords = animals.join("|");
  const compoundRe = new RegExp(`\\b(${roleWords})\\s+(${animalWords})\\b`, "gi");
  for (const match of source.matchAll(compoundRe)) {
    const role = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
    const animal = match[2][0].toUpperCase() + match[2].slice(1).toLowerCase();
    const combined = `${role} ${animal}`;
    // Replace separate role/animal entries when the story consistently uses a compound identity.
    const roleIndex = found.findIndex(x => x.name.toLowerCase() === role.toLowerCase());
    if (roleIndex >= 0) found.splice(roleIndex, 1);
    const animalIndex = found.findIndex(x => x.name.toLowerCase() === animal.toLowerCase());
    if (animalIndex >= 0) found.splice(animalIndex, 1);
    add(combined, "individual");
  }

  // Explicitly introduced proper names and clear name-as-speaker patterns.
  const namePatterns = [
    /\b(?:named|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
    /\b(?:his name was|her name was|their name was|name was)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
    /\b([A-Z][a-z]{1,20})\s+(?:said|asked|replied|whispered|shouted|cried|laughed|smiled)\b/g
  ];
  for (const re of namePatterns) for (const match of source.matchAll(re)) {
    const candidate = match[1];
    if (!NON_NAME_WORDS.has(candidate.toLowerCase()) && !animals.some(a => a.toLowerCase() === candidate.toLowerCase())) add(candidate, "individual");
  }
  return found;
}

async function askStoryAI(story) {
  if (!STORY_AI_ENDPOINT) return null;
  const response = await fetch(STORY_AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      story,
      task: "Extract story entities and scenes. Return JSON only.",
      schema: {
        characters: [{ name: "string", type: "individual|group", description: "string", aliases: ["string"] }],
        scenes: [{ text: "string", characterNames: ["string"], environmentNames: ["string"] }],
        environments: ["string"]
      },
      rules: [
        "Read the entire story before deciding who is a character.",
        "Do not classify every capitalized word as a character.",
        "Exclude articles, pronouns, verbs, adjectives, adverbs, conjunctions and prepositions.",
        "Use context: a word can be a name in one story and an ordinary word in another.",
        "Keep compound identities together, for example Mama Fox is one character, not Mama and Fox.",
        "Include animal characters and family-role characters when the story identifies them as participants: mother, father, mama, papa, grandma, grandpa, grandmother, grandfather, sister, brother, aunt and uncle.",
        "A phrase such as his mother or his father identifies a character when that person acts, speaks or is referred to as a story participant.",
        "Do not classify ordinary grammar words, adjectives, adverbs, verbs, places or objects as characters.",
        "Keep compound identities together, for example Mama Fox is one character, not separate Mama and Fox.",
        "Distinguish named individuals from generic animal groups such as beavers, deer, birds and rabbits.",
        "Resolve pronouns using earlier story context when assigning characters to scenes.",
        "Do not invent characters or add background characters not supported by the story."
      ]
    })
  });
  if (!response.ok) throw new Error(`AI analysis failed (${response.status})`);
  const data = await response.json();
  return data.result || data;
}

function resetCharacterDB() {
  // Prevent characters discovered in an older story leaking into a new story.
  CHARACTER_DB = BUILTIN_CHARACTERS.map(c => ({ ...c, aliases: [...c.aliases] }));
}

function discoverCustomCharacters(text) {
  const candidates = heuristicStoryCharacters(text);
  for (const item of candidates) {
    const exists = CHARACTER_DB.some(c =>
      c.name.toLowerCase() === item.name.toLowerCase() ||
      c.aliases.some(alias => alias.toLowerCase() === item.name.toLowerCase())
    );
    if (!exists) CHARACTER_DB.push({
      name: item.name,
      aliases: [item.name],
      description: `A story character named ${item.name}. Keep the same identity, face, species, age, colors, clothing and proportions in every scene.`
    });
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
Only characters manually added to GLOBAL CHARACTER REFERENCE are approved characters. Words such as Without, Together, When, But, Carefully, That, From and Adventure are ordinary English words, NOT characters. Never create a character from a sentence starter, pronoun, adjective, adverb, conjunction, preposition or other grammar word. Do not change character faces, fur colors, clothing, age, hairstyle or proportions. Depict the exact action described in this scene.`;
}

async function analyze() {
  const story = safeText("story").trim();
  if (!story) {
    alert("Please paste your story first.");
    return;
  }

  const button = $("analyzeBtn");
  const originalLabel = button ? button.textContent : "";
  if (button) { button.disabled = true; button.textContent = "✦ Understanding story..."; }

  try {
    resetCharacterDB();
    const chunks = splitStory(story);
    if (!chunks.length) throw new Error("Please enter a readable story.");

    // Manual character mode: never infer characters from story text.
    // Users add every character explicitly in the Character List below.
    // Manual-only cast: no AI extraction and no automatic name discovery.
    resetCharacterDB();
    manualCast.forEach(c => CHARACTER_DB.push({ name: c.name, aliases: [c.name], description: c.description || `A story character named ${c.name}. Keep the same appearance in every scene.` }));
    const allNames = manualCast.map(c => c.name);
    const sceneCast = chunks.map(() => []);
    const allPlaces = [...new Set(chunks.flatMap(scene => detectEnvironments(scene)))];

    currentProject = {
      id: Date.now(),
      name: safeText("projectName").trim() || "Untitled Story",
      story,
      characters: manualCast.map(c => ({ name: c.name, description: c.description || `A story character named ${c.name}. Keep the same appearance in every scene.` })),
      environments: allPlaces,
      scenes: chunks.map((scene, i) => ({
        title: `Scene ${i + 1}`,
        description: scene,
        characters: sceneCast[i] || [],
        environments: detectEnvironments(scene),
        prompt: makePrompt(scene, i, allNames, allPlaces)
      })),
      created: new Date().toISOString(),
      analysisMode: "manual-characters"
    };

    renderProject();
    if ($("results")) {
      $("results").classList.remove("hidden");
      $("results").scrollIntoView({ behavior: "smooth" });
    }
    if ($("characters")) $("characters").classList.remove("hidden");
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not analyze this story.");
  } finally {
    if (button) { button.disabled = false; button.textContent = originalLabel || "✦ Generate storyboard"; }
  }
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

    // Manual character entry is provided once in the panel above Generate.
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

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "secondary";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        currentProject.characters.splice(i, 1);
        manualCast = manualCast.filter(c => c.name.toLowerCase() !== character.name.toLowerCase());
        saveManualCast();
        CHARACTER_DB = CHARACTER_DB.filter(c => c.name.toLowerCase() !== character.name.toLowerCase());
        refreshAllScenePrompts();
        renderProject();
      });
      el.append(heading, label, input, removeButton);
      $("characterList").appendChild(el);
    });
  }
}


function renderManualCastPanel() {
  const host = $("manualCastPanel"); if (!host) return;
  host.innerHTML = "";
  const title = document.createElement("h3"); title.textContent = "👤 Manual Character List";
  const hint = document.createElement("p"); hint.textContent = "Automatic character detection is OFF. Type each character yourself; remove any name you do not want.";
  const name = document.createElement("input"); name.id = "manualCharacterName"; name.placeholder = "Character name (e.g. Finn, Mama Fox, Daisy)";
  const desc = document.createElement("textarea"); desc.id = "manualCharacterDescription"; desc.rows = 3; desc.placeholder = "Character appearance description (optional but recommended)";
  const add = document.createElement("button"); add.type = "button"; add.textContent = "+ Add Character"; add.className = "secondary"; add.addEventListener("click", addManualCharacter);
  name.addEventListener("keydown", e => { if (e.key === "Enter") addManualCharacter(); });
  host.append(title, hint, name, desc, add);
  const list = document.createElement("div"); list.style.marginTop = "10px";
  if (!manualCast.length) { const empty = document.createElement("small"); empty.textContent = "No characters added yet."; list.appendChild(empty); }
  manualCast.forEach((c, i) => {
    const row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px;border:1px solid #7775;border-radius:9px;margin-top:7px";
    const label = document.createElement("span"); label.textContent = c.name + (c.description ? " — " + c.description : ""); label.style.cssText = "flex:1;min-width:0;overflow-wrap:anywhere";
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "secondary"; remove.textContent = "Remove";
    remove.addEventListener("click", () => { const removed = manualCast[i]; manualCast.splice(i,1); saveManualCast(); if (currentProject) { currentProject.characters = currentProject.characters.filter(x => x.name.toLowerCase() !== removed.name.toLowerCase()); refreshAllScenePrompts(); renderProject(); renderManualCastPanel(); } else renderManualCastPanel(); });
    row.append(label, remove); list.appendChild(row);
  });
  host.appendChild(list);
}

function addManualCharacter() {
  const input = $("manualCharacterName");
  const descriptionInput = $("manualCharacterDescription");
  const name = String(input && input.value || "").trim().replace(/\s+/g, " ");
  const description = String(descriptionInput && descriptionInput.value || "").trim();
  if (!name) { alert("Enter a character name first."); return; }
  if (manualCast.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert("This character is already in the manual list."); return;
  }
  const character = { name, description: description || `A story character named ${name}. Keep the same face, species, colors, clothing, age and proportions in every scene.` };
  manualCast.push(character);
  saveManualCast();
  if (!CHARACTER_DB.some(c => c.name.toLowerCase() === name.toLowerCase())) CHARACTER_DB.push({ name, aliases: [name], description: character.description });
  if (currentProject) {
    currentProject.characters.push({ ...character });
    refreshAllScenePrompts();
    renderProject();
    renderManualCastPanel();
  } else {
    renderManualCastPanel();
  }
  if (input) input.value = "";
  if (descriptionInput) descriptionInput.value = "";
}

function refreshAllScenePrompts() {
  if (!currentProject) return;
  const names = currentProject.characters.map(c => c.name);
  currentProject.scenes.forEach((scene, i) => {
    scene.prompt = makePrompt(scene.description, i, names, currentProject.environments || []);
  });
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
    if (character) { character.description = el.value; const saved = manualCast.find(c => c.name.toLowerCase() === character.name.toLowerCase()); if (saved) saved.description = el.value; }
  });
  saveManualCast();
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
      currentProject.characters = Array.isArray(project.characters) ? project.characters : [];
      currentProject.scenes = Array.isArray(project.scenes) ? project.scenes : [];
      manualCast = currentProject.characters.map(c => ({ name: c.name, description: c.description || "" })); saveManualCast();
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

if ($("analyzeBtn")) {
  const panel = document.createElement("section"); panel.id = "manualCastPanel"; panel.style.cssText = "padding:14px;border:1px solid #7777;border-radius:14px;margin:14px 0";
  $("analyzeBtn").parentElement.insertBefore(panel, $("analyzeBtn"));
  renderManualCastPanel();
  $("analyzeBtn").addEventListener("click", analyze);
}
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
