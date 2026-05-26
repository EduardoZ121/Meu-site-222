import { useMemo, useState } from "react";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";
import { BG_SCENE_KEYS } from "../../../lib/toolPagesLocales";

const BG_PROMPT_CHIP_KEYS = [1, 2, 3, 4];
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Scissors, Download,
  Check, Move, RotateCcw,
} from "lucide-react";
import StudioGenerateBar from "../../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../../lib/useStudioGenerateGate";
import { useNavigate } from "react-router-dom";
import { formatApiError, uploadPost } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import { useStudioMediaPreview } from "../../../hooks/useStudioMediaPreview";
import ImageUploadZone from "../../../components/ImageUploadZone";
import CollapsibleSection from "../../../components/CollapsibleSection";
import StudioResultAnchor from "../../../components/StudioResultAnchor";

/* ------------------------------------------------------------------ */
/*  Scene presets + solid color palette                                */
/* ------------------------------------------------------------------ */

const SCENE_SWATCHES = {
  white: "linear-gradient(135deg,#FFFFFF,#E5E5E5)",
  studio: "linear-gradient(135deg,#3A3A3F,#1A1A1C)",
  black: "linear-gradient(135deg,#1A1A1C,#000000)",
  gradient: "linear-gradient(135deg,#C4B5FD,#FBCFE8)",
  beach: "linear-gradient(135deg,#FDE68A,#7DD3FC)",
  neon: "linear-gradient(135deg,#EC4899,#06B6D4)",
  outdoor: "linear-gradient(135deg,#86EFAC,#22C55E)",
  minimal: "linear-gradient(135deg,#F5E6D3,#E5D4BD)",
};

const SOLID_COLORS = [
  "#FFFFFF", "#000000", "#7C3AED", "#EC4899",
  "#06B6D4", "#22C55E", "#F59E0B", "#EF4444",
  "#F4F1EA", "#1A1A1C", "#C4B5FD", "#FBCFE8",
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function BgRemove() {
  const { t } = useStudioI18n();
  const { t: tCatalogue } = useI18n();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { costs } = usePricing();
  const errMsg = (err) => formatApiError(err, t("common_fail"), { context: "image_upload", t });
  const scenePresets = useMemo(
    () => BG_SCENE_KEYS.map((key) => ({
      key,
      label: t(`bg_scene_${key}`),
      swatch: SCENE_SWATCHES[key],
    })),
    [t],
  );

  const customPromptChips = useMemo(
    () => BG_PROMPT_CHIP_KEYS.map((n) => t(`bg_prompt_chip_${n}`)),
    [t],
  );

  const [photo, setPhoto] = useState(null);
  const { previewUrl: resultOriginalUrl } = useStudioMediaPreview(photo);
  const [mode, setMode] = useState("transparent"); // transparent | solid | scene | custom
  const [solidColor, setSolidColor] = useState("#FFFFFF");
  const [sceneKey, setSceneKey] = useState("white");
  const [customPrompt, setCustomPrompt] = useState("");
  const [keepShadow, setKeepShadow] = useState(false);
  const [refineHair, setRefineHair] = useState(true);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { url, mode } — url is the cutout PNG or scene composite

  const cost = mode === "scene" || mode === "custom" ? costs.bgRemoveScene : costs.bgRemove;

  const customBgOk = mode !== "custom" || customPrompt.trim().length >= 4;
  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    readyOverride: Boolean(photo) && customBgOk,
    hintOverride: !photo
      ? null
      : !customBgOk
        ? t("bg_err_describe")
        : null,
  });

  const reset = () => {
    setPhoto(null);
    setResult(null);
  };

  const run = async () => {
    if (!photo) { toast.error(t("common_upload_first")); return; }
    if (mode === "custom" && customPrompt.trim().length < 4) {
      toast.error(t("bg_err_describe")); return;
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
      const { data } = await uploadPost("/tools/bg-remove", fd, { timeout: 180000 });
      const creation = data?.creation;
      const url = creation?.result_urls?.[0];
      if (!url) throw new Error(t("common_no_result"));
      setResult({ url, mode, id: creation?.id || null });
      toast.success(t("bg_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="bg-remove-frame">
      {/* Hero header */}
      <div className="mb-12 flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
          <Scissors className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.05] mb-2 font-['Inter_Tight']">
            {tCatalogue("tool_bg_remove_name")}
          </h1>
          <p className="text-[#8A8A8E] text-[15px] max-w-[640px] leading-relaxed">
            {tCatalogue("tool_bg_remove_desc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        {/* ====== LEFT: controls ====== */}
        <div className="space-y-5">
          <CollapsibleSection title={t("common_section_upload_photo")} defaultOpen testId="bg-remove-section-photo">
            <div className="flex items-baseline justify-between mb-4">
              {photo && (
                <button
                  onClick={reset}
                  className="text-[#5A5A5E] hover:text-[#7C3AED] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="bg-remove-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t("common_swap_photo")}
                </button>
              )}
            </div>

            <ImageUploadZone
              value={photo}
              onChange={(f) => { setPhoto(f); setResult(null); }}
              layout="wide"
              testId="bg-remove-photo"
              overlay={<CheckerBoard />}
              emptyLabel={t("upload_empty_label")}
              emptyHint={t("tool_accept_formats")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("bg_section_mode")} hint={t("bg_mode_hint")} testId="bg-remove-section-mode">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" data-testid="bg-remove-mode-tabs">
              <ModeTab
                active={mode === "transparent"}
                onClick={() => setMode("transparent")}
                label={t("bg_mode_transparent")}
                hint={t("bg_mode_transparent_hint")}
                testId="bg-mode-transparent"
              />
              <ModeTab
                active={mode === "solid"}
                onClick={() => setMode("solid")}
                label={t("bg_mode_solid")}
                hint={t("bg_mode_solid_hint")}
                testId="bg-mode-solid"
              />
              <ModeTab
                active={mode === "scene"}
                onClick={() => setMode("scene")}
                label={t("bg_mode_scene")}
                hint={t("bg_mode_scene_hint")}
                testId="bg-mode-scene"
              />
              <ModeTab
                active={mode === "custom"}
                onClick={() => setMode("custom")}
                label={t("bg_mode_describe")}
                hint={t("bg_mode_custom_hint")}
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
                  <p className="text-[#8A8A8E] text-[12px] mb-3">{t("bg_pick_color")}</p>
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
                  <p className="text-[#8A8A8E] text-[12px] mb-3">{t("bg_scene_ai")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" data-testid="bg-remove-scene-presets">
                    {scenePresets.map((p) => (
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
                    placeholder={t("bg_prompt_ph")}
                    className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
                    data-testid="bg-remove-custom-prompt"
                  />
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {customPromptChips.map((s) => (
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
          </CollapsibleSection>

          <CollapsibleSection title={t("bg_section_tuning")} optional hint="Cabelo, sombra e refinamentos." testId="bg-remove-section-tuning">
            <div className="space-y-2.5">
              <Toggle
                active={refineHair}
                onClick={() => setRefineHair(!refineHair)}
                label={t("bg_tune_hair")}
                hint={t("bg_tune_hair_hint")}
                testId="bg-toggle-hair"
              />
              <Toggle
                active={keepShadow}
                onClick={() => setKeepShadow(!keepShadow)}
                label={t("bg_tune_shadow")}
                hint={t("bg_tune_shadow_hint")}
                testId="bg-toggle-shadow"
                disabled={mode === "transparent"}
                disabledHint={t("bg_shadow_disabled")}
              />
            </div>
          </CollapsibleSection>
        </div>

        <StudioResultAnchor busy={busy} ready={Boolean(result?.url)} className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">{t("bg_output")}</p>
          <ResultArea
            busy={busy}
            result={result}
            mode={mode}
            solidColor={solidColor}
            originalPreview={resultOriginalUrl}
          />
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={run}
        label={t("bg_btn", { n: cost })}
        busyLabel={t("bg_processing")}
        hint={hint}
        testId="bg-remove-create-btn"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
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
  const { t } = useStudioI18n();
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden" data-testid="bg-remove-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">{t("bg_loading")}</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
          {t("bg_loading_sub")}
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
        <p className="text-[#8A8A8E] text-[13px] text-center">{t("bg_preview_empty")}</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">{t("bg_result_png")}</p>
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
