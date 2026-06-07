import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Loader2, Plus, Trash2, Check, Wand2, MessageCircle, BookOpen } from "lucide-react";
import { generateMangaFromWizard } from "./generateMangaFromWizard";
import { api } from "../../lib/api";
import { toast } from "sonner";

const STEPS = [
  { id: "project", title: "Project", num: 1 },
  { id: "story", title: "Story", num: 2 },
  { id: "characters", title: "Characters", num: 3 },
  { id: "world", title: "World", num: 4 },
  { id: "panels", title: "Panels & Layout", num: 5 },
  { id: "dialogue", title: "Dialogue & Bubbles", num: 6 },
  { id: "style", title: "Visual Style", num: 7 },
  { id: "confirm", title: "Generate", num: 8 },
];

const FORMATS = [
  { id: "manga", label: "Manga" }, { id: "comic", label: "Comic" },
  { id: "webtoon", label: "Webtoon" }, { id: "graphic_novel", label: "Graphic Novel" },
];
const PAGE_COUNTS = ["1", "2", "4", "6", "8", "12", "20"];
const MAIN_STYLES = ["shonen", "shojo", "seinen", "josei", "kodomomuke", "disney", "ghibli", "dark", "realistic", "retro", "cyberpunk", "steampunk"];
const GENRES = ["action", "romance", "horror", "adventure", "slice_of_life", "fantasy", "comedy", "drama", "mystery", "sci_fi", "thriller", "sports"];
const TONES = ["epic", "cute", "dark", "humor", "dramatic", "romantic", "tense", "cheerful", "melancholic", "mysterious", "violent", "wholesome"];
const PACING = ["slow", "normal", "fast", "cinematic"];
const NARRATION = ["first_person", "third_person", "omniscient", "none"];
const PANEL_COUNTS = ["2", "3", "4", "5", "6", "8"];
const PANEL_STYLES = ["classic_grid", "dynamic", "full_page_splash", "mixed", "vertical_strips", "asymmetric"];
const TRANSITION_STYLES = ["cut", "fade", "zoom", "pan", "match_cut", "contrast"];
const BUBBLE_STYLES = ["normal", "jagged", "cloud", "burst", "whisper", "electronic", "ancient", "drip"];
const BUBBLE_POSITIONS = ["auto", "top", "bottom", "left", "right", "center"];
const NARRATION_BOX = ["none", "top", "bottom", "overlay"];
const SFX_STYLES = ["none", "japanese", "western", "subtle", "extreme"];
const ART_STYLES = ["manga_bw", "manga_color", "anime", "comic_western", "realistic", "ghibli_watercolor", "webtoon_clean", "retro_screentone", "dark_ink", "minimal_lineart"];
const DETAIL_LEVELS = ["sketch", "clean", "detailed", "ultra_detailed"];
const LIGHTING_OPTS = ["natural", "dramatic", "soft", "neon", "cinematic", "moonlight", "spotlight", "backlit"];
const COLOR_PALETTES = ["monochrome", "warm", "cool", "vibrant", "pastel", "dark", "sepia", "neon"];
const CAMERA_DEFAULTS = ["varied", "close_ups", "wide_shots", "dynamic_angles", "over_shoulder", "birds_eye"];
const ERAS = ["modern", "medieval", "futuristic", "edo_japan", "victorian", "post_apocalyptic", "fantasy_world", "space", "underwater", "school"];
const WEATHER_OPTS = ["clear", "rain", "storm", "snow", "fog", "wind", "night", "sunset", "aurora"];

function Chips({ options, value, onChange, multi }) {
  const vals = multi ? (Array.isArray(value) ? value : []) : [];
  return (
    <div className="aiw-chips">
      {options.map((opt) => {
        const id = typeof opt === "string" ? opt : opt.id;
        const label = typeof opt === "string" ? opt.replace(/_/g, " ") : opt.label;
        const active = multi ? vals.includes(id) : value === id;
        const handle = () => {
          if (multi) { onChange(active ? vals.filter(v => v !== id) : [...vals, id]); }
          else { onChange(id); }
        };
        return <button key={id} onClick={handle} className={`aiw-chip ${active ? "aiw-chip--active" : ""}`} type="button">{label}</button>;
      })}
    </div>
  );
}

export default function AIWizardModal({ onGenerate, onClose }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [a, setA] = useState({
    format: "manga", pageCount: "4", mainStyle: "shonen",
    genre: "action", synopsis: "", tone: "epic", pacing: "normal", narration: "third_person",
    storyPrompt: "", enhanceStory: true,
    characters: [{ name: "", age: "", personality: "", appearance: "", role: "protagonist", powers: "", weapon: "", catchphrase: "" }],
    location: "", era: "modern", weather: "clear", worldDetails: "",
    panelsPerPage: "4", panelStyle: "classic_grid", transitions: ["cut"],
    cameraDefault: "varied", keyMoments: "",
    dialogueStyle: "natural", bubbleStyle: "normal", bubblePosition: "auto",
    narrationBox: "none", sfxStyle: "japanese", sampleDialogue: "",
    artStyle: "manga_bw", detailLevel: "detailed", lighting: "dramatic",
    colorPalette: "monochrome", quality: "ultra",
    extraInstructions: "",
  });

  const set = (k, v) => setA({ ...a, [k]: v });
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const addChar = () => { if (a.characters.length < 8) set("characters", [...a.characters, { name: "", age: "", personality: "", appearance: "", role: "supporting", powers: "", weapon: "", catchphrase: "" }]); };
  const removeChar = (i) => { if (a.characters.length > 1) set("characters", a.characters.filter((_, idx) => idx !== i)); };
  const updateChar = (i, f, v) => { set("characters", a.characters.map((c, idx) => idx === i ? { ...c, [f]: v } : c)); };

  /**
   * Generate a full story prompt using AI based on every wizard answer.
   * Lets the user skip writing the story manually — fills storyPrompt textarea.
   */
  const [aiStoryLoading, setAiStoryLoading] = useState(false);
  const generateStoryWithAI = async () => {
    setAiStoryLoading(true);
    try {
      const characterList = a.characters
        .filter((c) => c.name)
        .map((c) =>
          `${c.name} (${c.role}, ${c.age || "?"} y/o): ${c.personality || "?"}; appearance: ${c.appearance || "?"}; powers: ${c.powers || "none"}; weapon: ${c.weapon || "none"}; catchphrase: ${c.catchphrase || "none"}`,
        )
        .join("\n");
      const fallback = `Write a complete ${a.genre.replace(/_/g, " ")} ${a.format} story in ${a.tone} tone with ${a.pacing} pacing (${a.pageCount} pages, ${a.panelsPerPage} panels each = ${Number(a.pageCount) * Number(a.panelsPerPage)} beats).
Style: ${a.mainStyle}/${a.artStyle.replace(/_/g, " ")}, narration: ${a.narration.replace(/_/g, " ")}.
Setting: ${a.location || "unspecified"}, era ${a.era.replace(/_/g, " ")}, weather ${a.weather}.
${a.worldDetails ? `World details: ${a.worldDetails}\n` : ""}Characters:\n${characterList}\n
${a.synopsis ? `Brief synopsis to expand: ${a.synopsis}\n` : ""}${a.keyMoments ? `Key moments to hit: ${a.keyMoments}\n` : ""}${a.sampleDialogue ? `Sample dialogue style: ${a.sampleDialogue}\n` : ""}
Output a vivid scene-by-scene story with action, emotion and dialogue. Keep characters consistent. Make every page advance the plot.`;

      const res = await Promise.race([
        api.post(
          "/prompt/manga-compose",
          {
            mode: "chapter",
            lang: "en",
            fallback_prompt: fallback,
            project: {
              characters: a.characters.filter((c) => c.name).map((c) => ({
                name: c.name,
                description: `${c.appearance}. ${c.personality}. ${c.powers || ""} ${c.weapon || ""}`,
              })),
              scenarios: [{ name: a.location, description: `${a.era} ${a.weather} ${a.worldDetails || ""}` }],
            },
          },
          { timeout: 20000 },
        ),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 22000)),
      ]);
      if (res?.data?.prompt) {
        set("storyPrompt", res.data.prompt);
        toast.success("História gerada com IA — podes editar antes de gerar.");
      } else {
        toast.error("A IA não devolveu texto. Tenta novamente.");
      }
    } catch (err) {
      toast.error("Falha ao gerar história: " + (err.message || "erro"));
    } finally {
      setAiStoryLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setStatusMsg("Building manga structure...");
    try {
      // Enhance story with GPT if enabled
      let enhancedSynopsis = a.synopsis || a.storyPrompt || "";
      if (a.enhanceStory && (a.synopsis || a.storyPrompt)) {
        setStatusMsg("Enhancing story with AI...");
        try {
          const gptRes = await Promise.race([
            api.post("/prompt/manga-compose", {
              mode: "chapter", lang: "en",
              fallback_prompt: `${a.genre} ${a.tone} story: ${a.synopsis || a.storyPrompt}. Characters: ${a.characters.map(c => c.name).join(", ")}. Setting: ${a.location} ${a.era}.`,
              project: { characters: a.characters.filter(c => c.name).map(c => ({ name: c.name, description: `${c.appearance}. ${c.personality}. ${c.powers || ""}` })), scenarios: [{ name: a.location, description: `${a.era} ${a.weather}` }] },
            }, { timeout: 12000 }),
            new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 13000)),
          ]);
          if (gptRes?.data?.prompt) enhancedSynopsis = gptRes.data.prompt;
        } catch { /* use local */ }
      }

      setStatusMsg("Generating pages and cards...");
      const result = generateMangaFromWizard({
        ...a,
        synopsis: enhancedSynopsis,
        panelsPerPage: Number(a.panelsPerPage) || 4,
      });

      // Inject dialogue/bubble settings into speech nodes
      result.pages.forEach(pg => {
        pg.nodes.forEach(n => {
          if (n.type === "speech") {
            n.data.style = a.bubbleStyle;
            n.data.tailDirection = a.bubblePosition === "auto" ? "left" : a.bubblePosition;
            if (a.sampleDialogue && !n.data.text) n.data.text = a.sampleDialogue.slice(0, 100);
          }
        });
      });

      await new Promise(r => setTimeout(r, 600));
      onGenerate(result);
      toast.success(`${result.pages.length} pages with ${a.panelsPerPage} panels each!`);
    } catch (err) {
      toast.error("Failed: " + (err.message || "Error"));
    } finally { setGenerating(false); setStatusMsg(""); }
  };

  return (
    <div className="aiw-overlay" data-testid="ai-wizard-modal">
      <div className="aiw-modal">
        <div className="aiw-header">
          <div className="flex items-center gap-3">
            <div className="aiw-header__icon"><Sparkles className="w-5 h-5" /></div>
            <div><h2 className="aiw-header__title">Create with AI</h2><p className="aiw-header__sub">Step {step + 1}/{STEPS.length} — {current.title}</p></div>
          </div>
          <button onClick={onClose} className="mfg-close"><X className="w-5 h-5" /></button>
        </div>

        <div className="aiw-progress">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`aiw-progress__step ${i < step ? "aiw-progress__step--done" : i === step ? "aiw-progress__step--active" : ""}`}>
              <div className="aiw-progress__dot">{i < step ? <Check className="w-3 h-3" /> : s.num}</div>
              <span className="aiw-progress__label">{s.title}</span>
            </div>
          ))}
        </div>

        <div className="aiw-body">
          {/* STEP 1: PROJECT */}
          {step === 0 && (<div className="aiw-step">
            <h3 className="aiw-step__title">What are you creating?</h3>
            <div className="aiw-field"><label className="aiw-label">Format</label><Chips options={FORMATS} value={a.format} onChange={v => set("format", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Pages</label><Chips options={PAGE_COUNTS} value={a.pageCount} onChange={v => set("pageCount", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Main style</label><Chips options={MAIN_STYLES} value={a.mainStyle} onChange={v => set("mainStyle", v)} /></div>
          </div>)}

          {/* STEP 2: STORY */}
          {step === 1 && (<div className="aiw-step">
            <h3 className="aiw-step__title">Your story</h3>
            <div className="aiw-field"><label className="aiw-label">Genre</label><Chips options={GENRES} value={a.genre} onChange={v => set("genre", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Tone</label><Chips options={TONES} value={a.tone} onChange={v => set("tone", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Pacing</label><Chips options={PACING} value={a.pacing} onChange={v => set("pacing", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Narration type</label><Chips options={NARRATION} value={a.narration} onChange={v => set("narration", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Synopsis (brief)</label>
              <textarea value={a.synopsis} onChange={e => set("synopsis", e.target.value)} placeholder="Brief plot summary..." className="aiw-textarea" rows={3} /></div>
            <div className="aiw-field">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="aiw-label">Full story prompt (opcional — quanto mais detalhe, melhor)</label>
                <button
                  type="button"
                  onClick={generateStoryWithAI}
                  disabled={aiStoryLoading}
                  className="manga-flow-btn manga-flow-btn-primary"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  data-testid="wizard-generate-story-btn"
                >
                  {aiStoryLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> A gerar…</> : <><Sparkles className="w-3.5 h-3.5" /> Gerar história com IA</>}
                </button>
              </div>
              <textarea value={a.storyPrompt} onChange={e => set("storyPrompt", e.target.value)} placeholder="Escreve a história completa aqui, ou clica em 'Gerar história com IA' para que a IA escreva uma baseada nas tuas escolhas. Podes editar livremente depois." className="aiw-textarea" rows={6} />
              <label className="aiw-toggle-row">
                <input type="checkbox" checked={a.enhanceStory} onChange={e => set("enhanceStory", e.target.checked)} className="aiw-checkbox" />
                <span className="aiw-toggle-label">Refinar com IA antes de gerar (GPT melhora a tua história)</span>
              </label>
            </div>
          </div>)}

          {/* STEP 3: CHARACTERS */}
          {step === 2 && (<div className="aiw-step">
            <h3 className="aiw-step__title">Characters</h3>
            <div className="aiw-chars">
              {a.characters.map((c, i) => (
                <div key={i} className="aiw-char-card">
                  <div className="aiw-char-card__head">
                    <span className="aiw-char-card__num">Character {i + 1}</span>
                    {a.characters.length > 1 && <button onClick={() => removeChar(i)} className="aiw-char-card__del" type="button"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                  <input value={c.name} onChange={e => updateChar(i, "name", e.target.value)} placeholder="Name *" className="aiw-input" />
                  <div className="flex gap-2">
                    <input value={c.age} onChange={e => updateChar(i, "age", e.target.value)} placeholder="Age" className="aiw-input" style={{ width: "25%" }} />
                    <select value={c.role} onChange={e => updateChar(i, "role", e.target.value)} className="aiw-input" style={{ width: "75%" }}>
                      <option value="protagonist">Protagonist</option><option value="antagonist">Antagonist</option>
                      <option value="supporting">Supporting</option><option value="mentor">Mentor</option>
                      <option value="rival">Rival</option><option value="love_interest">Love Interest</option>
                      <option value="comic_relief">Comic Relief</option><option value="mysterious">Mysterious</option>
                    </select>
                  </div>
                  <textarea value={c.appearance} onChange={e => updateChar(i, "appearance", e.target.value)} placeholder="Appearance: hair, eyes, body, outfit..." className="aiw-textarea" rows={2} />
                  <input value={c.personality} onChange={e => updateChar(i, "personality", e.target.value)} placeholder="Personality: brave, shy, funny..." className="aiw-input" />
                  <input value={c.powers} onChange={e => updateChar(i, "powers", e.target.value)} placeholder="Powers / Skills (optional)" className="aiw-input" />
                  <input value={c.weapon} onChange={e => updateChar(i, "weapon", e.target.value)} placeholder="Weapon / Item (optional)" className="aiw-input" />
                  <input value={c.catchphrase} onChange={e => updateChar(i, "catchphrase", e.target.value)} placeholder="Catchphrase (optional)" className="aiw-input" />
                </div>
              ))}
            </div>
            {a.characters.length < 8 && <button onClick={addChar} className="aiw-add-char" type="button"><Plus className="w-4 h-4" /> Add character</button>}
          </div>)}

          {/* STEP 4: WORLD */}
          {step === 3 && (<div className="aiw-step">
            <h3 className="aiw-step__title">World & Setting</h3>
            <div className="aiw-field"><label className="aiw-label">Main location</label><input value={a.location} onChange={e => set("location", e.target.value)} placeholder="Tokyo school, enchanted forest..." className="aiw-input" /></div>
            <div className="aiw-field"><label className="aiw-label">Era / Setting</label><Chips options={ERAS} value={a.era} onChange={v => set("era", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Weather / Time</label><Chips options={WEATHER_OPTS} value={a.weather} onChange={v => set("weather", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">World details (optional)</label>
              <textarea value={a.worldDetails} onChange={e => set("worldDetails", e.target.value)} placeholder="Describe the world: rules, history, special locations, magic system..." className="aiw-textarea" rows={3} /></div>
          </div>)}

          {/* STEP 5: PANELS */}
          {step === 4 && (<div className="aiw-step">
            <h3 className="aiw-step__title">Panels & Layout</h3>
            <div className="aiw-field"><label className="aiw-label">Panels per page</label><Chips options={PANEL_COUNTS} value={a.panelsPerPage} onChange={v => set("panelsPerPage", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Panel layout style</label><Chips options={PANEL_STYLES} value={a.panelStyle} onChange={v => set("panelStyle", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Scene transitions</label><Chips options={TRANSITION_STYLES} value={a.transitions} onChange={v => set("transitions", v)} multi /></div>
            <div className="aiw-field"><label className="aiw-label">Default camera</label><Chips options={CAMERA_DEFAULTS} value={a.cameraDefault} onChange={v => set("cameraDefault", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Key moments to highlight (optional)</label>
              <textarea value={a.keyMoments} onChange={e => set("keyMoments", e.target.value)} placeholder="e.g. 'Page 3: big reveal of the villain. Page 5: fight scene climax. Last page: emotional farewell.'" className="aiw-textarea" rows={3} /></div>
          </div>)}

          {/* STEP 6: DIALOGUE */}
          {step === 5 && (<div className="aiw-step">
            <h3 className="aiw-step__title"><MessageCircle className="w-5 h-5 inline mr-2" />Dialogue & Bubbles</h3>
            <div className="aiw-field"><label className="aiw-label">Dialogue style</label>
              <Chips options={[{id:"natural",label:"Natural"},{id:"dramatic",label:"Dramatic"},{id:"comedic",label:"Comedic"},{id:"poetic",label:"Poetic"},{id:"minimal",label:"Minimal/Silent"}]} value={a.dialogueStyle} onChange={v => set("dialogueStyle", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Speech bubble style</label><Chips options={BUBBLE_STYLES} value={a.bubbleStyle} onChange={v => set("bubbleStyle", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Bubble position</label><Chips options={BUBBLE_POSITIONS} value={a.bubblePosition} onChange={v => set("bubblePosition", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Narration boxes</label><Chips options={NARRATION_BOX} value={a.narrationBox} onChange={v => set("narrationBox", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Sound effects (SFX) style</label><Chips options={SFX_STYLES} value={a.sfxStyle} onChange={v => set("sfxStyle", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Sample dialogue (optional — AI will generate more)</label>
              <textarea value={a.sampleDialogue} onChange={e => set("sampleDialogue", e.target.value)} placeholder="Write example lines your characters would say..." className="aiw-textarea" rows={3} /></div>
          </div>)}

          {/* STEP 7: STYLE */}
          {step === 6 && (<div className="aiw-step">
            <h3 className="aiw-step__title">Visual Style</h3>
            <div className="aiw-field"><label className="aiw-label">Art style</label><Chips options={ART_STYLES} value={a.artStyle} onChange={v => set("artStyle", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Detail level</label><Chips options={DETAIL_LEVELS} value={a.detailLevel} onChange={v => set("detailLevel", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Lighting</label><Chips options={LIGHTING_OPTS} value={a.lighting} onChange={v => set("lighting", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Color palette</label><Chips options={COLOR_PALETTES} value={a.colorPalette} onChange={v => set("colorPalette", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Quality</label><Chips options={["medium","high","ultra"]} value={a.quality} onChange={v => set("quality", v)} /></div>
            <div className="aiw-field"><label className="aiw-label">Extra instructions (optional)</label>
              <textarea value={a.extraInstructions} onChange={e => set("extraInstructions", e.target.value)} placeholder="e.g. 'style of Eiichiro Oda', 'high contrast inking', 'Studio Bones animation quality'..." className="aiw-textarea" rows={3} /></div>
            <div className="aiw-model-rec"><Wand2 className="w-5 h-5 text-[#A855F7]" /><div><p className="aiw-model-rec__name">Flux (Recommended)</p><p className="aiw-model-rec__desc">Best for manga character consistency</p></div></div>
          </div>)}

          {/* STEP 8: CONFIRM */}
          {step === 7 && (<div className="aiw-step">
            <h3 className="aiw-step__title"><BookOpen className="w-5 h-5 inline mr-2" />Review & Generate</h3>
            {generating ? (
              <div className="aiw-generating"><Loader2 className="w-10 h-10 animate-spin text-[#14B8A6]" /><p className="aiw-generating__text">{statusMsg}</p></div>
            ) : (
              <div className="aiw-summary">
                <div className="aiw-summary__row"><span>Format:</span><strong>{a.format} · {a.pageCount} pages</strong></div>
                <div className="aiw-summary__row"><span>Style:</span><strong>{a.mainStyle} / {a.artStyle.replace(/_/g," ")}</strong></div>
                <div className="aiw-summary__row"><span>Genre:</span><strong>{a.genre.replace(/_/g," ")} · {a.tone}</strong></div>
                <div className="aiw-summary__row"><span>Pacing:</span><strong>{a.pacing}</strong></div>
                <div className="aiw-summary__row"><span>Panels:</span><strong>{a.panelsPerPage}/page · {a.panelStyle.replace(/_/g," ")}</strong></div>
                <div className="aiw-summary__row"><span>Characters:</span><strong>{a.characters.filter(c=>c.name).map(c=>`${c.name} (${c.role})`).join(", ")||"None"}</strong></div>
                <div className="aiw-summary__row"><span>World:</span><strong>{a.location||"?"} · {a.era.replace(/_/g," ")} · {a.weather}</strong></div>
                <div className="aiw-summary__row"><span>Dialogue:</span><strong>{a.dialogueStyle} · {a.bubbleStyle} bubbles · SFX: {a.sfxStyle}</strong></div>
                <div className="aiw-summary__row"><span>Visual:</span><strong>{a.detailLevel.replace(/_/g," ")} · {a.lighting} · {a.colorPalette} · {a.quality}</strong></div>
                {a.synopsis && <div className="aiw-summary__synopsis"><span>Synopsis:</span><p>{a.synopsis}</p></div>}

                <div className="aiw-field" style={{ marginTop: 16, padding: 12, border: "1px solid rgba(168,85,247,0.3)", borderRadius: 10, background: "rgba(168,85,247,0.05)" }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="aiw-label" style={{ margin: 0 }}>📖 História final (opcional — em vez de escrever manualmente, deixa a IA criar tudo)</label>
                    <button
                      type="button"
                      onClick={generateStoryWithAI}
                      disabled={aiStoryLoading}
                      className="manga-flow-btn manga-flow-btn-primary"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                      data-testid="wizard-confirm-generate-story-btn"
                    >
                      {aiStoryLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> A gerar…</> : <><Sparkles className="w-3.5 h-3.5" /> Gerar história completa</>}
                    </button>
                  </div>
                  <textarea
                    value={a.storyPrompt}
                    onChange={e => set("storyPrompt", e.target.value)}
                    placeholder="Clica em 'Gerar história completa' para a IA escrever uma história tailored às tuas escolhas, ou escreve aqui livremente. Esta história alimenta toda a geração."
                    className="aiw-textarea"
                    rows={8}
                    style={{ marginTop: 8 }}
                    data-testid="wizard-confirm-story-textarea"
                  />
                  <label className="aiw-toggle-row" style={{ marginTop: 6 }}>
                    <input type="checkbox" checked={a.enhanceStory} onChange={e => set("enhanceStory", e.target.checked)} className="aiw-checkbox" />
                    <span className="aiw-toggle-label">Refinar com GPT antes de gerar painéis</span>
                  </label>
                </div>

                <p className="text-[11px] text-[#14B8A6] mt-3">
                  Cria {a.pageCount} páginas de storyboard com {a.panelsPerPage} painéis cada ({Number(a.pageCount) * Number(a.panelsPerPage)} momentos no total).
                  Usa <strong>Generate Page</strong> em cada página para renderizar a arte do comic (uma imagem por página com painéis distintos).
                </p>
              </div>
            )}
          </div>)}
        </div>

        <div className="aiw-footer">
          {step > 0 && !generating && <button onClick={() => setStep(step-1)} className="manga-flow-btn"><ChevronLeft className="w-4 h-4" /> Back</button>}
          <div className="flex-1" />
          {isLast ? (
            <button onClick={handleGenerate} disabled={generating} className="mfg-generate-btn" style={{ width: "auto", padding: "12px 28px" }}>
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate {a.pageCount} Pages</>}
            </button>
          ) : (
            <button onClick={() => setStep(step+1)} className="manga-flow-btn manga-flow-btn-primary" style={{ padding: "10px 24px" }}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
