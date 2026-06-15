/** Shared identity / compositing instructions for img2img flows. */

const PADRAO_IDENTITY_TRAIL =
  "Edit the reference photo in-place like professional retouching: preserve exact identity, same face, "
  + "facial structure, bone structure, skin tone and ethnicity (do not lighten, darken or alter undertones), "
  + "maintain original identity, do not change person or race, realistic face consistency for all skin tones "
  + "including deep and melanin-rich skin, preserve original facial expression, keep same emotion, "
  + "keep same eye expression, natural symmetric anatomy, no warped or melted features, "
  + "keep same pose and head angle unless the style explicitly requires otherwise";

const LEGACY_PADRAO_IDENTITY_TRAIL =
  "preserve identity, keep same face, keep facial structure, keep skin tone, maintain original identity, "
  + "do not change person, realistic face consistency, preserve original facial expression, keep same emotion, "
  + "keep same eye expression, keep same pose";

const PHOTO_EDIT_IDENTITY_BLOCK =
  "REFERENCE PHOTO EDIT (mandatory): Treat this as in-place photo retouching/compositing on the uploaded image — "
  + "not a face swap or sticker overlay. Keep the exact same person: identical face, bone structure, eyes, nose, "
  + "lips, skin tone, ethnicity and hair texture. Do not lighten, darken, bleach or shift undertones. "
  + "Avoid facial distortion, asymmetry, warped features or age changes. Preserve natural skin texture for all "
  + "ethnicities. Keep composition, pose and camera angle unless the edit explicitly requires a small adjustment.";

const POSTER_REFERENCE_PERSON =
  "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, "
  + "facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster "
  + "like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, "
  + "no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while "
  + "keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text "
  + "overlap, cut through or hide behind the face; place headlines in negative space or on background layers "
  + "behind the subject when needed.";

const POSTER_REFERENCE_FOOD =
  "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same dish — preserve plating, textures, colors "
  + "and food identity. Composite it naturally into the poster with matching lighting, perspective and shadows; "
  + "no floating cutout look.";

const LEGACY_POSTER_REFERENCE_PERSON =
  "Use the provided reference image as the identity.\nReplace face and hair, preserve identity.";

const LEGACY_POSTER_REFERENCE_FOOD =
  "Use the provided reference image as the dish.\n\nReplace the main food item with the dish from the reference image, preserving exact texture, colors, and details. Do not alter the dish identity.";

function appendPhotoEditIdentity(prompt) {
  const base = String(prompt || "").trim();
  if (!base || base.includes("REFERENCE PHOTO EDIT (mandatory)")) return base;
  return `${base}\n\n${PHOTO_EDIT_IDENTITY_BLOCK}`;
}

/** Pro retouch: block models from adding wrinkles/pores that age the subject. */
const PRO_RETOUCH_AGE_GUARD =
  "PRO RETOUCH — AGE LOCK (mandatory): Keep the exact same apparent age as the reference — never older, never younger. "
  + "Do not add or amplify wrinkles, smile lines, crow's feet, forehead lines, nasolabial folds, under-eye hollows, "
  + "neck lines, sagging, or aged skin texture. Do not add visible pores or harsh micro-detail unless already clear "
  + "in the original photo. Use flattering beauty-retouch skin: even tone, healthy natural glow, soft realistic finish. "
  + "Same person, same age, same core expression unless this preset explicitly changes expression only.";

function appendProRetouchIdentity(prompt) {
  let base = appendPhotoEditIdentity(prompt);
  if (base.includes("PRO RETOUCH — AGE LOCK")) return base;
  return `${base}\n\n${PRO_RETOUCH_AGE_GUARD}`;
}

function upgradePadraoPrompt(prompt) {
  let out = String(prompt || "");
  if (out.includes(PADRAO_IDENTITY_TRAIL)) return out;
  if (out.includes(LEGACY_PADRAO_IDENTITY_TRAIL)) {
    out = out.split(LEGACY_PADRAO_IDENTITY_TRAIL).join(PADRAO_IDENTITY_TRAIL);
  }
  return out;
}

/** Explicit visual grid layouts so the AI knows WHERE each panel sits on the page. */
const GRID_LAYOUTS = {
  2: [
    "Vertical 2-panel layout (3:4 portrait page):",
    "  • Panel 1 — TOP HALF of the page (full width).",
    "  • Panel 2 — BOTTOM HALF of the page (full width).",
    "  • Visible thick black gutter between them.",
  ],
  3: [
    "3-panel manga layout (3:4 portrait page):",
    "  • Panel 1 — TOP HALF, full width (wide establishing).",
    "  • Panel 2 — BOTTOM-LEFT half.",
    "  • Panel 3 — BOTTOM-RIGHT half.",
    "  • Visible black gutters between every panel.",
  ],
  4: [
    "Classic 4-panel manga page layout (3:4 portrait):",
    "  • Panel 1 — TOP-LEFT quadrant.",
    "  • Panel 2 — TOP-RIGHT quadrant.",
    "  • Panel 3 — BOTTOM-LEFT quadrant.",
    "  • Panel 4 — BOTTOM-RIGHT quadrant.",
    "  • Thick black gutters between all four panels forming a clean cross.",
    "  • Read order: top-left → top-right → bottom-left → bottom-right.",
  ],
  5: [
    "5-panel manga layout (3:4 portrait):",
    "  • Panel 1 — TOP, full width.",
    "  • Panels 2 & 3 — MIDDLE row, two equal halves.",
    "  • Panels 4 & 5 — BOTTOM row, two equal halves.",
  ],
  6: [
    "6-panel manga grid (3:4 portrait):",
    "  • 3 rows × 2 columns of panels (top-row L/R, mid-row L/R, bottom-row L/R).",
    "  • Read order: row by row, left-to-right.",
    "  • Visible black gutters between every cell.",
  ],
};

function buildGridLayoutLines(panelCount) {
  const n = Math.max(2, Number(panelCount) || 4);
  if (GRID_LAYOUTS[n]) return GRID_LAYOUTS[n];
  return [
    `${n}-panel manga page layout (3:4 portrait):`,
    `  • Arrange ${n} panels in a clean grid with visible black gutters.`,
    "  • Vary panel sizes for visual rhythm; read order left-to-right, top-to-bottom.",
  ];
}

/** Server-side comic sheet block — enforces narrative variety per panel. */
function buildMangaComicSheetBlock(panelCount = 4) {
  const n = Math.max(2, Number(panelCount) || 4);
  // Stable rotation of shot sizes and camera angles so panels can never clone each other.
  const SHOTS = [
    "wide establishing shot showing full scene context",
    "medium two-shot in 3/4 angle (NOT a front portrait)",
    "extreme close-up on face/eyes for emotion",
    "over-the-shoulder reaction shot",
    "low-angle dynamic action shot (worm's-eye style)",
    "high-angle wide reaction showing spatial layout",
    "Dutch-angle tension shot with tilted horizon",
    "side-view profile shot — body turned 90° to camera",
  ];
  const ANGLES = [
    "eye-level cinematic with 3/4 body turn",
    "low angle heroic, towering perspective",
    "high angle vulnerable, looking down",
    "dutch tilt — diagonal horizon",
    "over-shoulder cinematic — foreground shoulder visible",
    "bird's eye spatial top-down",
    "worm's eye dramatic from the ground",
    "back-view from behind, face hidden",
  ];
  const BEATS = [
    "INTRODUCTION — establish scene, location and characters present",
    "DEVELOPMENT — first action or reveal advances the story",
    "REACTION — emotional response close-up; reaction to prior beat",
    "DIALOGUE — characters speak; staged for legible balloons",
    "TRANSITION — movement, time pass or location shift; visible change",
    "TENSION — held suspense before release; dramatic shadow",
    "CLIMAX — strongest dramatic peak of the page; maximum impact",
    "AFTERMATH — quiet wind-down or consequence; resolves the beat",
  ];
  const lines = [
    "COMIC SHEET GENERATION — MANDATORY PAGE LAYOUT:",
    `- Output ONE manga PAGE composed of EXACTLY ${n} DIFFERENT panel regions with visible black gutters between them.`,
    "- Panel sizes/shapes must VARY across the page (e.g. one wide cinematic panel, one tall close-up, two medium beats).",
    "- Read order: left-to-right, top-to-bottom — panels form a clear sequential narrative.",
    "- FORBIDDEN: outputting ONE single big image instead of a multi-panel page; splitting ONE image into equal squares without real different content; duplicating the same composition into multiple panels; identical poses or framings across adjacent panels; mirrored clone panels; static repeat of the same shot.",
    "- FORBIDDEN: passport portraits, repeated mugshots, generic anime grid, single full-bleed illustration when multiple panels are requested.",
    "- Each panel is a DIFFERENT story moment — different beat, different camera, different pose, different action.",
    "- Maintain character identity (face, hair, skin, body, outfit) and scenario continuity ACROSS all panels — only beat/pose/camera change.",
    "",
    "VISUAL GRID (the AI MUST follow this physical layout):",
    ...buildGridLayoutLines(n),
    "",
    "PER-PANEL NARRATIVE PLAN (use these beats in order — assign each to one panel of the page):",
  ];
  for (let i = 0; i < n; i += 1) {
    const beat = BEATS[i % BEATS.length];
    const shot = SHOTS[i % SHOTS.length];
    const angle = ANGLES[(i + 1) % ANGLES.length];
    lines.push(
      `  Panel ${i + 1} → ${beat}. Shot: ${shot}. Camera angle: ${angle}. Composition must be unique to this panel — NEVER reuse the same framing as any other panel on this page.`,
    );
  }
  lines.push(
    "",
    "CAMERA AUTHORITY (mandatory):",
    "- Each panel's camera is HIGH PRIORITY — apply shot, angle and perspective literally.",
    "- Body orientation MUST follow the camera (profile for side_view, from-behind for back_view, towering for low_angle, from-above for high_angle/birds_eye, tilted for dutch_angle, foreshortened for worms_eye, foreground shoulder for over_shoulder).",
    "- Characters ACT inside the scene — never pose for the camera, no flat front mugshots, no selfies, no model stances.",
    "",
    "CONTINUITY RULES:",
    "- Same characters keep the same face, hair, skin, outfit through every panel.",
    "- Same location keeps the same architecture, lighting and color palette unless a panel explicitly transitions.",
    "- Story progresses panel by panel; no panel is a duplicate of another.",
  );
  return lines.join("\n");
}

/** Estúdio — combinar 2+ fotos (principal + referências) numa só imagem. */
function buildStudioMultiCombineBlock(imageCount) {
  const n = Math.min(Math.max(Number(imageCount) || 2, 2), 5);
  const lines = [
    `MULTI-REFERENCE PHOTO COMBINE (${n} source images) — MANDATORY:`,
    "- Each input image is a separate real subject (person, product, or scene element).",
    "- Output exactly ONE photorealistic photograph with every distinct subject together in the same scene.",
    "- All people must appear FULL-SIZE at the same scale — never as dolls, toys, figurines, miniatures, or props in someone's hands.",
    "- Do NOT duplicate, mirror or clone the same person twice.",
    "- Do NOT face-swap, melt, blur or blend identities between references.",
    "- Unified lighting, grounded shadows, natural perspective — no sticker/cutout look.",
    "- Single cohesive photo — NOT a collage, split screen, diptych, or side-by-side comparison of uploads.",
  ];
  for (let i = 1; i <= n; i += 1) {
    lines.push(
      `- Image ${i}: preserve exact identity, face, hair, skin tone, body proportions and outfit from that upload only.`,
    );
  }
  return lines.join("\n");
}

/** Duas pessoas reais — fotografia (não manga). */
function buildStudioDualPersonBlock() {
  return [
    "DUAL PERSON PHOTO COMPOSE — PHOTOREALISTIC (mandatory):",
    "Two reference photos of TWO DIFFERENT REAL PEOPLE.",
    "- Image 1 (MAIN upload): Person A — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 1.",
    "- Image 2 (REFERENCE upload): Person B — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 2.",
    "- Output ONE photograph with Person A AND Person B together in the same scene, both visible clearly.",
    "- Both are FULL-SIZE ADULTS at equal scale — standing or posing together (side by side unless user says otherwise).",
    "- Person B must NOT appear as a doll, toy, figurine, miniature, baby, prop, or blurred object in Person A's hands.",
    "- Do NOT merge faces, do NOT clone one person twice, do NOT swap identities between the two photos.",
    "- Natural unified lighting and realistic camera — magazine/editorial photo quality.",
  ].join("\n");
}

/** Pôster IG: layout fixo (capa) + 2 fotos de identidade. */
function buildPosterLayoutDualPersonBlock() {
  return [
    "POSTER LAYOUT COMPOSE — THREE REFERENCES (mandatory):",
    "- Image 1: LAYOUT REFERENCE — replicate this exact poster design: composition, crop, background, typography zones, graphic elements, and body poses/silhouettes.",
    "- Image 2: Person A — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 2 only.",
    "- Image 3: Person B — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 3 only.",
    "- Replace ONLY the people in Image 1 with Person A and Person B — keep layout, text placement, colors and graphics identical to Image 1.",
    "- Both people are FULL-SIZE ADULTS at equal scale in the same poses as Image 1 — NOT dolls, toys, figurines, miniatures or props.",
    "- Do NOT merge faces, do NOT clone one person twice, do NOT swap identities between images 2 and 3.",
    "- Render all headline/subhead copy from the brief exactly — crisp, legible, no gibberish.",
    "- Natural unified lighting — professional photo retouching finish.",
  ].join("\n");
}

/** Pôster IG 2 pessoas — fotos primeiro, layout por último (identidade > capa). */
function buildPosterIgDualIdentityBlock(hasLayout = false) {
  const lines = [
    "IG POSTER — PHOTOREALISTIC IDENTITY LOCK (mandatory):",
    "- Image 1: Person A (MAIN upload) — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 1 only.",
    "- Image 2: Person B (REFERENCE upload) — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 2 only.",
  ];
  if (hasLayout) {
    lines.push(
      "- Image 3: LAYOUT REFERENCE ONLY — match composition, typography zones, background colors and body POSES from this thumbnail.",
      "- Replace the stock people in Image 3 with Person A (from Image 1) and Person B (from Image 2). Use their REAL faces and bodies — never keep the layout thumbnail models' faces.",
    );
  }
  lines.push(
    "- Output ONE finished poster with Person A AND Person B together — both FULL-SIZE adults at equal scale.",
    "- Person B must NOT appear as a doll, toy, figurine, miniature, baby or prop in Person A's hands.",
    "- Do NOT merge faces. Do NOT clone one person twice. Do NOT swap identities between images 1 and 2.",
    "- Do NOT invent new faces or use stock models. Unified lighting — professional poster retouching finish.",
    "- All headline/subhead copy from the brief must render exactly — crisp, legible, no gibberish.",
  );
  return lines.join("\n");
}

/** Pôster IG 1 pessoa: layout fixo + foto de identidade. */
function buildPosterLayoutSinglePersonBlock() {
  return [
    "POSTER LAYOUT COMPOSE — TWO REFERENCES (mandatory):",
    "- Image 1: LAYOUT REFERENCE — replicate this exact poster design: composition, crop, background, typography zones and graphic elements.",
    "- Image 2: Person — preserve 100% of their face, hair, skin tone, ethnicity, body type and outfit from image 2 only.",
    "- Replace ONLY the person in Image 1 with the person from image 2 — keep layout, text placement, colors and graphics identical to Image 1.",
    "- Render all copy from the brief exactly — crisp, legible, no gibberish.",
  ].join("\n");
}

function buildMangaDualCharacterBlock(nameA, nameB, descA = "", descB = "", roleA = "primary", roleB = "support") {
  const a = String(nameA || "Character A").trim() || "Character A";
  const b = String(nameB || "Character B").trim() || "Character B";
  // Short stable per-name tags so the model has anchors that never collide.
  const tagOf = (s) => {
    let h = 5381;
    const str = String(s);
    for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return `ID:${(h >>> 0).toString(36).toUpperCase().padStart(4, "0").slice(-4)}`;
  };
  const tagA = tagOf(`A|${a}|${descA}`);
  const tagB = tagOf(`B|${b}|${descB}`);
  const labelA = roleA === "support" ? "SECONDARY CHARACTER (suporte)" : "PRIMARY CHARACTER";
  const labelB = roleB === "support" ? "SECONDARY CHARACTER (suporte)" : "PRIMARY CHARACTER";
  const lines = [
    "DUAL CHARACTER REFERENCE — MANDATORY (read before scene description):",
    `EXCLUSIVE CAST: exactly 2 named characters exist: "${a}" [${tagA}] (${labelA}) and "${b}" [${tagB}] (${labelB}). No other people, no random NPCs, no generic anime extras, no gym/crowd faces.`,
    "",
    `=== ${a} [${tagA}] — ${labelA} — locked identity card ===`,
    `- Reference image 1 is "${a}" ONLY. ${a}'s face, hairstyle, hair color, skin tone, ethnicity, body type and outfit must be taken EXACTLY from image 1.`,
    `- Image 1 may NEVER be used as a source for any other character. ${a}'s face may NEVER appear on anyone else.`,
    roleA === "primary"
      ? `- ${a} is the PRIMARY character — main focus of composition, leading the action.`
      : `- ${a} is a SECONDARY/SUPPORT character — present in the scene with independent identity, but framing centers on the primary.`,
    descA ? `- ${a} visual notes (locked): ${String(descA).slice(0, 300)}` : "",
    "",
    `=== ${b} [${tagB}] — ${labelB} — locked identity card ===`,
    `- Reference image 2 is "${b}" ONLY. ${b}'s face, hairstyle, hair color, skin tone, ethnicity, body type and outfit must be taken EXACTLY from image 2.`,
    `- Image 2 may NEVER be used as a source for any other character. ${b}'s face may NEVER appear on anyone else.`,
    roleB === "primary"
      ? `- ${b} is the PRIMARY character — main focus of composition, leading the action.`
      : `- ${b} is a SECONDARY/SUPPORT character — present in the scene with independent identity, but framing centers on the primary.`,
    descB ? `- ${b} visual notes (locked): ${String(descB).slice(0, 300)}` : "",
    "",
    "NON-MIXING RULES:",
    `- ${a} [${tagA}] is NOT ${b} [${tagB}]. Do NOT swap, merge, blend or average their faces, hair, skin or outfits.`,
    `- Do NOT use image 1's face on ${b}. Do NOT use image 2's face on ${a}.`,
    `- Across all panels of this sheet: ${a} keeps the same face/hair/skin/outfit as image 1; ${b} keeps the same face/hair/skin/outfit as image 2. Only pose, expression and camera angle may change.`,
    "- Seamless in-place compositing: unified lighting, natural skin blend, no sticker/cutout look, no face-swap artefacts.",
    "- Each manga panel section is isolated: only the characters linked to that panel beat may appear in it.",
  ].filter(Boolean);
  return lines.join("\n");
}

module.exports = {
  PADRAO_IDENTITY_TRAIL,
  LEGACY_PADRAO_IDENTITY_TRAIL,
  PHOTO_EDIT_IDENTITY_BLOCK,
  POSTER_REFERENCE_PERSON,
  POSTER_REFERENCE_FOOD,
  LEGACY_POSTER_REFERENCE_PERSON,
  LEGACY_POSTER_REFERENCE_FOOD,
  appendPhotoEditIdentity,
  appendProRetouchIdentity,
  PRO_RETOUCH_AGE_GUARD,
  upgradePadraoPrompt,
  buildStudioMultiCombineBlock,
  buildStudioDualPersonBlock,
  buildPosterLayoutDualPersonBlock,
  buildPosterIgDualIdentityBlock,
  buildPosterLayoutSinglePersonBlock,
  buildMangaDualCharacterBlock,
  buildMangaComicSheetBlock,
};
