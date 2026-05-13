import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, ArrowLeft, Layers, Plus, Trash2, Upload, X, Sparkles,
  ChevronUp, ChevronDown, Image as ImageIcon, Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import { compressImage } from "../../lib/imageCompress";
import { fileToDataURL } from "../../lib/fileToDataURL";
import useTitle from "../../lib/useTitle";

const COST_PER_SLIDE = 8;
const MIN_SLIDES = 2;
const MAX_SLIDES = 10;

const STYLE_PRESETS = [
  "editorial magazine photography, cinematic light",
  "soft pastel film, dreamy mood, 35mm grain",
  "high-fashion editorial, dramatic shadows, glossy",
  "warm golden hour, lifestyle storytelling",
  "minimal studio, neutral backdrop, premium product",
  "moody cinematic teal & orange grading",
  "bright airy lifestyle, natural daylight",
  "y2k pop, vivid neon, glossy chrome",
];

const ASPECTS = [
  { key: "4:5",  label: "4:5 · Feed Tall" },
  { key: "1:1",  label: "1:1 · Square" },
  { key: "9:16", label: "9:16 · Story" },
  { key: "3:4",  label: "3:4 · Vertical" },
];

const errMsg = (err) =>
  err?.code === "ECONNABORTED" ? "Tempo esgotado — tenta de novo." :
  err?.response?.status === 402 ? "Créditos insuficientes." :
  err?.response?.data?.detail || err?.message || "Falhou.";

/* ------------------------------------------------------------------ */

export default function CarouselPage() {
  useTitle("Carrossel Instagram");
  const navigate = useNavigate();
  const { refresh, user } = useAuth();

  const [slides, setSlides] = useState([
    "Capa: mulher elegante a olhar para a câmara, headline 'NOVA COLEÇÃO'",
    "Detalhe: close-up no acessório principal, foco curto",
    "Final: call to action 'DISPONÍVEL JÁ' centrado",
  ]);
  const [styleSuffix, setStyleSuffix] = useState(STYLE_PRESETS[0]);
  const [aspect, setAspect] = useState("4:5");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [keepCharacter, setKeepCharacter] = useState(true);
  const [keepLighting, setKeepLighting] = useState(true);
  const [keepPalette, setKeepPalette] = useState(true);
  const [smoothTransitions, setSmoothTransitions] = useState(true);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0); // optimistic progress while waiting
  const [result, setResult] = useState(null);

  const fileRef = useRef(null);
  const totalCost = slides.length * COST_PER_SLIDE;

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

  const addSlide = () => slides.length < MAX_SLIDES && setSlides([...slides, ""]);
  const removeSlide = (i) => slides.length > MIN_SLIDES && setSlides(slides.filter((_, idx) => idx !== i));
  const updateSlide = (i, v) => setSlides(slides.map((s, idx) => idx === i ? v : s));
  const moveSlide = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
  };

  const generate = async () => {
    const cleaned = slides.map((s) => s.trim());
    if (cleaned.some((s) => s.length < 3)) {
      toast.error("Cada slide precisa de uma descrição.");
      return;
    }
    if (cleaned.length < MIN_SLIDES || cleaned.length > MAX_SLIDES) {
      toast.error(`Entre ${MIN_SLIDES} e ${MAX_SLIDES} slides.`);
      return;
    }
    setBusy(true); setResult(null); setProgress(0);
    // optimistic progress ticker (each slide takes ~30-60s)
    const totalMs = cleaned.length * 45000;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(95, Math.round((elapsed / totalMs) * 100)));
    }, 500);
    try {
      let data;
      if (photo) {
        const fd = new FormData();
        fd.append("slides", JSON.stringify(cleaned));
        fd.append("style_suffix", styleSuffix);
        fd.append("aspect_ratio", aspect);
        fd.append("keep_character", keepCharacter ? "true" : "false");
        fd.append("keep_lighting", keepLighting ? "true" : "false");
        fd.append("keep_palette", keepPalette ? "true" : "false");
        fd.append("smooth_transitions", smoothTransitions ? "true" : "false");
        fd.append("photo", photo);
        ({ data } = await api.post("/generate/carousel", fd, { timeout: 600000 }));
      } else {
        ({ data } = await api.post("/generate/carousel", {
          slides: cleaned,
          style_suffix: styleSuffix,
          aspect_ratio: aspect,
          keep_character: keepCharacter,
          keep_lighting: keepLighting,
          keep_palette: keepPalette,
          smooth_transitions: smoothTransitions,
        }, { timeout: 600000 }));
      }
      setProgress(100);
      setResult(data.creation);
      toast.success(`Carrossel pronto · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="carousel-page">
      <button onClick={() => navigate("/app/tools")} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      {/* Header */}
      <div className="mb-12 flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
          <Layers className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-2">Carrossel Instagram</p>
          <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.05] mb-2 font-['Inter_Tight']">
            Uma história. <span className="italic text-[#C4B5FD]">Várias slides.</span>
          </h1>
          <p className="text-[#8A8A8E] text-[15px] max-w-[680px] leading-relaxed">
            Cria um carrossel coerente com o mesmo personagem, iluminação e paleta em todas as slides.
            De 2 a 10 imagens conectadas visualmente — como uma editorial de revista.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        {/* ====== LEFT ====== */}
        <div className="space-y-10">
          {/* 1 · Reference photo */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              01 · Personagem / Produto de Referência <span className="text-[#5A5A5E] normal-case tracking-normal text-[11px] font-normal">(opcional, mas recomendado)</span>
            </label>
            <div
              onClick={() => !photoPreview && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handlePick(e.dataTransfer.files?.[0]); }}
              className={`relative aspect-[16/8] rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                photoPreview
                  ? "border-[#2E2E30] bg-[#0E0E12]"
                  : "border-[#2E2E30] hover:border-[#7C3AED]/70 bg-gradient-to-br from-[#13131A] via-[#0E0E12] to-[#0B0B0C] cursor-pointer group"
              }`}
              data-testid="carousel-photo-area"
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-contain p-3" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                    className="absolute top-3 right-3 w-9 h-9 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black z-10"
                    data-testid="carousel-photo-clear"
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
                    Anexar o rosto, personagem ou produto principal
                  </p>
                  <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.18em]">
                    Mantém a identidade igual em todas as slides · Flux 2 Klein
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePick(e.target.files?.[0])}
              data-testid="carousel-photo-input"
            />
          </section>

          {/* 2 · Style suffix */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              02 · Estilo Visual Geral
            </label>
            <p className="text-[#8A8A8E] text-[12.5px] mb-3">Aplicado automaticamente em TODAS as slides para garantir coerência.</p>
            <input
              value={styleSuffix}
              onChange={(e) => setStyleSuffix(e.target.value)}
              placeholder="ex: editorial magazine photography, cinematic light, 35mm grain"
              className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none font-['Inter_Tight'] transition-colors"
              data-testid="carousel-style"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyleSuffix(s)}
                  className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                    styleSuffix === s
                      ? "border-[#7C3AED] text-[#C4B5FD] bg-[#7C3AED]/10"
                      : "border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40"
                  }`}
                  data-testid={`carousel-style-preset-${s.slice(0, 12)}`}
                >
                  {s.length > 38 ? s.slice(0, 36) + "…" : s}
                </button>
              ))}
            </div>
          </section>

          {/* 3 · Continuity */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              03 · Continuidade entre Slides
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Toggle
                active={keepCharacter}
                onClick={() => setKeepCharacter(!keepCharacter)}
                label="Mesma personagem"
                hint="Rosto e outfit consistentes em todas as slides."
                testId="carousel-toggle-character"
              />
              <Toggle
                active={keepLighting}
                onClick={() => setKeepLighting(!keepLighting)}
                label="Mesma iluminação"
                hint="Hora do dia e direção da luz idênticas."
                testId="carousel-toggle-lighting"
              />
              <Toggle
                active={keepPalette}
                onClick={() => setKeepPalette(!keepPalette)}
                label="Mesma paleta de cores"
                hint="Grading e tons unificados em toda a série."
                testId="carousel-toggle-palette"
              />
              <Toggle
                active={smoothTransitions}
                onClick={() => setSmoothTransitions(!smoothTransitions)}
                label="Transição suave entre slides"
                hint="Cada slide flui visualmente para a seguinte."
                testId="carousel-toggle-smooth"
              />
            </div>
          </section>

          {/* 4 · Slides */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <label className="text-[#F4F1EA] text-[13px] font-medium uppercase tracking-[0.16em] font-['Inter_Tight']">
                04 · Slides <span className="text-[#5A5A5E] normal-case tracking-normal text-[11px] font-normal">({slides.length} de {MAX_SLIDES})</span>
              </label>
              {slides.length < MAX_SLIDES && (
                <button
                  onClick={addSlide}
                  className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="slide-add"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar slide
                </button>
              )}
            </div>

            <div className="space-y-2.5" data-testid="carousel-slides">
              {slides.map((s, i) => (
                <div key={i} className="rounded-xl border border-[#2E2E30] bg-[#13131A]/50 p-3 flex items-start gap-3 group hover:border-[#7C3AED]/40 transition-colors">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <span className="w-7 h-7 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#C4B5FD] text-[11px] font-mono flex items-center justify-center">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveSlide(i, -1)}
                        disabled={i === 0}
                        className="text-[#5A5A5E] hover:text-[#C4B5FD] disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                        data-testid={`slide-up-${i}`}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSlide(i, 1)}
                        disabled={i === slides.length - 1}
                        className="text-[#5A5A5E] hover:text-[#C4B5FD] disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                        data-testid={`slide-down-${i}`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={s}
                    onChange={(e) => updateSlide(i, e.target.value)}
                    rows={2}
                    placeholder={`Descreve a slide ${i + 1}…`}
                    className="flex-1 bg-transparent text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] focus:outline-none resize-none font-['Inter_Tight'] py-1.5"
                    data-testid={`slide-${i}`}
                  />

                  {slides.length > MIN_SLIDES && (
                    <button
                      onClick={() => removeSlide(i)}
                      className="opacity-0 group-hover:opacity-100 text-[#5A5A5E] hover:text-[#EF4444] transition-all p-1.5"
                      data-testid={`slide-remove-${i}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 5 · Aspect */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              05 · Formato
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" data-testid="carousel-formats">
              {ASPECTS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setAspect(key)}
                  data-testid={`carousel-format-${key}`}
                  className={`p-3 rounded-xl border-2 transition-all text-center font-['Inter_Tight'] text-[12.5px] ${
                    aspect === key
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#F4F1EA]"
                      : "border-[#2E2E30] bg-[#13131A]/50 text-[#8A8A8E] hover:border-[#7C3AED]/40 hover:text-[#F4F1EA]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ====== RIGHT: result ====== */}
        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Carrossel</p>
          <ResultArea busy={busy} progress={progress} result={result} aspect={aspect} slidesCount={slides.length} />
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
            <span className="text-[#8A8A8E]">{slides.length} slides × {COST_PER_SLIDE}</span>
            <span className="text-[#5A5A5E] mx-2">·</span>
            <span className="text-[#8A8A8E]">Saldo:</span>
            <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
          </div>
          <button
            onClick={generate}
            disabled={busy || (user?.credits ?? 0) < totalCost}
            className="flex-1 sm:flex-initial sm:min-w-[280px] bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white py-3.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25"
            data-testid="carousel-generate"
          >
            {busy
              ? <><Loader2 className="w-4 h-4 animate-spin" /> A renderizar {slides.length} slides…</>
              : <><Sparkles className="w-4 h-4" /> Renderizar Carrossel · {totalCost} créditos</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Toggle({ active, onClick, label, hint, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`w-full flex items-start gap-4 p-3.5 rounded-xl border transition-all text-left ${
        active
          ? "border-[#7C3AED]/60 bg-[#7C3AED]/8"
          : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
      }`}
    >
      <div className={`shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors relative ${active ? "bg-[#7C3AED]" : "bg-[#2E2E30]"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
          active ? "translate-x-[18px]" : "translate-x-0.5"
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">{label}</p>
        <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5">{hint}</p>
      </div>
    </button>
  );
}

function ResultArea({ busy, progress, result, aspect, slidesCount }) {
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] p-8 relative overflow-hidden" data-testid="carousel-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative flex flex-col items-center text-center">
          <div className="relative w-16 h-16 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
          <p className="text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">A renderizar {slidesCount} slides…</p>
          <p className="text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
            Cada slide preserva o personagem e o estilo
          </p>
          {/* progress bar */}
          <div className="w-full h-1.5 bg-[#2E2E30] rounded-full mt-6 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#C4B5FD]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-[#5A5A5E] text-[10px] font-mono mt-2">{progress}%</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] p-12 flex flex-col items-center justify-center text-center" data-testid="carousel-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <Layers className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px]">O carrossel aparece aqui.</p>
        <p className="text-[#5A5A5E] text-[11px] mt-1.5 max-w-[260px]">
          Define as slides, escolhe o estilo e toca em Renderizar.
        </p>
      </div>
    );
  }

  return <CarouselViewer urls={result.result_urls || []} aspect={aspect} />;
}

function CarouselViewer({ urls, aspect }) {
  const [current, setCurrent] = useState(0);
  const aspectClass = {
    "1:1":  "aspect-square",
    "4:5":  "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
    "3:4":  "aspect-[3/4]",
  }[aspect] || "aspect-[4/5]";

  const download = async (url, idx) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `remakepix-carousel-${idx + 1}-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    } catch { toast.error("Falha ao baixar."); }
  };

  const downloadAll = async () => {
    for (let i = 0; i < urls.length; i++) {
      await download(urls[i], i);
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="carousel-result">
      <div className={`relative ${aspectClass} bg-black`}>
        <img
          src={urls[current]}
          alt={`Slide ${current + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          crossOrigin="anonymous"
          data-testid="carousel-main-image"
        />
        <div className="absolute top-3 left-3 text-[11px] font-mono uppercase tracking-[0.18em] bg-[#7C3AED] text-white px-2.5 py-1 rounded">
          {String(current + 1).padStart(2, "0")} / {String(urls.length).padStart(2, "0")}
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${i + 1}`}
              data-testid={`carousel-dot-${i}`}
            />
          ))}
        </div>
      </div>

      {/* thumbnails */}
      <div className="p-2 grid grid-cols-5 gap-1.5 border-t border-[#2E2E30] bg-[#0B0B0C]">
        {urls.map((u, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
              i === current ? "border-[#7C3AED]" : "border-[#2E2E30] hover:border-[#7C3AED]/50"
            }`}
            data-testid={`carousel-thumb-${i}`}
          >
            <img src={u} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <div className="p-3 flex gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <button
          onClick={downloadAll}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="carousel-download-all"
        >
          <Download className="w-4 h-4" />
          Baixar Todas ({urls.length})
        </button>
        <button
          onClick={() => download(urls[current], current)}
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center gap-1.5"
          data-testid="carousel-download-current"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Esta
        </button>
      </div>
    </div>
  );
}
