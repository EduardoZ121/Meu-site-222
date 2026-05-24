import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import StudioGenerateBar from "./StudioGenerateBar";
import StudioGenerateCostMeta from "./StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../lib/useStudioGenerateGate";
import ImageUploadZone from "./ImageUploadZone";
import ResultPanel from "./ResultPanel";
import CollapsibleSection from "./CollapsibleSection";
import StudioResultAnchor from "./StudioResultAnchor";
import { primaryResultUrl } from "../lib/creationUrls";
import { AspectRatioShape } from "./AspectRatioShape";

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
  testId = "tool",
  generateReady,
  generateHint,
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const formatsLabel = acceptedFormats ?? t("tool_accept_formats");
  const [viewAllModels, setViewAllModels] = useState(false);

  const visibleModels = models ? (viewAllModels ? models : models.slice(0, 8)) : [];
  const resultReady = Boolean(primaryResultUrl(result));

  const needsPhoto = showPhoto;
  const needsPrompt = Boolean(promptLabel);
  const gate = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: needsPhoto,
    photo,
    requirePrompt: needsPrompt,
    prompt,
    readyOverride: generateReady,
    hintOverride: generateHint,
  });
  const ready = generateReady !== undefined ? generateReady && !busy : gate.ready;
  const hint = generateHint ?? gate.hint;

  return (
    <div className="rp-studio-shell max-w-[1400px] mx-auto pb-32" data-testid={`${testId}-frame`}>
      <header className="mb-8 md:mb-10 pb-6 md:pb-8 border-b border-[rgba(244,241,234,0.06)]">
        <p className="rp-editor-section-cap mb-2">{t("tool_cap")}</p>
        <h1 className="rp-studio-page-title mb-3 font-['Inter_Tight']">{title}</h1>
        {subtitle && <p className="rp-studio-page-desc">{subtitle}</p>}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 xl:gap-10">
        <div className="rp-editor-panel overflow-hidden">
          <div className="rp-editor-panel-accent" />
          <div className="p-6 sm:p-8 space-y-0">
          {showPhoto && (
            <CollapsibleSection
              title={t("tool_ref_image")}
              hint={formatsLabel}
              defaultOpen
              variant="inset"
              testId={`${testId}-section-photo`}
            >
              <ImageUploadZone
                value={photo}
                onChange={onPhotoChange}
                layout="wide"
                testId={`${testId}-photo`}
                compressOptions={photoCompressOptions}
                emptyLabel={t("upload_drop")}
                emptyHint={formatsLabel}
              />
            </CollapsibleSection>
          )}

          {models && models.length > 0 && (
            <CollapsibleSection title={t("tool_model")} variant="inset" testId={`${testId}-section-models`}>
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
            <CollapsibleSection title={promptLabel} variant="inset" testId={`${testId}-section-prompt`}>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  rows={5}
                  maxLength={promptMax}
                  placeholder={ideas?.[0] ? t("tool_example", { text: ideas[0] }) : t("tool_prompt_ph")}
                  className="rp-editor-textarea min-h-[140px] pr-16"
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
            <CollapsibleSection title={t("tool_output_format")} variant="inset" testId={`${testId}-section-aspect`}>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5" data-testid={`${testId}-aspect-ratios`}>
                {aspectRatios.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => onAspectChange(a)}
                    className={`py-3 rounded-xl text-[11px] font-medium transition-all flex flex-col items-center gap-1 border font-['Inter_Tight'] ${
                      aspect === a
                        ? "border-[#7C3AED] bg-[rgba(124,58,237,0.1)] text-[#E9E4DC] shadow-[inset_0_0_0_1px_rgba(124,58,237,0.12)]"
                        : "border-[rgba(244,241,234,0.08)] text-[#8A8A8E] hover:border-[rgba(124,58,237,0.35)] hover:text-[#F4F1EA]"
                    }`}
                    data-testid={`${testId}-aspect-${a}`}
                  >
                    <span className="flex h-6 items-center justify-center">
                      <AspectRatioShape ratio={a} active={aspect === a} maxSize={22} />
                    </span>
                    <span>{a}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          )}
          </div>
        </div>

        <StudioResultAnchor
          busy={busy}
          ready={resultReady}
          className="xl:sticky xl:top-[80px] self-start space-y-3"
        >
          <p className="rp-editor-section-cap !text-[#6b6b70]">{t("tool_preview")}</p>
          <div className="rp-editor-panel overflow-hidden p-4 sm:p-5" data-testid={`${testId}-result-panel`}>
            <ResultPanel creation={result} loading={busy} onChange={onResultChange} emptyLabel={t("tool_result_empty")} />
          </div>
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={onCreate}
        label={t("tool_generate_credits", { n: cost })}
        busyLabel={t("tool_generating")}
        hint={hint}
        testId={`${testId}-create-btn`}
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </div>
  );
}

