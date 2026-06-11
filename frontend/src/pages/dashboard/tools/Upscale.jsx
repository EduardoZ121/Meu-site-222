import { useMemo, useState } from "react";
import { useStudioMediaPreview } from "../../../hooks/useStudioMediaPreview";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, ArrowUp, Download, Sparkles,
  Check, Move, RotateCcw, ZoomIn,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { uploadPost } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import ImageUploadZone from "../../../components/ImageUploadZone";
import CollapsibleSection from "../../../components/CollapsibleSection";
import StudioResultAnchor from "../../../components/StudioResultAnchor";
import StudioCompactShell from "../../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../../components/studio/StudioInlineHeader";
import StudioGenerateBar from "../../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../../lib/useStudioGenerateGate";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";

export default function Upscale() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat } = useI18n();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { costs } = usePricing();

  const [photo, setPhoto] = useState(null);
  const [scale, setScale] = useState(2);
  const [sharpen, setSharpen] = useState(true);
  const [denoise, setDenoise] = useState(true);
  const [preserveColors, setPreserveColors] = useState(true);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const { previewUrl: photoPreview } = useStudioMediaPreview(photo);

  const cost = costs.upscale;

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
  });

  const scaleOptions = useMemo(
    () => [
      { s: 2, label: t("upscale_scale_2_label"), hint: t("upscale_scale_2_hint") },
      { s: 4, label: t("upscale_scale_4_label"), hint: t("upscale_scale_4_hint") },
    ],
    [t],
  );

  const reset = () => {
    setPhoto(null);
    setResult(null);
  };

  const run = async () => {
    if (!photo) { toast.error(t("common_upload_first")); return; }
    clearUploadToast();
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("scale", String(scale));
      fd.append("sharpen", sharpen ? "true" : "false");
      fd.append("denoise", denoise ? "true" : "false");
      fd.append("preserve_colors", preserveColors ? "true" : "false");
      const { data } = await uploadPost("/tools/upscale", fd, { timeout: 240000 });
      const creation = data?.creation;
      const url = creation?.result_urls?.[0];
      if (!url) throw new Error(t("common_no_result"));
      setResult({ url, id: creation?.id || null, scale });
      toast.success(t("upscale_success", { scale, n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally { setBusy(false); }
  };

  return (
    <StudioCompactShell testId="upscale-frame" maxWidth="1400px" className="pb-4 md:pb-8">
      <StudioInlineHeader
        title={tCat("tool_upscale_name")}
        description={t("upscale_desc_long")}
        testId="upscale-header"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3 xl:gap-8">
        <div className="rp-studio-card-stack">
          {/* 1) UPLOAD */}
          <CollapsibleSection title={t("common_section_upload_image")} defaultOpen testId="upscale-section-photo">
            <div className="flex items-baseline justify-between mb-4">
              {photo && (
                <button
                  onClick={reset}
                  className="text-[#5A5A5E] hover:text-[#7C3AED] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="upscale-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t("common_swap_photo")}
                </button>
              )}
            </div>

            <ImageUploadZone
              value={photo}
              onChange={(f) => { setPhoto(f); setResult(null); }}
              layout="wide"
              testId="upscale-photo"
              compressOptions={{ maxSize: 880 }}
              emptyLabel={t("common_upload_click")}
              emptyHint={t("common_upload_hint_drag")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("upscale_section_scale")} hint={t("upscale_section_scale_hint")} testId="upscale-section-scale">
            <div className="grid grid-cols-2 gap-3" data-testid="upscale-scale-options">
              {scaleOptions.map(({ s, label, hint }) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  data-testid={`upscale-scale-${s}`}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all overflow-hidden group ${
                    scale === s
                      ? "border-[#7C3AED] bg-[#7C3AED]/10"
                      : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40 hover:bg-[#13131A]"
                  }`}
                >
                  {scale === s && (
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
                  )}
                  <div className="flex items-start justify-between mb-3 relative">
                    <ZoomIn className={`w-6 h-6 ${scale === s ? "text-[#C4B5FD]" : "text-[#5A5A5E] group-hover:text-[#8A8A8E]"}`} strokeWidth={1.5} />
                    {scale === s && (
                      <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className={`relative text-[20px] font-light tracking-[-0.01em] mb-1 font-['Inter_Tight'] ${
                    scale === s ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
                  }`}>
                    {label}
                  </p>
                  <p className="relative text-[#8A8A8E] text-[12px]">{hint}</p>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={t("common_section_tuning")} optional testId="upscale-section-tuning">
            <div className="space-y-2.5">
              <Toggle
                active={sharpen}
                onClick={() => setSharpen(!sharpen)}
                label={t("upscale_toggle_sharpen")}
                hint={t("upscale_toggle_sharpen_hint")}
                testId="upscale-toggle-sharpen"
              />
              <Toggle
                active={denoise}
                onClick={() => setDenoise(!denoise)}
                label={t("upscale_toggle_denoise")}
                hint={t("upscale_toggle_denoise_hint")}
                testId="upscale-toggle-denoise"
              />
              <Toggle
                active={preserveColors}
                onClick={() => setPreserveColors(!preserveColors)}
                label={t("upscale_toggle_colors")}
                hint={t("upscale_toggle_colors_hint")}
                testId="upscale-toggle-colors"
              />
            </div>
          </CollapsibleSection>
        </div>

        <StudioResultAnchor busy={busy} ready={Boolean(result?.url)} className="xl:sticky xl:top-[72px] self-start space-y-2">
          <p className="hidden md:block text-[11px] text-[#6b6b70] uppercase tracking-wide">{t("common_output")}</p>
          <ResultArea busy={busy} result={result} originalPreview={photoPreview} scale={scale} />
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={run}
        label={t("upscale_btn", { n: cost })}
        busyLabel={t("common_processing")}
        hint={hint}
        testId="upscale-create-btn"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </StudioCompactShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
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

function ResultArea({ busy, result, originalPreview, scale }) {
  const { t } = useStudioI18n();
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden" data-testid="upscale-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">{t("upscale_loading", { scale })}</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
          {t("upscale_loading_sub")}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10" data-testid="upscale-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <ArrowUp className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px] text-center">{t("common_result_here")}</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">{t("common_result_ready")}</p>
      </div>
    );
  }

  return <ResultViewer result={result} originalPreview={originalPreview} />;
}

function ResultViewer({ result, originalPreview }) {
  const { t } = useStudioI18n();
  const [showCompare, setShowCompare] = useState(false);

  const handleDownload = async () => {
    try {
      const r = await fetch(result.url);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remakepix-upscale-${result.scale}x-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      toast.error(t("common_download_fail"));
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="upscale-result">
      <div className="relative aspect-square bg-black">
        <img
          src={result.url}
          alt="Upscaled"
          className="absolute inset-0 w-full h-full object-contain"
          data-testid="upscale-result-image"
          crossOrigin="anonymous"
        />
        {showCompare && originalPreview && (
          <div className="absolute inset-0">
            <img src={originalPreview} alt="" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white bg-black/60 px-2 py-1 rounded">
              {t("common_before")}
            </div>
          </div>
        )}
        {/* Scale badge */}
        <div className="absolute top-3 left-3 text-[11px] font-mono uppercase tracking-[0.18em] bg-[#7C3AED] text-white px-2.5 py-1 rounded">
          {t("upscale_badge", { scale: result.scale })}
        </div>
        {originalPreview && (
          <button
            onMouseDown={() => setShowCompare(true)}
            onMouseUp={() => setShowCompare(false)}
            onMouseLeave={() => setShowCompare(false)}
            onTouchStart={() => setShowCompare(true)}
            onTouchEnd={() => setShowCompare(false)}
            className="absolute bottom-3 right-3 z-10 bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-black/85 transition-colors select-none"
            data-testid="upscale-compare"
          >
            <Move className="w-3.5 h-3.5" />
            {t("common_hold_before")}
          </button>
        )}
      </div>
      <div className="p-3 flex gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <button
          onClick={handleDownload}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="upscale-download"
        >
          <Download className="w-4 h-4" />
          {t("upscale_download")}
        </button>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="upscale-open"
        >
          {t("common_open")}
        </a>
      </div>
    </div>
  );
}
