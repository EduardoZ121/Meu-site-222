import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, Upload, Scissors, Download, X, Sparkles,
  Check, Move, RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { compressImage } from "../../../lib/imageCompress";
import { fileToDataURL } from "../../../lib/fileToDataURL";

/* ------------------------------------------------------------------ */
/*  Scene presets + solid color palette                                */
/* ------------------------------------------------------------------ */

const SCENE_PRESETS = [
  { key: "white",    label: "Branco Puro",  swatch: "linear-gradient(135deg,#FFFFFF,#E5E5E5)" },
  { key: "studio",   label: "Estúdio",      swatch: "linear-gradient(135deg,#3A3A3F,#1A1A1C)" },
  { key: "black",    label: "Preto",        swatch: "linear-gradient(135deg,#1A1A1C,#000000)" },
  { key: "gradient", label: "Gradiente",    swatch: "linear-gradient(135deg,#C4B5FD,#FBCFE8)" },
  { key: "beach",    label: "Praia",        swatch: "linear-gradient(135deg,#FDE68A,#7DD3FC)" },
  { key: "neon",     label: "Neon",         swatch: "linear-gradient(135deg,#EC4899,#06B6D4)" },
  { key: "outdoor",  label: "Natureza",     swatch: "linear-gradient(135deg,#86EFAC,#22C55E)" },
  { key: "minimal",  label: "Minimal Bege", swatch: "linear-gradient(135deg,#F5E6D3,#E5D4BD)" },
];

const SOLID_COLORS = [
  "#FFFFFF", "#000000", "#7C3AED", "#EC4899",
  "#06B6D4", "#22C55E", "#F59E0B", "#EF4444",
  "#F4F1EA", "#1A1A1C", "#C4B5FD", "#FBCFE8",
];

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

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function BgRemove() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const fileRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [mode, setMode] = useState("transparent"); // transparent | solid | scene | custom
  const [solidColor, setSolidColor] = useState("#FFFFFF");
  const [sceneKey, setSceneKey] = useState("white");
  const [customPrompt, setCustomPrompt] = useState("");
  const [keepShadow, setKeepShadow] = useState(false);
  const [refineHair, setRefineHair] = useState(true);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { url, mode } — url is the cutout PNG or scene composite

  const cost = mode === "scene" || mode === "custom" ? 8 : 5;

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

  const reset = () => {
    setPhoto(null); setPhotoPreview(null); setResult(null);
  };

  const run = async () => {
    if (!photo) { toast.error("Envia uma foto primeiro."); return; }
    if (mode === "custom" && customPrompt.trim().length < 4) {
      toast.error("Descreve o fundo que queres."); return;
    }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("bg_mode", mode);
      fd.append("bg_prompt", customPrompt);
      fd.append("scene_key", sceneKey);
      fd.append("keep_shadow", keepShadow ? "true" : "false");
      fd.append("refine_hair", refineHair ? "true" : "false");
      const { data } = await api.post("/tools/bg-remove", fd, { timeout: 180000 });
      const url = data.creation?.result_urls?.[0];
      if (!url) throw new Error("Sem resultado");
      setResult({ url, mode, id: data.creation.id });
      toast.success(`Fundo removido · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="bg-remove-frame">
      {/* Back link */}
      <button
        onClick={() => navigate("/app/tools")}
        className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium transition-colors"
        data-testid="bg-remove-back"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      {/* Hero header */}
      <div className="mb-12 flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
          <Scissors className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.05] mb-2 font-['Inter_Tight']">
            Remover Fundo
          </h1>
          <p className="text-[#8A8A8E] text-[15px] max-w-[640px] leading-relaxed">
            Recorte limpo com transparência. Funciona com pessoas, produtos e objetos.
            Bordas de cabelo refinadas com IA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        {/* ====== LEFT: controls ====== */}
        <div className="space-y-10">
          {/* 1) DROP A PHOTO */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <label className="text-[#F4F1EA] text-[13px] font-medium uppercase tracking-[0.16em] font-['Inter_Tight']">
                01 · Drop a Photo
              </label>
              {photo && (
                <button
                  onClick={reset}
                  className="text-[#5A5A5E] hover:text-[#7C3AED] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="bg-remove-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Trocar foto
                </button>
              )}
            </div>

            <label htmlFor="file-bgremove"
              
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handlePick(e.dataTransfer.files?.[0]); }}
              className={`relative block w-full ${photoPreview ? "aspect-[16/10]" : "aspect-[2/1]"} rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                photoPreview
                  ? "border-[#2E2E30] bg-[#0E0E12]"
                  : "border-[#2E2E30] hover:border-[#7C3AED]/70 bg-gradient-to-br from-[#13131A] via-[#0E0E12] to-[#0B0B0C] cursor-pointer group"
              }`}
              data-testid="bg-remove-upload-area"
            >
              {photoPreview ? (
                <>
                  <CheckerBoard />
                  <img
                    src={photoPreview}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain p-4"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute top-4 right-4 w-9 h-9 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black z-10"
                    data-testid="bg-remove-clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                  {/* Subtle radial purple glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.10),transparent_60%)] pointer-events-none" />
                  <div className="relative w-20 h-20 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 flex items-center justify-center group-hover:bg-[#7C3AED]/20 group-hover:border-[#7C3AED]/50 transition-all">
                    <Upload className="w-8 h-8 text-[#C4B5FD]" strokeWidth={1.5} />
                  </div>
                  <p className="relative text-[#F4F1EA] text-[20px] font-light tracking-[-0.01em] font-['Inter_Tight']">
                    DROP A PHOTO
                  </p>
                  <p className="relative text-[#8A8A8E] text-[13px]">
                    Clique para fazer upload ou arraste a imagem aqui
                  </p>
                  <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.18em]">
                    JPEG · PNG · WEBP · até 15 MB
                  </p>
                </div>
              )}
            </label>
            <input id="file-bgremove" ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePick(e.target.files?.[0])}
              data-testid="bg-remove-upload-input"
            />
          </section>

          {/* 2) BACKGROUND MODE */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              02 · Escolha do Fundo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" data-testid="bg-remove-mode-tabs">
              <ModeTab
                active={mode === "transparent"}
                onClick={() => setMode("transparent")}
                label="Transparente"
                hint="PNG com canal alpha"
                testId="bg-mode-transparent"
              />
              <ModeTab
                active={mode === "solid"}
                onClick={() => setMode("solid")}
                label="Cor Sólida"
                hint="Branco, preto, etc."
                testId="bg-mode-solid"
              />
              <ModeTab
                active={mode === "scene"}
                onClick={() => setMode("scene")}
                label="Cena Pronta"
                hint="Estúdio, praia, neon…"
                testId="bg-mode-scene"
              />
              <ModeTab
                active={mode === "custom"}
                onClick={() => setMode("custom")}
                label="Descrever"
                hint="Em texto livre"
                testId="bg-mode-custom"
              />
            </div>

            {/* Mode-specific options */}
            <AnimatePresence mode="wait">
              {mode === "solid" && (
                <motion.div
                  key="solid"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5"
                >
                  <p className="text-[#8A8A8E] text-[12px] mb-3">Escolhe uma cor — aplicada no preview e no download.</p>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2" data-testid="bg-remove-solid-palette">
                    {SOLID_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSolidColor(c)}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          solidColor === c
                            ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/30 scale-[1.05]"
                            : "border-[#2E2E30] hover:border-[#7C3AED]/40"
                        }`}
                        style={{ background: c }}
                        data-testid={`bg-color-${c.replace("#", "")}`}
                        aria-label={c}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <input
                      type="color"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      className="w-10 h-10 rounded-md bg-transparent border border-[#2E2E30] cursor-pointer"
                      data-testid="bg-remove-color-picker"
                    />
                    <span className="text-[#8A8A8E] text-[12px] font-mono">{solidColor.toUpperCase()}</span>
                  </div>
                </motion.div>
              )}

              {mode === "scene" && (
                <motion.div
                  key="scene"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5"
                >
                  <p className="text-[#8A8A8E] text-[12px] mb-3">A IA recria o fundo mantendo o sujeito intacto.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" data-testid="bg-remove-scene-presets">
                    {SCENE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setSceneKey(p.key)}
                        className={`relative aspect-[5/3] rounded-lg border-2 overflow-hidden transition-all text-left p-2.5 ${
                          sceneKey === p.key
                            ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/30"
                            : "border-[#2E2E30] hover:border-[#7C3AED]/40"
                        }`}
                        style={{ background: p.swatch }}
                        data-testid={`bg-scene-${p.key}`}
                      >
                        <div className="absolute inset-0 bg-black/25" />
                        <span className="relative text-white text-[12px] font-medium drop-shadow font-['Inter_Tight']">
                          {p.label}
                        </span>
                        {sceneKey === p.key && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {mode === "custom" && (
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5"
                >
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="ex: fundo branco minimalista de estúdio, luz suave"
                    className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
                    data-testid="bg-remove-custom-prompt"
                  />
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {[
                      "fundo branco minimalista de estúdio",
                      "café aconchegante com luz quente",
                      "biblioteca com prateleiras desfocadas",
                      "céu nublado dramático",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setCustomPrompt(s)}
                        className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* 3) FINE TUNING TOGGLES */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              03 · Ajustes Finos
            </label>
            <div className="space-y-2.5">
              <Toggle
                active={refineHair}
                onClick={() => setRefineHair(!refineHair)}
                label="Melhorar bordas do cabelo"
                hint="Preserva fios finos e mechas translúcidas — recomendado para pessoas."
                testId="bg-toggle-hair"
              />
              <Toggle
                active={keepShadow}
                onClick={() => setKeepShadow(!keepShadow)}
                label="Manter sombra suave"
                hint="Adiciona uma sombra natural no chão para parecer mais real."
                testId="bg-toggle-shadow"
                disabled={mode === "transparent"}
                disabledHint="(disponível com fundo sólido ou cena)"
              />
            </div>
          </section>
        </div>

        {/* ====== RIGHT: result panel ====== */}
        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Output</p>
          <ResultArea
            busy={busy}
            result={result}
            mode={mode}
            solidColor={solidColor}
            originalPreview={photoPreview}
          />
        </aside>
      </div>

      {/* Sticky CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4"
        data-testid="bg-remove-cta-bar"
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
            data-testid="bg-remove-create-btn"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A processar…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Remover Fundo · {cost} créditos</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ModeTab({ active, onClick, label, hint, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`relative text-left p-3.5 rounded-xl border-2 transition-all ${
        active
          ? "border-[#7C3AED] bg-[#7C3AED]/10"
          : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
      }`}
    >
      <p className={`text-[13px] font-medium mb-1 font-['Inter_Tight'] ${active ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"}`}>
        {label}
      </p>
      <p className="text-[#8A8A8E] text-[11px] leading-snug">{hint}</p>
      {active && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function Toggle({ active, onClick, label, hint, disabled, disabledHint, testId }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-testid={testId}
      className={`w-full flex items-start gap-4 p-3.5 rounded-xl border transition-all text-left ${
        disabled
          ? "border-[#1F1F22] bg-[#0E0E12]/40 opacity-50 cursor-not-allowed"
          : active
            ? "border-[#7C3AED]/60 bg-[#7C3AED]/8"
            : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
      }`}
    >
      <div className={`shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors relative ${active ? "bg-[#7C3AED]" : "bg-[#2E2E30]"}`}>
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
            active ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">{label}</p>
        <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5">
          {hint}{disabled && disabledHint ? <span className="text-[#5A5A5E]"> {disabledHint}</span> : null}
        </p>
      </div>
    </button>
  );
}

/* Transparent checkerboard backdrop (alpha indicator) */
function CheckerBoard() {
  return (
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          "linear-gradient(45deg,#1A1A1C 25%,transparent 25%),linear-gradient(-45deg,#1A1A1C 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1A1A1C 75%),linear-gradient(-45deg,transparent 75%,#1A1A1C 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, 10px 0",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Result area with before/after slider + download                    */
/* ------------------------------------------------------------------ */

function ResultArea({ busy, result, mode, solidColor, originalPreview }) {
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden" data-testid="bg-remove-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">A recortar a imagem…</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
          15–60 seg · IA refinando bordas
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10" data-testid="bg-remove-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <Scissors className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px] text-center">O teu recorte aparece aqui.</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">PNG com transparência, pronto a baixar.</p>
      </div>
    );
  }

  return <ResultViewer result={result} mode={mode} solidColor={solidColor} originalPreview={originalPreview} />;
}

function ResultViewer({ result, mode, solidColor, originalPreview }) {
  const [showCompare, setShowCompare] = useState(false);
  const isSolid = result.mode === "solid";

  // Compose download: if solid → flatten cutout on color via canvas; else download raw.
  const handleDownload = async () => {
    try {
      if (!isSolid) {
        // Direct download via fetch+blob to preserve alpha
        const r = await fetch(result.url);
        const blob = await r.blob();
        triggerDownload(blob, suggestedName(result.mode));
        return;
      }
      const blob = await composeSolid(result.url, solidColor);
      triggerDownload(blob, suggestedName("solid"));
    } catch (e) {
      console.error(e);
      toast.error("Falha ao preparar download.");
    }
  };

  // Build display background based on mode
  const displayBg = useMemo(() => {
    if (result.mode === "transparent") return "transparent";
    if (result.mode === "solid") return solidColor;
    return "transparent"; // for scene/custom the URL already has new background baked in
  }, [result.mode, solidColor]);

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="bg-remove-result">
      {/* Image stage */}
      <div className="relative aspect-square">
        {/* Checkerboard for transparent */}
        {result.mode === "transparent" && <CheckerBoard />}

        {/* Solid color fill */}
        {result.mode === "solid" && (
          <div className="absolute inset-0" style={{ background: displayBg }} />
        )}

        <img
          src={result.url}
          alt="Resultado"
          className="absolute inset-0 w-full h-full object-contain"
          data-testid="bg-remove-result-image"
          crossOrigin="anonymous"
        />

        {/* Before/After overlay */}
        {showCompare && originalPreview && (
          <div className="absolute inset-0 pointer-events-none">
            <img src={originalPreview} alt="" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white bg-black/60 px-2 py-1 rounded">
              Antes
            </div>
          </div>
        )}

        {/* Compare toggle */}
        {originalPreview && (
          <button
            onMouseDown={() => setShowCompare(true)}
            onMouseUp={() => setShowCompare(false)}
            onMouseLeave={() => setShowCompare(false)}
            onTouchStart={() => setShowCompare(true)}
            onTouchEnd={() => setShowCompare(false)}
            className="absolute bottom-3 right-3 z-10 bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-black/85 transition-colors select-none"
            data-testid="bg-remove-compare"
          >
            <Move className="w-3.5 h-3.5" />
            Segurar para ver antes
          </button>
        )}
      </div>

      {/* Action bar */}
      <div className="p-3 flex gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <button
          onClick={handleDownload}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="bg-remove-download"
        >
          <Download className="w-4 h-4" />
          Baixar {isSolid ? "JPG" : "PNG"}
        </button>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="bg-remove-open"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas helpers                                                     */
/* ------------------------------------------------------------------ */

function suggestedName(mode) {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  if (mode === "solid") return `remakepix-bg-${ts}.jpg`;
  return `remakepix-bg-${ts}.png`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Compose a transparent cutout over a solid color and return JPEG blob */
async function composeSolid(cutoutUrl, color) {
  const img = await loadImage(cutoutUrl);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0);
  return await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.95));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
