import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Upload, Palette, Download, X, Sparkles,
  Check, Move, RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { compressImage } from "../../../lib/imageCompress";
import { fileToDataURL } from "../../../lib/fileToDataURL";

const errMsg = (err) => {
  if (err?.code === "ECONNABORTED") return "Tempo esgotado — tenta de novo.";
  if (err?.response?.status === 402) return "Créditos insuficientes.";
  if (err?.response?.status === 429) return "Demasiados pedidos. Espera 1 minuto.";
  if (err?.response?.data?.detail)
    return typeof err.response.data.detail === "string"
      ? err.response.data.detail
      : "Erro inesperado.";
  return err?.message || "Falhou.";
};

const STYLES = [
  {
    key: "natural", label: "Natural",
    hint: "Cores fiéis à realidade · uso geral",
    swatch: ["#D9C2A8", "#A8C8E5", "#7BA17F", "#C97F5E"], // skin / sky / foliage / brick
  },
  {
    key: "cinematic", label: "Cinematográfico",
    hint: "Teal & orange · grading editorial",
    swatch: ["#1F4E5F", "#E8845C", "#0E2A35", "#F4B989"],
  },
  {
    key: "vibrant", label: "Vibrante",
    hint: "Saturadas e ensolaradas · POP",
    swatch: ["#EF4444", "#22C55E", "#3B82F6", "#FACC15"],
  },
  {
    key: "historic", label: "Histórico",
    hint: "Fotos antigas · cores de época",
    swatch: ["#A78A5C", "#6B5B47", "#C7A87C", "#3E3528"],
  },
];

const PROMPT_IDEAS = [
  "colorir foto antiga de 1950 com cores naturais e realistas",
  "fotografia de casamento dos anos 60, tons quentes",
  "retrato de soldado dos anos 40 com farda em verde-oliva",
  "praia dos anos 70 com céu azul e areia dourada",
];

export default function Colorize() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const fileRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [style, setStyle] = useState("natural");
  const [preserveSkin, setPreserveSkin] = useState(true);
  const [enhanceDetails, setEnhanceDetails] = useState(true);
  const [vibe, setVibe] = useState("moderno");
  const [customPrompt, setCustomPrompt] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = 6;

  useEffect(() => {
    let cancelled = false;
    if (!photo) { setPhotoPreview(null); return; }
    fileToDataURL(photo).then((u) => { if (!cancelled) setPhotoPreview(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, [photo]);

  const handlePick = async (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    setResult(null);
    const compressed = await compressImage(file);
    setPhoto(compressed);
  };
  const reset = () => { setPhoto(null); setPhotoPreview(null); setResult(null); };

  const run = async () => {
    if (!photo) { toast.error("Envia a foto preto-e-branco primeiro."); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("style", style);
      fd.append("preserve_skin", preserveSkin ? "true" : "false");
      fd.append("enhance_details", enhanceDetails ? "true" : "false");
      fd.append("vibe", vibe);
      fd.append("custom_prompt", customPrompt);
      const { data } = await api.post("/tools/colorize", fd, { timeout: 240000 });
      const url = data.creation?.result_urls?.[0];
      if (!url) throw new Error("Sem resultado");
      setResult({ url, id: data.creation.id, style });
      toast.success(`Foto colorida · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="colorize-frame">
      <button
        onClick={() => navigate("/app/tools")}
        className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium transition-colors"
        data-testid="colorize-back"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <div className="mb-12 flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
          <Palette className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.05] mb-2 font-['Inter_Tight']">
            Colorize B&W
          </h1>
          <p className="text-[#8A8A8E] text-[15px] max-w-[640px] leading-relaxed">
            Transforma fotografias a preto-e-branco em imagens a cores realistas e naturais.
            Funciona com retratos, paisagens e fotos de família.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        <div className="space-y-10">
          {/* 1) UPLOAD */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <label className="text-[#F4F1EA] text-[13px] font-medium uppercase tracking-[0.16em] font-['Inter_Tight']">
                01 · Imagem em P&B
              </label>
              {photo && (
                <button
                  onClick={reset}
                  className="text-[#5A5A5E] hover:text-[#7C3AED] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="colorize-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Trocar foto
                </button>
              )}
            </div>
            <label htmlFor="file-colorize"
              
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handlePick(e.dataTransfer.files?.[0]); }}
              className={`relative block w-full ${photoPreview ? "aspect-[16/10]" : "aspect-[2/1]"} rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                photoPreview
                  ? "border-[#2E2E30] bg-[#0E0E12]"
                  : "border-[#2E2E30] hover:border-[#7C3AED]/70 bg-gradient-to-br from-[#13131A] via-[#0E0E12] to-[#0B0B0C] cursor-pointer group"
              }`}
              data-testid="colorize-upload-area"
            >
              {photoPreview ? (
                <>
                  {/* render preview already in B&W tint regardless of source — shows user the input clearly */}
                  <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-contain p-4" style={{ filter: "grayscale(1) contrast(1.05)" }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute top-4 right-4 w-9 h-9 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black z-10"
                    data-testid="colorize-clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.10),transparent_60%)] pointer-events-none" />
                  <div className="relative w-20 h-20 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 flex items-center justify-center group-hover:bg-[#7C3AED]/20 group-hover:border-[#7C3AED]/50 transition-all">
                    <Upload className="w-8 h-8 text-[#C4B5FD]" strokeWidth={1.5} />
                  </div>
                  <p className="relative text-[#F4F1EA] text-[20px] font-light tracking-[-0.01em] font-['Inter_Tight']">
                    Click to upload an image
                  </p>
                  <p className="relative text-[#8A8A8E] text-[13px]">
                    Funciona com retratos, paisagens e fotos antigas
                  </p>
                  <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.18em]">
                    JPEG · PNG · WEBP · até 15 MB
                  </p>
                </div>
              )}
            </label>
            <input id="file-colorize" ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePick(e.target.files?.[0])}
              data-testid="colorize-upload-input"
            />
          </section>

          {/* 2) COLOR STYLE */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              02 · Nível de Colorização
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="colorize-styles">
              {STYLES.map(({ key, label, hint, swatch }) => (
                <button
                  key={key}
                  onClick={() => setStyle(key)}
                  data-testid={`colorize-style-${key}`}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                    style === key
                      ? "border-[#7C3AED] bg-[#7C3AED]/10"
                      : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
                  }`}
                >
                  {style === key && (
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
                  )}
                  {/* swatch row */}
                  <div className="relative flex items-center gap-1 mb-3">
                    {swatch.map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-black/20" style={{ background: c }} />
                    ))}
                    {style === key && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className={`relative text-[15px] font-light tracking-[-0.01em] mb-1 font-['Inter_Tight'] ${
                    style === key ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
                  }`}>{label}</p>
                  <p className="relative text-[#8A8A8E] text-[11.5px] leading-snug">{hint}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 3) TOGGLES + VIBE SEGMENT */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              03 · Ajustes de Cor
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Toggle
                  active={preserveSkin}
                  onClick={() => setPreserveSkin(!preserveSkin)}
                  label="Preservar tons de pele realistas"
                  hint="Evita pele alaranjada, esverdeada ou plástica."
                  testId="colorize-toggle-skin"
                />
                <Toggle
                  active={enhanceDetails}
                  onClick={() => setEnhanceDetails(!enhanceDetails)}
                  label="Melhorar detalhes e nitidez"
                  hint="Realça texturas em cabelo, tecidos e olhos."
                  testId="colorize-toggle-details"
                />
              </div>

              {/* Vibe segment */}
              <div className="rounded-xl border border-[#2E2E30] bg-[#13131A]/50 p-3.5 flex flex-col sm:flex-row sm:items-center gap-3" data-testid="colorize-vibe">
                <div className="flex-1 min-w-0">
                  <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">Acabamento</p>
                  <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5">
                    Escolhe o feel final — limpo digital ou com pegada analógica.
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-[#2E2E30] p-0.5 bg-[#0B0B0C]">
                  {["moderno", "vintage"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVibe(v)}
                      data-testid={`colorize-vibe-${v}`}
                      className={`px-4 py-1.5 text-[12px] rounded-md transition-all capitalize font-['Inter_Tight'] ${
                        vibe === v
                          ? "bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                          : "text-[#8A8A8E] hover:text-[#F4F1EA]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4) OPTIONAL PROMPT */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-3 uppercase tracking-[0.16em] font-['Inter_Tight']">
              04 · Pista de Cor <span className="text-[#5A5A5E] normal-case tracking-normal text-[11px] font-normal">(opcional)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="ex: colorir foto antiga de 1950 com cores naturais e realistas"
              className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
              data-testid="colorize-custom-prompt"
            />
            <div className="flex flex-wrap gap-2 mt-2.5">
              {PROMPT_IDEAS.map((s) => (
                <button
                  key={s}
                  onClick={() => setCustomPrompt(s)}
                  className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Output</p>
          <ResultArea busy={busy} result={result} originalPreview={photoPreview} style={style} />
        </aside>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4"
        data-testid="colorize-cta-bar"
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[12px]">
            <span className="text-[#8A8A8E]">Custo:</span>
            <span className="text-[#C4B5FD] font-medium text-[16px]">
              {cost} <span className="text-[10px] font-mono uppercase tracking-wider">Créditos</span>
            </span>
            <span className="text-[#5A5A5E] mx-2">·</span>
            <span className="text-[#8A8A8E]">Saldo:</span>
            <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
          </div>
          <button
            onClick={run}
            disabled={busy || !photo}
            className="flex-1 sm:flex-initial sm:min-w-[260px] bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white py-3.5 rounded-lg text-[13px] font-medium tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25"
            data-testid="colorize-create-btn"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A colorir…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Colorir Foto · {cost} créditos</>
            )}
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

/* ------------------------------------------------------------------ */
/*  Result: side-by-side Before/After slider                           */
/* ------------------------------------------------------------------ */

function ResultArea({ busy, result, originalPreview, style }) {
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden" data-testid="colorize-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">A pintar a fotografia…</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
          30–90 seg · estilo {style}
        </p>
      </div>
    );
  }
  if (!result) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10" data-testid="colorize-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <Palette className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px] text-center">A tua foto colorida aparece aqui.</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">Antes / Depois disponíveis com slider.</p>
      </div>
    );
  }
  return <ResultViewer result={result} originalPreview={originalPreview} />;
}

function ResultViewer({ result, originalPreview }) {
  const [pos, setPos] = useState(50); // slider position 0..100
  const wrapRef = useRef(null);

  const onMove = (clientX) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.max(0, Math.min(clientX - r.left, r.width));
    setPos((x / r.width) * 100);
  };

  const handleDownload = async () => {
    try {
      const r = await fetch(result.url);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remakepix-colorized-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao preparar download.");
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="colorize-result">
      <div
        ref={wrapRef}
        className="relative aspect-square bg-black select-none cursor-ew-resize touch-none"
        onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
        onMouseDown={(e) => onMove(e.clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchStart={(e) => onMove(e.touches[0].clientX)}
      >
        {/* Colorized (full) */}
        <img
          src={result.url}
          alt="Colorized"
          className="absolute inset-0 w-full h-full object-contain"
          data-testid="colorize-result-image"
          crossOrigin="anonymous"
          draggable={false}
        />
        {/* Original B&W clipped to left of slider */}
        {originalPreview && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          >
            <img
              src={originalPreview}
              alt="Original"
              className="w-full h-full object-contain"
              style={{ filter: "grayscale(1) contrast(1.05)" }}
              draggable={false}
            />
          </div>
        )}
        {/* Slider handle */}
        {originalPreview && (
          <>
            <div className="absolute top-0 bottom-0 w-[2px] bg-white/90 shadow-[0_0_8px_rgba(124,58,237,0.6)] pointer-events-none" style={{ left: `${pos}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#7C3AED] border-2 border-white flex items-center justify-center shadow-lg pointer-events-none"
              style={{ left: `calc(${pos}% - 18px)` }}
            >
              <Move className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white bg-black/70 px-2 py-1 rounded">
              Antes
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white bg-[#7C3AED] px-2 py-1 rounded">
              Depois · {result.style}
            </div>
          </>
        )}
      </div>
      <div className="p-3 flex gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <button
          onClick={handleDownload}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="colorize-download"
        >
          <Download className="w-4 h-4" />
          Baixar Colorida
        </button>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="colorize-open"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}
