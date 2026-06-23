import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { usePricing } from "../lib/PricingContext";
import { getSurcharges } from "../lib/creditPricing";
import { improvePromptClient } from "../lib/promptEnhance";
import StudioGenerateBar from "./StudioGenerateBar";
import PromptEnhanceToggle from "./promptAssist/PromptEnhanceToggle";
import StudioGenerateCostMeta from "./StudioGenerateCostMeta";
import StudioPhotoUploadNotice, { isPhotoUploadBusy } from "./studio/StudioPhotoUploadNotice";
import { useStudioGenerateGate } from "../lib/useStudioGenerateGate";
import AspectPicker from "./AspectPicker";
import ImageUploadZone from "./ImageUploadZone";
import ResultPanel from "./ResultPanel";
import CollapsibleSection from "./CollapsibleSection";
import StudioResultAnchor from "./StudioResultAnchor";
import StudioCompactShell from "./studio/StudioCompactShell";
import StudioInlineHeader from "./studio/StudioInlineHeader";
import { primaryResultUrl } from "../lib/creationUrls";
/**
 * Unified studio frame — Pollo-style.
 *
 * Props:
 *  - title: string ("AI Clothes Changer")
 *  - subtitle: string (optional one-line description)
 *  - models?: { id, label, image }[] — visual model picker (optional)
 *  - selectedModel, onModelChange
 *  - showPhoto: boolean (default true)
 *  - photo, onPhotoChange
 *  - extraFields?: ReactNode — inserted between Model and Prompt (e.g. background remover has no prompt)
 *  - promptLabel?: string ("Background", "Prompt", null=hide)
 *  - prompt, onPromptChange, promptMax
 *  - ideas?: string[] — clickable suggestions under the textarea
 *  - onShuffleIdeas?: () => void
 *  - aspectRatios?: string[] — defaults to ["1:1", "3:4", "4:5", "9:16", "16:9", "21:9"]
 *  - aspect, onAspectChange
 *  - cost: number (credits)
 *  - onCreate: async () => void
 *  - busy, result, onResultChange
 */
export default function ToolFrame({
  title,
  subtitle,
  models,
  selectedModel,
  onModelChange,
  showPhoto = true,
  photo,
  onPhotoChange,
  photoCompressOptions = {},
  acceptedFormats,
  extraFields,
  promptLabel = "Prompt",
  prompt,
  onPromptChange,
  promptMax = 600,
  ideas,
  onShuffleIdeas,
  aspectRatios = ["1:1", "3:4", "4:5", "9:16", "16:9", "21:9"],
  aspect,
  onAspectChange,
  cost,
  onCreate,
  busy,
  result,
  onResultChange,
  pageHelpKey,
  testId = "tool",
  generateReady,
  generateHint,
  improveTool = "",
  showEnhanceToggle = true,
}) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const [improve, setImprove] = useState(false);
  const enhanceCost = surcharges.enhancePrompt ?? 5;
  const formatsLabel = acceptedFormats ?? t("tool_accept_formats");
  const [viewAllModels, setViewAllModels] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState("idle");
  const photoUploading = showPhoto && isPhotoUploadBusy(photoUploadStatus);

  const visibleModels = models ? (viewAllModels ? models : models.slice(0, 8)) : [];
  const resultReady = Boolean(primaryResultUrl(result));

  const needsPhoto = showPhoto;
  const needsPrompt = Boolean(promptLabel);
  const billedCost = needsPrompt && improve && showEnhanceToggle ? cost + enhanceCost : cost;
  const gate = useStudioGenerateGate({
    busy,
    user,
    cost: billedCost,
    requirePhoto: needsPhoto,
    photo,
    requirePrompt: needsPrompt,
    prompt,
    uploading: photoUploading,
    readyOverride: generateReady,
    hintOverride: generateHint,
  });
  const ready = gate.ready;
  const hint = generateHint ?? gate.hint;

  const handleCreate = async () => {
    if (!ready || busy) return;
    let ctx = {};
    if (showEnhanceToggle && improve && needsPrompt && prompt.trim().length >= 3) {
      try {
        const improved = await improvePromptClient(prompt, { tool: improveTool, lang });
        ctx.improvedPrompt = improved;
        onPromptChange(improved);
      } catch (err) {
        toast.error(err?.message || t("studio_improve_fail"));
        return;
      }
    }
    await onCreate(ctx);
  };

  return (
    <StudioCompactShell testId={`${testId}-frame`} maxWidth="1400px" className="pb-4 md:pb-8">
      <StudioInlineHeader
        eyebrow={t("tool_cap")}
        title={title}
        description={subtitle}
        testId={`${testId}-header`}
        helpKey={pageHelpKey}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3 xl:gap-8">
        <div className="rp-studio-card-stack">
          {showPhoto && (
            <CollapsibleSection
              title={t("tool_ref_image")}
              hint={formatsLabel}
              defaultOpen
              variant="boxed"
              testId={`${testId}-section-photo`}
              helpKey="help_sec_upload"
            >
              <ImageUploadZone
                value={photo}
                onChange={onPhotoChange}
                onStatusChange={setPhotoUploadStatus}
                layout="wide"
                testId={`${testId}-photo`}
                compressOptions={photoCompressOptions}
                emptyLabel={t("upload_drop")}
                emptyHint={formatsLabel}
              />
            </CollapsibleSection>
          )}

          {models && models.length > 0 && (
            <CollapsibleSection title={t("tool_model")} variant="boxed" testId={`${testId}-section-models`} helpKey="help_sec_presets">
              {models.length > 8 && (
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick={() => setViewAllModels(!viewAllModels)}
                    className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#8A8A8E] hover:text-[#C4B5FD] transition-colors"
                    data-testid={`${testId}-view-all`}
                  >
                    {viewAllModels ? t("tool_view_less") : t("tool_view_all", { n: models.length })}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2.5" data-testid={`${testId}-models`}>
                {visibleModels.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition-all ${
                      selectedModel === m.id
                        ? "border-[#7C3AED] ring-1 ring-[#7C3AED]/35 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.15)]"
                        : "border-[rgba(244,241,234,0.08)] hover:border-[rgba(124,58,237,0.35)]"
                    }`}
                    data-testid={`${testId}-model-${m.id}`}
                  >
                    {m.image ? (
                      <img src={m.image} alt={m.label} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A1C] to-[#2E2E30] flex items-center justify-center p-2 text-center">
                        <span className="text-[#F4F1EA] text-[11px] font-medium leading-tight">{m.label}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Extra custom fields (e.g., poster fields, scale slider) */}
          {extraFields}

          {/* Prompt */}
          {promptLabel && (
            <CollapsibleSection title={promptLabel} variant="boxed" testId={`${testId}-section-prompt`} helpKey="help_sec_prompt">
              {showEnhanceToggle && (
                <div className="mb-3">
                  <PromptEnhanceToggle
                    checked={improve}
                    onChange={setImprove}
                    testId={`${testId}-enhance`}
                    cost={enhanceCost}
                  />
                </div>
              )}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  rows={3}
                  maxLength={promptMax}
                  placeholder={ideas?.[0] ? t("tool_example", { text: ideas[0] }) : t("tool_prompt_ph")}
                  className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px] pr-14"
                  data-testid={`${testId}-prompt`}
                />
                <span className="absolute bottom-3 right-3 text-[#5A5A5E] text-[10px] font-mono tracking-wide">{prompt.length} / {promptMax}</span>
              </div>
              {ideas && ideas.length > 0 && (
                <div className="flex items-start gap-2 mt-3 flex-wrap">
                  <span className="text-[#6b6b70] text-[10px] font-mono uppercase tracking-[0.14em] shrink-0 mt-2">{t("tool_suggestions")}</span>
                  {ideas.map((idea) => (
                    <button
                      type="button"
                      key={idea}
                      onClick={() => onPromptChange(idea)}
                      className="rp-pill max-w-full text-left !justify-start !normal-case !tracking-normal !font-['Inter_Tight'] !text-[12px] !font-normal leading-snug line-clamp-2 hover:!text-[#F4F1EA]"
                      data-testid={`${testId}-idea-${idea.slice(0, 12)}`}
                    >
                      {idea}
                    </button>
                  ))}
                  {onShuffleIdeas && (
                    <button type="button" onClick={onShuffleIdeas} className="rp-btn-surface mt-0.5 !p-2" aria-label={t("tool_shuffle")}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </CollapsibleSection>
          )}

          {aspectRatios && aspectRatios.length > 0 && onAspectChange && (
            <CollapsibleSection title={t("tool_output_format")} variant="boxed" testId={`${testId}-section-aspect`} helpKey="help_sec_format">
              <AspectPicker
                value={aspect || aspectRatios[0]}
                onChange={onAspectChange}
                hasPhoto={needsPhoto && Boolean(photo)}
                options={aspectRatios}
                columns="grid grid-cols-3 sm:grid-cols-6 gap-2"
                testIdPrefix={`${testId}-aspect`}
              />
            </CollapsibleSection>
          )}
        </div>

        <StudioResultAnchor
          busy={busy}
          ready={resultReady}
          className="xl:sticky xl:top-[72px] self-start space-y-2"
        >
          <p className="hidden md:block text-[11px] text-[#6b6b70] uppercase tracking-wide">{t("tool_preview")}</p>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/90 overflow-hidden p-3" data-testid={`${testId}-result-panel`}>
            <ResultPanel creation={result} loading={busy} onChange={onResultChange} emptyLabel={t("tool_result_empty")} />
          </div>
        </StudioResultAnchor>
      </div>

      {showPhoto ? (
        <StudioPhotoUploadNotice status={photoUploadStatus} className="mb-3" />
      ) : null}

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={handleCreate}
        label={t("tool_generate_credits", { n: billedCost })}
        busyLabel={t("tool_generating")}
        hint={hint}
        blockedNotify={photoUploading ? "message" : "error"}
        cost={billedCost}
        testId={`${testId}-create-btn`}
        costMeta={<StudioGenerateCostMeta cost={billedCost} user={user} />}
      />
    </StudioCompactShell>
  );
}

