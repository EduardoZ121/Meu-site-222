import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Loader2, Plus, Trash2, Check, Wand2 } from "lucide-react";
import { generateMangaFromWizard } from "./generateMangaFromWizard";
import { toast } from "sonner";

const STEPS = [
  { id: "project", title: "Project Type", num: 1 },
  { id: "story", title: "Your Story", num: 2 },
  { id: "characters", title: "Characters", num: 3 },
  { id: "world", title: "World & Setting", num: 4 },
  { id: "style", title: "Visual Style", num: 5 },
  { id: "confirm", title: "Confirm & Generate", num: 6 },
];

const FORMATS = [
  { id: "manga", label: "Manga", desc: "Japanese manga format" },
  { id: "comic", label: "Comic Book", desc: "Western comic style" },
  { id: "webtoon", label: "Webtoon", desc: "Vertical scroll format" },
  { id: "graphic_novel", label: "Graphic Novel", desc: "Detailed, cinematic panels" },
];
const PAGE_COUNTS = ["1", "4", "8", "12", "20"];
const MAIN_STYLES = ["shonen", "shojo", "seinen", "disney", "ghibli", "dark", "realistic", "retro"];
const GENRES = ["action", "romance", "horror", "adventure", "slice_of_life", "fantasy", "comedy", "drama"];
const TONES = ["epic", "cute", "dark", "humor", "dramatic", "romantic", "tense", "cheerful"];
const ART_STYLES = ["manga", "anime", "comic", "realistic", "ghibli", "webtoon"];
const SUB_STYLES = ["bw", "color", "lineart", "screentone", "watercolor"];
const QUALITIES = ["medium", "high", "ultra"];

function Chips({ options, value, onChange, renderOpt }) {
  return (
    <div className="aiw-chips">
      {options.map((opt) => {
        const id = typeof opt === "string" ? opt : opt.id;
        return (
          <button key={id} onClick={() => onChange(id)} className={`aiw-chip ${value === id ? "aiw-chip--active" : ""}`} type="button">
            {renderOpt ? renderOpt(opt) : (typeof opt === "string" ? opt.replace(/_/g, " ") : opt.label)}
          </button>
        );
      })}
    </div>
  );
}

export default function AIWizardModal({ onGenerate, onClose }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState({
    format: "manga",
    pageCount: "4",
    mainStyle: "shonen",
    genre: "action",
    synopsis: "",
    tone: "epic",
    characters: [{ name: "", age: "", personality: "", appearance: "", role: "protagonist" }],
    location: "",
    era: "",
    climate: "",
    artStyle: "manga",
    subStyle: "bw",
    quality: "ultra",
  });

  const set = (key, val) => setAnswers({ ...answers, [key]: val });
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const canNext = () => {
    if (step === 0) return answers.format && answers.pageCount;
    if (step === 1) return answers.genre;
    if (step === 2) return answers.characters.some(c => c.name.trim());
    return true;
  };

  const addCharacter = () => {
    if (answers.characters.length >= 6) return;
    set("characters", [...answers.characters, { name: "", age: "", personality: "", appearance: "", role: "supporting" }]);
  };
  const removeCharacter = (i) => {
    if (answers.characters.length <= 1) return;
    set("characters", answers.characters.filter((_, idx) => idx !== i));
  };
  const updateCharacter = (i, field, val) => {
    set("characters", answers.characters.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const result = generateMangaFromWizard(answers);
      onGenerate(result);
      toast.success(`${result.pages.length} pages generated! Edit them in the canvas.`);
    } catch (err) {
      toast.error("Generation failed: " + (err.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="aiw-overlay" data-testid="ai-wizard-modal">
      <div className="aiw-modal">
        {/* Header */}
        <div className="aiw-header">
          <div className="flex items-center gap-3">
            <div className="aiw-header__icon"><Sparkles className="w-5 h-5" /></div>
            <div>
              <h2 className="aiw-header__title">Create with AI</h2>
              <p className="aiw-header__sub">Step {step + 1} of {STEPS.length} — {current.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="mfg-close"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress */}
        <div className="aiw-progress">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`aiw-progress__step ${i < step ? "aiw-progress__step--done" : i === step ? "aiw-progress__step--active" : ""}`}>
              <div className="aiw-progress__dot">{i < step ? <Check className="w-3 h-3" /> : s.num}</div>
              <span className="aiw-progress__label">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="aiw-body">
          {step === 0 && (
            <div className="aiw-step">
              <h3 className="aiw-step__title">What are you creating?</h3>
              <div className="aiw-field"><label className="aiw-label">Format</label>
                <Chips options={FORMATS} value={answers.format} onChange={(v) => set("format", v)}
                  renderOpt={(o) => <span>{o.label} <span className="aiw-chip__desc">{o.desc}</span></span>} />
              </div>
              <div className="aiw-field"><label className="aiw-label">Number of pages</label>
                <Chips options={PAGE_COUNTS} value={answers.pageCount} onChange={(v) => set("pageCount", v)} />
              </div>
              <div className="aiw-field"><label className="aiw-label">Main style</label>
                <Chips options={MAIN_STYLES} value={answers.mainStyle} onChange={(v) => set("mainStyle", v)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="aiw-step">
              <h3 className="aiw-step__title">Tell us about your story</h3>
              <div className="aiw-field"><label className="aiw-label">Genre</label>
                <Chips options={GENRES} value={answers.genre} onChange={(v) => set("genre", v)} />
              </div>
              <div className="aiw-field"><label className="aiw-label">Brief synopsis</label>
                <textarea value={answers.synopsis} onChange={(e) => set("synopsis", e.target.value)}
                  placeholder="A young warrior discovers a hidden power and must save their village from a dark force..."
                  className="aiw-textarea" rows={4} />
              </div>
              <div className="aiw-field"><label className="aiw-label">Emotional tone</label>
                <Chips options={TONES} value={answers.tone} onChange={(v) => set("tone", v)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="aiw-step">
              <h3 className="aiw-step__title">Who are your characters?</h3>
              <div className="aiw-chars">
                {answers.characters.map((char, i) => (
                  <div key={i} className="aiw-char-card">
                    <div className="aiw-char-card__head">
                      <span className="aiw-char-card__num">Character {i + 1}</span>
                      {answers.characters.length > 1 && (
                        <button onClick={() => removeCharacter(i)} className="aiw-char-card__del" type="button"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    <input value={char.name} onChange={(e) => updateCharacter(i, "name", e.target.value)} placeholder="Name *" className="aiw-input" />
                    <div className="flex gap-2">
                      <input value={char.age} onChange={(e) => updateCharacter(i, "age", e.target.value)} placeholder="Age" className="aiw-input" style={{ width: "30%" }} />
                      <select value={char.role} onChange={(e) => updateCharacter(i, "role", e.target.value)} className="aiw-input" style={{ width: "70%" }}>
                        <option value="protagonist">Protagonist</option>
                        <option value="antagonist">Antagonist</option>
                        <option value="supporting">Supporting</option>
                        <option value="mentor">Mentor</option>
                        <option value="rival">Rival</option>
                      </select>
                    </div>
                    <input value={char.personality} onChange={(e) => updateCharacter(i, "personality", e.target.value)} placeholder="Personality (brave, shy, funny...)" className="aiw-input" />
                    <textarea value={char.appearance} onChange={(e) => updateCharacter(i, "appearance", e.target.value)} placeholder="Appearance (hair color, outfit, features...)" className="aiw-textarea" rows={2} />
                  </div>
                ))}
              </div>
              {answers.characters.length < 6 && (
                <button onClick={addCharacter} className="aiw-add-char" type="button"><Plus className="w-4 h-4" /> Add character</button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="aiw-step">
              <h3 className="aiw-step__title">Where does it happen?</h3>
              <div className="aiw-field"><label className="aiw-label">Main location</label>
                <input value={answers.location} onChange={(e) => set("location", e.target.value)} placeholder="Tokyo high school, enchanted forest, space station..." className="aiw-input" />
              </div>
              <div className="aiw-field"><label className="aiw-label">Era / Environment</label>
                <input value={answers.era} onChange={(e) => set("era", e.target.value)} placeholder="Modern Japan, Medieval kingdom, Cyberpunk city..." className="aiw-input" />
              </div>
              <div className="aiw-field"><label className="aiw-label">Climate / Atmosphere</label>
                <input value={answers.climate} onChange={(e) => set("climate", e.target.value)} placeholder="Rainy, sunny, foggy, snowy..." className="aiw-input" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="aiw-step">
              <h3 className="aiw-step__title">Visual preferences</h3>
              <div className="aiw-field"><label className="aiw-label">Art style</label>
                <Chips options={ART_STYLES} value={answers.artStyle} onChange={(v) => set("artStyle", v)} />
              </div>
              <div className="aiw-field"><label className="aiw-label">Sub-style</label>
                <Chips options={SUB_STYLES} value={answers.subStyle} onChange={(v) => set("subStyle", v)} />
              </div>
              <div className="aiw-field"><label className="aiw-label">Quality</label>
                <Chips options={QUALITIES} value={answers.quality} onChange={(v) => set("quality", v)} />
              </div>
              <div className="aiw-field">
                <label className="aiw-label">Recommended model</label>
                <div className="aiw-model-rec">
                  <Wand2 className="w-5 h-5 text-[#A855F7]" />
                  <div><p className="aiw-model-rec__name">Flux (Recommended)</p><p className="aiw-model-rec__desc">Best quality for manga, strong character consistency</p></div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="aiw-step">
              <h3 className="aiw-step__title">Review & Generate</h3>
              <div className="aiw-summary">
                <div className="aiw-summary__row"><span>Format:</span><strong>{answers.format}</strong></div>
                <div className="aiw-summary__row"><span>Pages:</span><strong>{answers.pageCount}</strong></div>
                <div className="aiw-summary__row"><span>Style:</span><strong>{answers.mainStyle} / {answers.artStyle}</strong></div>
                <div className="aiw-summary__row"><span>Genre:</span><strong>{answers.genre}</strong></div>
                <div className="aiw-summary__row"><span>Tone:</span><strong>{answers.tone}</strong></div>
                <div className="aiw-summary__row"><span>Characters:</span><strong>{answers.characters.filter(c => c.name).map(c => c.name).join(", ") || "None"}</strong></div>
                <div className="aiw-summary__row"><span>Location:</span><strong>{answers.location || "Not set"}</strong></div>
                <div className="aiw-summary__row"><span>Era:</span><strong>{answers.era || "Not set"}</strong></div>
                {answers.synopsis && (
                  <div className="aiw-summary__synopsis"><span>Synopsis:</span><p>{answers.synopsis}</p></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="aiw-footer">
          {step > 0 && !generating && (
            <button onClick={() => setStep(step - 1)} className="manga-flow-btn"><ChevronLeft className="w-4 h-4" /> Back</button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <button onClick={handleGenerate} disabled={generating} className="mfg-generate-btn" style={{ width: "auto", padding: "12px 32px" }}>
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating manga...</> : <><Sparkles className="w-5 h-5" /> Generate Complete Manga</>}
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)} disabled={!canNext()} className="manga-flow-btn manga-flow-btn-primary" style={{ padding: "10px 24px" }}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
