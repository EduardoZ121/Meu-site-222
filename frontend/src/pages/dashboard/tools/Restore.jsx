import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, History, Download,
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
import StudioCompactShell from "../../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../../components/studio/StudioInlineHeader";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";
import { RESTORE_LEVEL_KEYS } from "../../../lib/toolPagesLocales";
import { restoreCostForLevel } from "../../../lib/creditPricing";

const RESTORE_PROMPT_KEYS = [1, 2, 3, 4];

export default function Restore() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat } = useI18n();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { costs } = usePricing();

  const levels = useMemo(
    () => RESTORE_LEVEL_KEYS.map((key) => ({
      key,
      label: t(`restore_level_${key}_label`),
      hint: t(`restore_level_${key}_hint`),
    })),
    [t],
  );

  const promptIdeas = useMemo(
    () => RESTORE_PROMPT_KEYS.map((n) => t(`restore_prompt_${n}`)),
    [t],
  );

  const [photo, setPhoto] = useState(null);
  const { previewUrl: resultOriginalUrl } = useStudioMediaPreview(photo);
  const [level, setLevel] = useState("medio");
  const [enhanceFaces, setEnhanceFaces] = useState(true);
  const [recoverColors, setRecoverColors] = useState(true);
  const [removeNoise, setRemoveNoise] = useState(true);
  const [sharpen, setSharpen] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = useMemo(() => restoreCostForLevel(costs, level), [costs, level]);

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
    if (!photo) { toast.error(t("restore_err_upload")); return; }
    clearUploadToast();
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("level", level);
      fd.append("enhance_faces", enhanceFaces ? "true" : "false");
      fd.append("recover_colors", recoverColors ? "true" : "false");
      fd.append("remove_noise", removeNoise ? "true" : "false");
      fd.append("sharpen", sharpen ? "true" : "false");
      fd.append("custom_prompt", customPrompt);
      const { data } = await uploadPost("/tools/restore", fd, { timeout: 240000 });
      const creation = data?.creation;
      const url = creation?.result_urls?.[0];
      if (!url) throw new Error(t("common_no_result"));
      setResult({ url, id: creation?.id || null, level });
      toast.success(t("restore_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally { setBusy(false); }
  };

  return (
    <StudioCompactShell testId="restore-frame" maxWidth="1400px" className="pb-4 md:pb-8">
      <StudioInlineHeader
        title={tCat("tool_restore_name")}
        description={t("restore_desc_long")}
        testId="restore-header"
        helpKey="help_tool_restore"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3 xl:gap-8">
        <div className="rp-studio-card-stack">
          {/* 1) UPLOAD */}
          <CollapsibleSection title={t("restore_section_photo")} defaultOpen testId="restore-section-photo" helpKey="help_sec_upload">
            <div className="flex items-baseline justify-between mb-4">
              {photo && (
                <button
                  onClick={reset}
                  className="text-[#5A5A5E] hover:text-[#7C3AED] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="restore-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t("common_swap_photo")}
                </button>
              )}
            </div>
            <ImageUploadZone
              value={photo}
              onChange={(f) => { setPhoto(f); setResult(null); }}
              layout="wide"
              testId="restore-photo"
              emptyLabel={t("common_upload_click")}
              emptyHint={t("common_upload_hint_drag")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("restore_section_level")} testId="restore-section-level" helpKey="help_sec_restore_level">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="restore-levels">
              {levels.map(({ key, label, hint }) => (
                <button
                  key={key}
                  onClick={() => setLevel(key)}
                  data-testid={`restore-level-${key}`}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                    level === key
                      ? "border-[#7C3AED] bg-[#7C3AED]/10"
                      : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
                  }`}
                >
                  {level === key && (
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
                  )}
                  <div className="relative flex items-start justify-between mb-2">
                    <IntensityBars active={level === key} index={levels.findIndex((l) => l.key === key)} />
                    {level === key && (
                      <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className={`relative text-[16px] font-light tracking-[-0.01em] mb-1 font-['Inter_Tight'] ${
                    level === key ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
                  }`}>{label}</p>
                  <p className="relative text-[#8A8A8E] text-[11.5px] leading-snug">{hint}</p>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={t("restore_section_advanced")} testId="restore-section-options" helpKey="help_sec_restore_level">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Toggle
                active={enhanceFaces}
                onClick={() => setEnhanceFaces(!enhanceFaces)}
                label={t("restore_toggle_faces")}
                hint={t("restore_toggle_faces_hint")}
                testId="restore-toggle-faces"
              />
              <Toggle
                active={recoverColors}
                onClick={() => setRecoverColors(!recoverColors)}
                label={t("restore_toggle_colors")}
                hint={t("restore_toggle_colors_hint")}
                testId="restore-toggle-colors"
              />
              <Toggle
                active={removeNoise}
                onClick={() => setRemoveNoise(!removeNoise)}
                label={t("restore_toggle_noise")}
                hint={t("restore_toggle_noise_hint")}
                testId="restore-toggle-noise"
              />
              <Toggle
                active={sharpen}
                onClick={() => setSharpen(!sharpen)}
                label={t("restore_toggle_sharpen")}
                hint={t("restore_toggle_sharpen_hint")}
                testId="restore-toggle-sharpen"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={t("restore_section_extra")} optional testId="restore-section-prompt" helpKey="help_sec_prompt">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder={t("restore_prompt_ph")}
              className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px]"
              data-testid="restore-custom-prompt"
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

        <StudioResultAnchor busy={busy} ready={Boolean(result?.url)} className="xl:sticky xl:top-[72px] self-start space-y-2">
          <p className="hidden md:block text-[11px] text-[#6b6b70] uppercase tracking-wide">{t("common_output")}</p>
          <ResultArea busy={busy} result={result} originalPreview={resultOriginalUrl} level={level} />
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={run}
        label={t("restore_btn", { n: cost })}
        busyLabel={t("restore_processing")}
        hint={hint}
        testId="restore-create-btn"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </StudioCompactShell>
  );
}

/* ------------------------------------------------------------------ */

function IntensityBars({ active, index }) {
  // Show 1, 2, or 3 bars indicating leve/medio/profundo intensity
  const filled = index + 1;
  return (
    <div className="flex items-end gap-1 h-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm transition-all ${
            i <= filled
              ? active ? "bg-[#C4B5FD]" : "bg-[#7C3AED]/60"
              : "bg-[#2E2E30]"
          }`}
          style={{ height: `${i * 7 + 5}px` }}
        />
      ))}
    </div>
  );
}

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

function ResultArea({ busy, result, originalPreview, level }) {
  const { t } = useStudioI18n();
  const levelLabel = t(`restore_level_${level}_label`);
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden" data-testid="restore-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">{t("restore_loading")}</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
          {t("restore_loading_sub", { level: levelLabel })}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10" data-testid="restore-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <History className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px] text-center">{t("restore_result_empty")}</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">{t("restore_result_cta")}</p>
      </div>
    );
  }

  return <ResultViewer result={result} originalPreview={originalPreview} />;
}

function ResultViewer({ result, originalPreview }) {
  const { t } = useStudioI18n();
  const [showCompare, setShowCompare] = useState(false);
  const levelLabel = t(`restore_level_${result.level}_label`);

  const handleDownload = async () => {
    try {
      const r = await fetch(result.url);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remakepix-restored-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      toast.error(t("common_download_fail"));
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="restore-result">
      <div className="relative aspect-square bg-black">
        <img
          src={result.url}
          alt={t("restore_alt_result")}
          className="absolute inset-0 w-full h-full object-contain"
          data-testid="restore-result-image"
          crossOrigin="anonymous"
        />
        {showCompare && originalPreview && (
          <div className="absolute inset-0">
            <img src={originalPreview} alt="" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white bg-black/70 px-2 py-1 rounded">
              {t("common_before")}
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 text-[11px] font-mono uppercase tracking-[0.18em] bg-[#7C3AED] text-white px-2.5 py-1 rounded">
          {t("restore_result_badge", { label: levelLabel })}
        </div>
        {originalPreview && (
          <button
            onMouseDown={() => setShowCompare(true)}
            onMouseUp={() => setShowCompare(false)}
            onMouseLeave={() => setShowCompare(false)}
            onTouchStart={() => setShowCompare(true)}
            onTouchEnd={() => setShowCompare(false)}
            className="absolute bottom-3 right-3 z-10 bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-black/85 transition-colors select-none"
            data-testid="restore-compare"
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
          data-testid="restore-download"
        >
          <Download className="w-4 h-4" />
          {t("restore_download")}
        </button>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="restore-open"
        >
          {t("common_open")}
        </a>
      </div>
    </div>
  );
}
