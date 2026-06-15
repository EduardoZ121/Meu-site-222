/** Prompts ocultos para chips do wizard "Criar com IA". */

const GENRE = {
  action: "High-energy action manga — dynamic poses, impact frames, clear motion.",
  romance: "Romantic beat focus — emotional proximity, soft or tense intimacy.",
  horror: "Horror atmosphere — dread, shadows, unsettling reveals.",
  adventure: "Adventure journey — exploration, discovery, escalating stakes.",
  slice_of_life: "Slice-of-life warmth — everyday moments, subtle expression.",
  fantasy: "Fantasy world — magic, otherworldly scale, epic wonder.",
  comedy: "Comedy timing — exaggerated reactions, visual gags space.",
  drama: "Drama weight — interpersonal conflict, emotional truth.",
  mystery: "Mystery tension — clues, suspicion, reveal pacing.",
  sci_fi: "Sci-fi futurism — tech, neon, speculative environments.",
  thriller: "Thriller suspense — chase, paranoia, tight framing.",
  sports: "Sports intensity — athletic motion, crowd energy, rivalry.",
};

const TONE = {
  epic: "Epic grand scale — heroic staging, dramatic light.",
  cute: "Cute charming tone — soft shapes, warm palette.",
  dark: "Dark moody tone — heavy shadows, muted colors.",
  humor: "Humorous tone — playful exaggeration.",
  dramatic: "Dramatic emotional peaks — high contrast storytelling.",
  romantic: "Romantic soft tone — warmth and intimacy.",
  tense: "Tense suspense — tight compositions.",
  cheerful: "Cheerful bright tone — upbeat energy.",
  melancholic: "Melancholic reflective tone — quiet sadness.",
  mysterious: "Mysterious ambiguous tone — partial reveals.",
  violent: "Violent intense tone — stylized action impact.",
  wholesome: "Wholesome feel-good tone — kindness and hope.",
};

const ART = {
  manga_bw: "Black and white manga ink with screentone shading.",
  manga_color: "Full-color manga with clean inks.",
  anime: "Anime illustration color style.",
  comic_western: "Western comic book coloring and inks.",
  realistic: "Semi-realistic detailed rendering.",
  ghibli_watercolor: "Soft Ghibli-like watercolor backgrounds.",
  webtoon_clean: "Clean flat webtoon digital style.",
  retro_screentone: "Retro screentone vintage print look.",
  dark_ink: "Heavy dark ink noir manga.",
  minimal_lineart: "Minimal elegant lineart.",
};

const MAIN_STYLE = {
  shonen: "Shonen — bold action, friendship, power escalation.",
  shojo: "Shojo — emotion, relationships, floral/delicate motifs.",
  seinen: "Seinen — mature themes, detailed art, grounded tone.",
  josei: "Josei — adult romance and life realism.",
  kodomomuke: "Kodomomuke — child-friendly simple shapes.",
  disney: "Disney-like rounded appeal and polish.",
  ghibli: "Ghibli pastoral wonder and warmth.",
  dark: "Dark fantasy grim aesthetic.",
  realistic: "Realistic anatomy with comic layout.",
  retro: "Retro classic manga print feel.",
  cyberpunk: "Cyberpunk neon dystopia.",
  steampunk: "Steampunk brass gears and Victorian tech.",
};

export function wizardHiddenLines(answers = {}) {
  const lines = [];
  const g = answers.genre && GENRE[answers.genre];
  const t = answers.tone && TONE[answers.tone];
  const a = answers.artStyle && ART[answers.artStyle];
  const m = answers.mainStyle && MAIN_STYLE[answers.mainStyle];
  if (g) lines.push(`Genre directive: ${g}`);
  if (t) lines.push(`Tone directive: ${t}`);
  if (a) lines.push(`Art directive: ${a}`);
  if (m) lines.push(`Demographic/style directive: ${m}`);
  if (answers.pacing) lines.push(`Pacing: ${answers.pacing} — adjust panel rhythm and action density.`);
  if (answers.panelStyle) lines.push(`Layout: ${String(answers.panelStyle).replace(/_/g, " ")} panel grid on each page.`);
  if (answers.lighting) lines.push(`Lighting style: ${String(answers.lighting).replace(/_/g, " ")}.`);
  if (answers.colorPalette) lines.push(`Color palette: ${String(answers.colorPalette).replace(/_/g, " ")}.`);
  return lines;
}
