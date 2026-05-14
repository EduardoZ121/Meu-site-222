import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, Sparkles, ArrowLeft, Upload, X, Check, Image as ImageIcon,
  Layers, Crown, Zap, Aperture,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import { compressImage } from "../../lib/imageCompress";
import { fileToDataURL } from "../../lib/fileToDataURL";
import useTitle from "../../lib/useTitle";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CAT_LABELS = {
  flyer:     "Flyers",
  editorial: "Editorial",
  epic:      "Epic",
  scifi:     "Sci-Fi",
  hero:      "Hero",
  phone:     "Music Phone",
};

const CAT_ORDER = ["flyer", "editorial", "epic", "scifi", "hero", "phone"];

// Gradient backgrounds per category — gives visual hierarchy to template cards
const CAT_GRADIENTS = {
  flyer:     "linear-gradient(135deg,#1A1A1C 0%,#EF4444 55%,#FACC15 100%)",
  editorial: "linear-gradient(135deg,#0F1419 0%,#2D3748 50%,#F4F1EA 100%)",
  epic:      "linear-gradient(135deg,#0B0B0C 0%,#7C3AED 50%,#FACC15 100%)",
  scifi:     "linear-gradient(135deg,#06122B 0%,#1E3A8A 55%,#06B6D4 100%)",
  hero:      "linear-gradient(135deg,#220505 0%,#7F1D1D 55%,#EF4444 100%)",
  phone:     "linear-gradient(135deg,#1B1340 0%,#7C3AED 50%,#EC4899 100%)",
};

const FIELD_LABELS = {
  artist_name: "Nome do artista",
  tour_name: "Nome da tour",
  album_name: "Nome do álbum",
  event_name: "Nome do evento",
  event_date: "Data do evento",
  venue: "Venue / Local",
  city: "Cidade / País",
  date: "Data",
  date_range: "Período",
  dates: "Datas e horários",
  brand_name: "Marca",
  product: "Produto",
  campaign: "Campanha",
  title: "Título",
  subtitle: "Subtítulo",
  tagline: "Slogan / Texto",
  topic: "Tema",
  category: "Categoria",
  additional_text: "Texto adicional",
  before_label: "Texto 'antes'",
  after_label: "Texto 'depois'",
  headline: "Manchete",
  caption: "Legenda",
  brand: "Marca",
  cta: "Call to action",
  subtext: "Subtexto",
  details: "Detalhes",
  quote: "Citação",
  author: "Autor",
  hook: "Gancho",
  episode: "Episódio",
  swipe_text: "Texto do swipe",
  headliners: "Artistas principais",
  lineup: "Line-up",
  ticket_price: "Preço do bilhete",
  release_date: "Data de lançamento",
  release_title: "Título do lançamento",
  single: "Single",
  band: "Banda",
  performer: "Performer",
  conductor: "Maestro",
  piece: "Obra",
  orchestra: "Orquestra",
  dj_name: "DJ",
  club: "Clube",
  festival_name: "Nome do festival",
  couple_names: "Nomes do casal",
  age: "Idade",
  company: "Empresa",
  workshop_title: "Workshop",
  instructor: "Instrutor",
  exhibition_title: "Exposição",
  gallery: "Galeria",
  film: "Filme",
  organization: "Organização",
  conference_name: "Conferência",
  speakers: "Oradores",
  location: "Localização",
  business_name: "Negócio",
  address: "Morada",
  agent: "Agente",
  service: "Serviço",
  offer: "Oferta",
  event: "Evento",
  seat: "Lugar",
  tag_before: "Etiqueta 'antes'",
  tag_after: "Etiqueta 'depois'",
  duration: "Duração",
  stylist: "Estilista",
  salon: "Salão",
  model: "Modelo",
  year: "Ano",
  room: "Divisão",
  designer: "Designer",
  dish: "Prato",
  chef: "Chef",
  magazine_name: "Revista",
  issue: "Edição",
  deck: "Subtítulo",
  publication: "Publicação",
  rating: "Avaliação",
  book_title: "Título do livro",
  subhead: "Subtítulo",
  name: "Nome",
  years: "Anos",
  discount: "Desconto",
  deadline: "Prazo",
  launch_date: "Lançamento",
  app_name: "Aplicação",
  restaurant: "Restaurante",
  price: "Preço",
  collection: "Coleção",
  season: "Época",
  artist: "Artista",
};

const labelFor = (k) => FIELD_LABELS[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isLong = (k) => /text|description|tagline|story|notes|additional|caption|quote|details|deck|subhead/i.test(k);

const MOODS = [
  "Cinematográfico", "Neon", "Minimal", "Vintage",
  "Bold", "Luxury", "Editorial", "Brutalist",
  "Pastel", "Y2K", "Mono", "Sun-warm",
];

const QUICK_COLORS = [
  "#7C3AED", "#EC4899", "#06B6D4", "#22C55E",
  "#F59E0B", "#EF4444", "#F4F1EA", "#0B0B0C",
];

const FORMATS = [
  { key: "1:1",  label: "Square",     hint: "Post · 1080×1080" },
  { key: "4:5",  label: "Feed Tall",  hint: "Post · 1080×1350" },
  { key: "9:16", label: "Story",      hint: "Story · 1080×1920" },
  { key: "16:9", label: "Banner",     hint: "Wide · 1920×1080" },
  { key: "3:4",  label: "A3 / Print", hint: "Vertical Print" },
];

const MODEL_ICONS = {
  grok: Zap,
  flux2: Aperture,
  gpt_image: Crown,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Posters() {
  useTitle("Pôsteres");
  const navigate = useNavigate();
  const { refresh, user } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [category, setCategory] = useState("flyer");
  const [picked, setPicked] = useState(null);

  // Editor state
  const [values, setValues] = useState({});
  const [photo, setPhoto] = useState(null);
  const [modelKey, setModelKey] = useState("grok");
  const [aspect, setAspect] = useState("");      // empty = template default (4:5)
  const [numOutputs, setNumOutputs] = useState(1);
  const [mood, setMood] = useState("");
  const [colorHint, setColorHint] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/public/poster-templates").then((r) => setTemplates(r.data.templates || [])).catch(() => {});
    api.get("/public/poster-models").then((r) => setModels(r.data.models || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => templates.filter((t) => t.category === category), [templates, category]);

  const counts = useMemo(() => {
    const m = {};
    for (const t of templates) m[t.category] = (m[t.category] || 0) + 1;
    return m;
  }, [templates]);

  const selectedModel = models.find((m) => m.key === modelKey) || { cost: 15 };
  const totalCost = selectedModel.cost * numOutputs;

  const missing = picked ? picked.placeholders.filter((p) => !(values[p] || "").trim()) : [];

  const openTemplate = (tpl) => {
    setPicked(tpl);
    setValues({});
    setPhoto(null);
    setResult(null);
    setNumOutputs(1);
    // Default aspect ratio from prompt text (Vertical 4:5 / Square 1:1 etc.)
    const p = (tpl.prompt || "").toLowerCase();
    if (p.includes("9:16")) setAspect("9:16");
    else if (p.includes("16:9")) setAspect("16:9");
    else if (p.includes("1:1") || p.includes("square")) setAspect("1:1");
    else setAspect("4:5");
  };

  const generate = async () => {
    if (!picked) { toast.error("Escolhe um template."); return; }
    if (missing.length) {
      toast.error(`Preenche: ${missing.map(labelFor).join(", ")}`);
      return;
    }
    setBusy(true); setResult(null);
    try {
      // Auto-switch model if photo provided + GPT Image picked
      const effectiveModel = (photo && modelKey === "gpt_image") ? "flux2" : modelKey;
      if (photo && modelKey === "gpt_image") {
        toast.info("GPT Image 1 não suporta foto de referência — a usar Flux 2.");
      }

      let data;
      if (photo) {
        const fd = new FormData();
        fd.append("template_id", picked.id);
        fd.append("placeholders", JSON.stringify(values));
        fd.append("photo", await compressImage(photo));
        fd.append("model_key", effectiveModel);
        fd.append("aspect_ratio", aspect);
        fd.append("num_outputs", String(numOutputs));
        fd.append("mood", mood);
        fd.append("color_hint", colorHint);
        ({ data } = await api.post("/generate/poster", fd, { timeout: 240000 }));
      } else {
        ({ data } = await api.post("/generate/poster", {
          template_id: picked.id,
          placeholders: values,
          model_key: effectiveModel,
          aspect_ratio: aspect,
          num_outputs: numOutputs,
          mood, color_hint: colorHint,
        }, { timeout: 240000 }));
      }
      setResult(data.creation);
      toast.success(`Pôster pronto · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      const m = err?.response?.data?.detail || err?.message || "Falhou.";
      toast.error(typeof m === "string" ? m : "Falhou.");
    } finally { setBusy(false); }
  };

  /* ============================================================ */
  /*  EDITOR                                                       */
  /* ============================================================ */
  if (picked) {
    return (
      <Editor
        picked={picked}
        onBack={() => setPicked(null)}
        values={values} setValues={setValues}
        photo={photo} setPhoto={setPhoto}
        modelKey={modelKey} setModelKey={setModelKey}
        models={models}
        aspect={aspect} setAspect={setAspect}
        numOutputs={numOutputs} setNumOutputs={setNumOutputs}
        mood={mood} setMood={setMood}
        colorHint={colorHint} setColorHint={setColorHint}
        showColorPicker={showColorPicker} setShowColorPicker={setShowColorPicker}
        totalCost={totalCost} perImageCost={selectedModel.cost}
        busy={busy} result={result} setResult={setResult}
        missing={missing}
        onGenerate={generate}
        user={user}
      />
    );
  }

  /* ============================================================ */
  /*  GRID                                                         */
  /* ============================================================ */
  return (
    <div className="max-w-[1400px] mx-auto" data-testid="posters-page">
      <button
        onClick={() => navigate("/app/tools")}
        className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium"
        data-testid="posters-back"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <header className="mb-10">
        <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-3">Pôsteres</p>
        <h1 className="text-[#F4F1EA] text-[36px] md:text-[52px] font-light tracking-[-0.02em] leading-[1.02] mb-3 font-['Inter_Tight']">
          Pôsteres que parecem contratados.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[680px]">
          {templates.length || 20} templates reais extraídos do bot original — flyers de recrutamento,
          editorial, posters épicos, sci-fi, hero cinemático e music phone. Aplica a tua foto e
          gera em alta resolução com Grok, Flux 2 ou GPT Image 1.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-10" data-testid="poster-cats">
        {CAT_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2.5 rounded-full text-[12.5px] font-medium transition-all flex items-center gap-2 ${
              category === c
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
                : "bg-[#13131A] border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40"
            }`}
            data-testid={`postercat-${c}`}
          >
            {CAT_LABELS[c]}
            <span className={`text-[10px] font-mono ${category === c ? "text-white/70" : "text-[#5A5A5E]"}`}>
              {counts[c] ?? "—"}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="poster-templates-grid">
        {filtered.map((tpl, i) => (
          <TemplateCard key={tpl.id} tpl={tpl} index={i} onClick={() => openTemplate(tpl)} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Template card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({ tpl, index, onClick }) {
  const gradient = CAT_GRADIENTS[tpl.category] || CAT_GRADIENTS.editorial;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.025, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-[#13131A] border border-[#2E2E30] hover:border-[#7C3AED]/60 rounded-xl overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.45)]"
      data-testid={`tpl-${tpl.id}`}
    >
      {/* Visual preview area */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{ background: gradient }}>
        {/* grain overlay */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.25) 0%, transparent 50%)",
          }}
        />
        {/* Faux poster typography */}
        <div className="absolute inset-0 p-5 flex flex-col">
          <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/70">
            {CAT_LABELS[tpl.category]}
          </div>
          <div className="flex-1 flex items-center justify-center px-2">
            <p className="text-white text-center font-['Inter_Tight'] font-light text-[22px] leading-[1.05] tracking-[-0.02em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
              {tpl.label || tpl.id}
            </p>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-white/80 text-[9px] font-mono uppercase tracking-[0.18em]">
              {tpl.placeholders?.length ? `${tpl.placeholders.length} campos` : "Pronto a usar"}
            </span>
            <span className="text-white/70 text-[9px] font-mono">REMAKE · PIXEL</span>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[#7C3AED]/85 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-[12px] font-medium uppercase tracking-[0.15em] px-5 py-2.5 border border-white/50 rounded-full">
            Abrir editor →
          </span>
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight'] truncate">{tpl.label || tpl.id}</p>
        <Layers className="w-3.5 h-3.5 text-[#5A5A5E] shrink-0" />
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor                                                             */
/* ------------------------------------------------------------------ */

function Editor(props) {
  const {
    picked, onBack, values, setValues, photo, setPhoto,
    modelKey, setModelKey, models,
    aspect, setAspect, numOutputs, setNumOutputs,
    mood, setMood, colorHint, setColorHint,
    showColorPicker, setShowColorPicker,
    totalCost, perImageCost,
    busy, result, setResult,
    missing, onGenerate, user,
  } = props;

  const fileRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!photo) { setPhotoPreview(null); return; }
    fileToDataURL(photo).then((u) => { if (!cancelled) setPhotoPreview(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, [photo]);

  const handlePick = async (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="posters-editor">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium"
        data-testid="posters-back-to-grid"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar aos templates
      </button>

      {/* Header */}
      <div className="mb-10 flex items-start gap-5">
        <div
          className="shrink-0 w-16 h-20 rounded-lg shadow-lg shadow-black/40 relative overflow-hidden"
          style={{ background: CAT_GRADIENTS[picked.category] }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-mono uppercase tracking-[0.18em] px-2 text-center">
            {CAT_LABELS[picked.category]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-2">
            {CAT_LABELS[picked.category]}
          </p>
          <h1 className="text-[#F4F1EA] text-[28px] md:text-[36px] font-light tracking-[-0.02em] mb-2 font-['Inter_Tight']">
            {picked.label || picked.id}
          </h1>
          <p className="text-[#8A8A8E] text-[14px] max-w-[640px] leading-relaxed">
            {picked.placeholders && picked.placeholders.length > 0
              ? "Preenche os detalhes abaixo. Podes anexar uma foto de referência, escolher o modelo de IA, definir o mood e a paleta. Geramos em alta resolução pronto a partilhar."
              : "Template pronto a usar — anexa uma foto de referência (opcional), escolhe o modelo de IA, define o mood e a paleta. O prompt já está afinado para te dar o melhor resultado possível."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        {/* ====== LEFT: form ====== */}
        <div className="space-y-10">
          {/* 1 · Reference photo */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              01 · Foto de Referência <span className="text-[#5A5A5E] normal-case tracking-normal text-[11px] font-normal">(opcional)</span>
            </label>
            <label htmlFor="file-posters"
              
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handlePick(e.dataTransfer.files?.[0]); }}
              className={`relative block w-full aspect-[16/8] rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                photoPreview
                  ? "border-[#2E2E30] bg-[#0E0E12]"
                  : "border-[#2E2E30] hover:border-[#7C3AED]/70 bg-gradient-to-br from-[#13131A] via-[#0E0E12] to-[#0B0B0C] cursor-pointer group"
              }`}
              data-testid="poster-photo-area"
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-contain p-3" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                    className="absolute top-3 right-3 w-9 h-9 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black z-10"
                    data-testid="poster-photo-clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.10),transparent_60%)] pointer-events-none" />
                  <div className="relative w-14 h-14 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 flex items-center justify-center group-hover:bg-[#7C3AED]/20 group-hover:border-[#7C3AED]/50 transition-all">
                    <Upload className="w-6 h-6 text-[#C4B5FD]" strokeWidth={1.5} />
                  </div>
                  <p className="relative text-[#F4F1EA] text-[15px] font-medium font-['Inter_Tight']">
                    Anexar foto do artista, produto ou evento
                  </p>
                  <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.18em]">
                    Usado para preservar o rosto / objeto · JPEG, PNG, WEBP
                  </p>
                </div>
              )}
            </label>
            <input id="file-posters" ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePick(e.target.files?.[0])}
              data-testid="poster-photo-input"
            />
          </section>

          {/* 2 · Detalhes do pôster (escondido quando template não tem campos) */}
          {picked.placeholders && picked.placeholders.length > 0 && (
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              02 · Detalhes do Pôster
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {picked.placeholders.map((p) => (
                <div key={p} className={isLong(p) ? "sm:col-span-2" : ""}>
                  <label className="block text-[#F4F1EA] text-[12.5px] font-medium mb-1.5 font-['Inter_Tight']">
                    {labelFor(p)} <span className="text-[#7C3AED]">*</span>
                  </label>
                  {isLong(p) ? (
                    <textarea
                      rows={3}
                      value={values[p] || ""}
                      onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                      placeholder={`ex: ${labelFor(p).toLowerCase()}...`}
                      className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight']"
                      data-testid={`field-${p}`}
                    />
                  ) : (
                    <input
                      value={values[p] || ""}
                      onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                      placeholder={`ex: ${labelFor(p).toLowerCase()}...`}
                      className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none font-['Inter_Tight']"
                      data-testid={`field-${p}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
          )}

          {/* 3 · Mood + cor */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              03 · Mood & Paleta <span className="text-[#5A5A5E] normal-case tracking-normal text-[11px] font-normal">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-4" data-testid="poster-moods">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? "" : m)}
                  data-testid={`mood-${m}`}
                  className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all border ${
                    mood === m
                      ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                      : "bg-[#13131A] border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#8A8A8E] text-[11.5px] mr-1">Cor dominante:</span>
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColorHint(colorHint === c ? "" : c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    colorHint === c ? "border-[#F4F1EA] scale-110 ring-2 ring-[#7C3AED]/40" : "border-[#2E2E30] hover:border-[#7C3AED]/50"
                  }`}
                  style={{ background: c }}
                  data-testid={`color-${c.replace("#", "")}`}
                  aria-label={c}
                />
              ))}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="px-2.5 h-7 text-[11px] text-[#8A8A8E] hover:text-[#F4F1EA] border border-[#2E2E30] rounded-full transition-colors"
              >
                + custom
              </button>
              {showColorPicker && (
                <input
                  type="color"
                  value={colorHint || "#7C3AED"}
                  onChange={(e) => setColorHint(e.target.value)}
                  className="w-7 h-7 rounded-full bg-transparent border border-[#2E2E30] cursor-pointer"
                  data-testid="poster-color-picker"
                />
              )}
              {colorHint && (
                <span className="text-[10px] font-mono text-[#C4B5FD]">{colorHint.toUpperCase()}</span>
              )}
            </div>
          </section>

          {/* 4 · Modelo IA */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              04 · Escolha o Modelo de IA
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="poster-models">
              {models.map((m) => {
                const Icon = MODEL_ICONS[m.key] || Zap;
                const disabled = photo && !m.supports_photo;
                const active = modelKey === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => !disabled && setModelKey(m.key)}
                    disabled={disabled}
                    data-testid={`poster-model-${m.key}`}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                      disabled
                        ? "border-[#1F1F22] bg-[#0E0E12]/40 opacity-50 cursor-not-allowed"
                        : active
                          ? "border-[#7C3AED] bg-[#7C3AED]/10"
                          : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
                    }`}
                  >
                    {m.key === "gpt_image" && !disabled && (
                      <div className="absolute -top-px -right-px bg-gradient-to-l from-[#FACC15] to-[#F59E0B] text-black text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">
                        Premium
                      </div>
                    )}
                    {active && (
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
                    )}
                    <div className="relative flex items-start justify-between mb-3">
                      <Icon className={`w-5 h-5 ${active ? "text-[#C4B5FD]" : "text-[#8A8A8E]"}`} strokeWidth={1.5} />
                      {active && (
                        <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className={`relative text-[15px] font-light tracking-[-0.01em] mb-1 font-['Inter_Tight'] ${
                      active ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
                    }`}>{m.label}</p>
                    <p className="relative text-[#8A8A8E] text-[11px] mb-2.5">{m.tag}</p>
                    <p className="relative text-[#C4B5FD] text-[12px] font-mono">{m.cost} créditos</p>
                    {disabled && (
                      <p className="absolute bottom-2 right-3 text-[9px] font-mono uppercase text-[#5A5A5E]">sem foto</p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5 · Formato + variações */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              05 · Formato & Variações
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5" data-testid="poster-formats">
              {FORMATS.map(({ key, label, hint }) => (
                <button
                  key={key}
                  onClick={() => setAspect(key)}
                  data-testid={`poster-format-${key}`}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    aspect === key
                      ? "border-[#7C3AED] bg-[#7C3AED]/10"
                      : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
                  }`}
                >
                  <AspectMini ratio={key} active={aspect === key} />
                  <p className={`text-[12px] font-medium mt-2 font-['Inter_Tight'] ${aspect === key ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"}`}>{label}</p>
                  <p className="text-[#5A5A5E] text-[10px] mt-0.5">{hint}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-[#2E2E30] bg-[#13131A]/50">
              <div>
                <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">Gerar variações</p>
                <p className="text-[#8A8A8E] text-[11.5px] mt-0.5">
                  Cada variação custa {perImageCost} créditos.
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-[#2E2E30] p-0.5 bg-[#0B0B0C]" data-testid="poster-variations">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumOutputs(n)}
                    className={`w-10 py-1.5 text-[12px] rounded-md transition-all font-['Inter_Tight'] ${
                      numOutputs === n
                        ? "bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                        : "text-[#8A8A8E] hover:text-[#F4F1EA]"
                    }`}
                    data-testid={`poster-variations-${n}`}
                  >
                    {n}×
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ====== RIGHT: result panel ====== */}
        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Preview</p>
          <PosterResult busy={busy} result={result} setResult={setResult} aspect={aspect} />
        </aside>
      </div>

      {/* Sticky CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4"
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[12px]">
            <span className="text-[#8A8A8E]">Custo total:</span>
            <span className="text-[#C4B5FD] font-medium text-[16px]">
              {totalCost} <span className="text-[10px] font-mono uppercase tracking-wider">Créditos</span>
            </span>
            <span className="text-[#5A5A5E]">·</span>
            <span className="text-[#8A8A8E]">{numOutputs}× {perImageCost}</span>
            <span className="text-[#5A5A5E] mx-2">·</span>
            <span className="text-[#8A8A8E]">Saldo:</span>
            <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
          </div>
          <button
            onClick={onGenerate}
            disabled={busy || missing.length > 0}
            className="flex-1 sm:flex-initial sm:min-w-[260px] bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white py-3.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25"
            data-testid="poster-generate"
          >
            {busy
              ? <><Loader2 className="w-4 h-4 animate-spin" /> A gerar {numOutputs > 1 ? `${numOutputs} variações` : "pôster"}…</>
              : <><Sparkles className="w-4 h-4" /> Gerar Pôster · {totalCost} créditos</>
            }
          </button>
        </div>
        {missing.length > 0 && !busy && (
          <p className="max-w-[1400px] mx-auto text-[#EF4444] text-[11px] mt-2 text-right">
            Preenche: {missing.map(labelFor).join(", ")}
          </p>
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result panel for posters (supports multiple outputs)               */
/* ------------------------------------------------------------------ */

function PosterResult({ busy, result, setResult, aspect }) {
  const aspectClass = {
    "1:1":  "aspect-square",
    "4:5":  "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-[16/9]",
    "3:4":  "aspect-[3/4]",
  }[aspect] || "aspect-[4/5]";

  if (busy) {
    return (
      <div className={`rounded-2xl bg-[#0E0E12] border border-[#2E2E30] ${aspectClass} flex flex-col items-center justify-center p-10 relative overflow-hidden`} data-testid="poster-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">A compor o pôster…</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">30–120 seg</p>
      </div>
    );
  }
  if (!result) {
    return (
      <div className={`rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] ${aspectClass} flex flex-col items-center justify-center p-10`} data-testid="poster-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <ImageIcon className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px] text-center">O pôster aparece aqui.</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">Preenche os campos e toca em Gerar.</p>
      </div>
    );
  }

  const urls = result.result_urls || [];
  const [main, ...rest] = urls;

  const download = async (url) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `remakepix-poster-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    } catch {
      toast.error("Falha ao baixar.");
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="poster-result">
      <div className={`relative ${aspectClass} bg-black`}>
        <img src={main} alt="Poster" className="absolute inset-0 w-full h-full object-contain" crossOrigin="anonymous" data-testid="poster-result-image" />
      </div>
      {rest.length > 0 && (
        <div className="p-2 grid grid-cols-3 gap-2 border-t border-[#2E2E30]">
          {urls.map((u, i) => (
            <button
              key={i}
              onClick={() => setResult({ ...result, result_urls: [u, ...urls.filter((x) => x !== u)] })}
              className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                u === main ? "border-[#7C3AED]" : "border-[#2E2E30] hover:border-[#7C3AED]/50"
              }`}
              data-testid={`poster-variant-${i}`}
            >
              <img src={u} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="p-3 flex gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <button
          onClick={() => download(main)}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="poster-download"
        >
          Baixar Alta Resolução
        </button>
        <a
          href={main}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="poster-open"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}

function AspectMini({ ratio, active }) {
  const map = {
    "1:1":  { w: 18, h: 18 },
    "4:5":  { w: 16, h: 20 },
    "9:16": { w: 11, h: 20 },
    "16:9": { w: 22, h: 12 },
    "3:4":  { w: 15, h: 20 },
  };
  const { w, h } = map[ratio] || map["1:1"];
  return (
    <div
      className={`border-[1.5px] rounded-sm ${active ? "border-[#C4B5FD]" : "border-[#5A5A5E]"}`}
      style={{ width: w + "px", height: h + "px" }}
    />
  );
}
