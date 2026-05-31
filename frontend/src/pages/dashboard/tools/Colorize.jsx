import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Palette, Download,
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
import BrandPageHeader from "../../../components/brand/BrandPageHeader";
import StudioResultAnchor from "../../../components/StudioResultAnchor";
import StudioMobileTabs from "../../../components/studio/StudioMobileTabs";
import { useStudioMobileTabs } from "../../../lib/useStudioMobileTabs";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";
import { COLORIZE_STYLE_KEYS } from "../../../lib/toolPagesLocales";

const COLORIZE_SWATCHES = {
  natural: ["#D9C2A8", "#A8C8E5", "#7BA17F", "#C97F5E"],
  cinematic: ["#1F4E5F", "#E8845C", "#0E2A35", "#F4B989"],
  vibrant: ["#EF4444", "#22C55E", "#3B82F6", "#FACC15"],
  historic: ["#A78A5C", "#6B5B47", "#C7A87C", "#3E3528"],
};

const COLORIZE_PROMPT_KEYS = [1, 2, 3, 4];

const VIBE_OPTIONS = [
  { value: "moderno", labelKey: "colorize_vibe_modern" },
  { value: "vintage", labelKey: "colorize_vibe_vintage" },
];

export default function Colorize() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat } = useI18n();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { costs } = usePricing();

  const styles = useMemo(
    () => COLORIZE_STYLE_KEYS.map((key) => ({
      key,
      label: t(`colorize_style_${key}_label`),
      hint: t(`colorize_style_${key}_hint`),
      swatch: COLORIZE_SWATCHES[key],
    })),
    [t],
  );

  const promptIdeas = useMemo(
    () => COLORIZE_PROMPT_KEYS.map((n) => t(`colorize_prompt_${n}`)),
    [t],
  );

  const [photo, setPhoto] = useState(null);
  const { previewUrl: resultOriginalUrl } = useStudioMediaPreview(photo);
  const [style, setStyle] = useState("natural");
  const [preserveSkin, setPreserveSkin] = useState(true);
  const [enhanceDetails, setEnhanceDetails] = useState(true);
  const [vibe, setVibe] = useState("moderno");
  const [customPrompt, setCustomPrompt] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const { mobileTab, setMobileTab, panelVisibility, focusResultPanel } = useStudioMobileTabs();

  const cost = costs.colorize;

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
  });

  const reset = () => {
    setPhoto(null);
    setResult(null);
  };

  const run = async () => {
    if (!photo) { toast.error(t("colorize_err_upload")); return; }
    focusResultPanel();
    clearUploadToast();
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("style", style);
      fd.append("preserve_skin", preserveSkin ? "true" : "false");
      fd.append("enhance_details", enhanceDetails ? "true" : "false");
      fd.append("vibe", vibe);
      fd.append("custom_prompt", customPrompt);
      const { data } = await uploadPost("/tools/colorize", fd, { timeout: 240000 });
      const creation = data?.creation;
      const url = creation?.result_urls?.[0];
      if (!url) throw new Error(t("common_no_result"));
      setResult({ url, id: creation?.id || null, style });
      toast.success(t("colorize_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto rp-studio-page-pad" data-testid="colorize-frame">
      <BrandPageHeader
        icon={Palette}
        eyebrow={t("tool_cap")}
        title={tCat("tool_colorize_name")}
        description={tCat("tool_colorize_desc")}
        testId="colorize-header"
      />

      <StudioMobileTabs active={mobileTab} onChange={setMobileTab} testIdPrefix="colorize" />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        <div className={`space-y-5 ${panelVisibility("create")}`}>
          {/* 1) UPLOAD */}
          <CollapsibleSection title={t("colorize_section_photo")} defaultOpen testId="colorize-section-photo">
            <div className="flex items-baseline justify-between mb-4">
              {photo && (
                <button
                  onClick={reset}
                  className="text-[#5A5A5E] hover:text-[#7C3AED] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="colorize-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t("common_swap_photo")}
                </button>
              )}
            </div>
            <ImageUploadZone
              value={photo}
              onChange={(f) => { setPhoto(f); setResult(null); }}
              layout="wide"
              testId="colorize-photo"
              previewImgStyle={{ filter: "grayscale(1) contrast(1.05)" }}
              emptyLabel={t("common_upload_click")}
              emptyHint={t("common_upload_hint_drag")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("colorize_section_level")} testId="colorize-section-style">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="colorize-styles">
              {styles.map(({ key, label, hint, swatch }) => (
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
          </CollapsibleSection>

          <CollapsibleSection title={t("colorize_section_tuning")} testId="colorize-section-tuning">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Toggle
                  active={preserveSkin}
                  onClick={() => setPreserveSkin(!preserveSkin)}
                  label={t("colorize_toggle_skin")}
                  hint={t("colorize_toggle_skin_hint")}
                  testId="colorize-toggle-skin"
                />
                <Toggle
                  active={enhanceDetails}
                  onClick={() => setEnhanceDetails(!enhanceDetails)}
                  label={t("colorize_toggle_details")}
                  hint={t("colorize_toggle_details_hint")}
                  testId="colorize-toggle-details"
                />
              </div>

              {/* Vibe segment */}
              <div className="rounded-xl border border-[#2E2E30] bg-[#13131A]/50 p-3.5 flex flex-col sm:flex-row sm:items-center gap-3" data-testid="colorize-vibe">
                <div className="flex-1 min-w-0">
                  <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">{t("colorize_finish_label")}</p>
                  <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5">
                    {t("colorize_feel")}
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-[#2E2E30] p-0.5 bg-[#0B0B0C]">
                  {VIBE_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      onClick={() => setVibe(value)}
                      data-testid={`colorize-vibe-${value}`}
                      className={`px-4 py-1.5 text-[12px] rounded-md transition-all font-['Inter_Tight'] ${
                        vibe === value
                          ? "bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                          : "text-[#8A8A8E] hover:text-[#F4F1EA]"
                      }`}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={t("colorize_section_hint")} optional testId="colorize-section-prompt">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder={t("colorize_prompt_ph")}
              className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
              data-testid="colorize-custom-prompt"
            />
            <div className="flex flex-wrap gap-2 mt-2.5">
              {promptIdeas.map((s) => (
                <button
                  key={s}
                  onClick={() => setCustomPrompt(s)}
                  className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        </div>

        <StudioResultAnchor busy={busy} ready={Boolean(result?.url)} className={`xl:sticky xl:top-[80px] self-start ${panelVisibility("result")}`}>
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">{t("common_output")}</p>
          <ResultArea busy={busy} result={result} originalPreview={resultOriginalUrl} style={style} />
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={run}
        label={t("colorize_btn", { n: cost })}
        busyLabel={t("colorize_processing")}
        hint={hint}
        testId="colorize-create-btn"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
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
  const { t } = useStudioI18n();
  const styleLabel = t(`colorize_style_${style}_label`);
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden" data-testid="colorize-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">{t("colorize_loading")}</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
          {t("colorize_loading_sub", { style: styleLabel })}
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
        <p className="text-[#8A8A8E] text-[13px] text-center">{t("colorize_result_empty")}</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">{t("colorize_result_compare")}</p>
      </div>
    );
  }
  return <ResultViewer result={result} originalPreview={originalPreview} />;
}

function ResultViewer({ result, originalPreview }) {
  const { t } = useStudioI18n();
  const [pos, setPos] = useState(50); // slider position 0..100
  const wrapRef = useRef(null);
  const styleLabel = t(`colorize_style_${result.style}_label`);

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
      toast.error(t("common_download_fail"));
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
          alt={t("colorize_alt_colorized")}
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
              alt={t("common_before")}
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
              {t("common_before")}
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white bg-[#7C3AED] px-2 py-1 rounded">
              {t("colorize_result_badge", { label: styleLabel })}
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
          {t("colorize_download")}
        </button>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="colorize-open"
        >
          {t("common_open")}
        </a>
      </div>
    </div>
  );
}
