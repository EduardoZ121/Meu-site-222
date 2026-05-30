import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ImageIcon,
  Palette,
  Sparkles,
  Type,
  Wand2,
  Layers,
  SlidersHorizontal,
  Download,
  RefreshCw,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import useTitle from "../../lib/useTitle";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import ArtisticStep from "../../components/artistic-studio/ArtisticStep";

const TABS = ["style", "effects", "prompt"];

function SkeletonStyleGrid() {
  return (
    <div className="as-v2-skeleton-grid" data-testid="artistic-styles-placeholder">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="as-v2-skeleton-card" aria-hidden>
          <div className="as-v2-skeleton-card__thumb" />
          <div className="as-v2-skeleton-card__line as-v2-skeleton-card__line--wide" />
          <div className="as-v2-skeleton-card__line" />
        </div>
      ))}
    </div>
  );
}

function SkeletonEffectChips() {
  const labels = ["Luz", "Lente", "Mood", "Cor", "Textura", "Grão"];
  return (
    <div className="flex flex-wrap gap-2" data-testid="artistic-effects-placeholder">
      {labels.map((label) => (
        <span key={label} className="as-v2-chip as-v2-chip--ghost" aria-disabled="true">
          {label}
        </span>
      ))}
    </div>
  );
}

export default function Artistic() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { costs } = usePricing();
  const [tab, setTab] = useState("style");
  const [mode, setMode] = useState("image");

  useTitle(t("art_page_title"));
  const cost = costs.artistic ?? 25;

  const tabLabels = useMemo(
    () => ({
      style: t("art_tab_style"),
      effects: t("art_tab_effects"),
      prompt: t("art_tab_prompt"),
    }),
    [t],
  );

  const generateLabel = mode === "image" ? t("art_edit_credits", { n: cost }) : t("art_generate_credits", { n: cost });

  return (
    <div className="as-v2-page rp-studio-shell pb-28" data-testid="artistic-page">
      <button
        type="button"
        onClick={() => navigate("/app/tools")}
        className="rp-studio-back"
        data-testid="artistic-back"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        {t("art_back")}
      </button>

      <header className="as-v2-hero mb-6 pb-6 border-b border-[rgba(244,241,234,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="as-v2-mark">
                <Palette className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
              </div>
              <p className="rp-editor-section-cap !text-[#a89bc9] !mb-0">{t("art_brand")}</p>
            </div>
            <h1 className="rp-studio-page-title mb-2 text-[2rem] sm:text-[2.75rem] font-['Inter_Tight']">
              {t("art_hero_title")}
            </h1>
            <p className="rp-studio-page-desc text-[14px] max-w-[640px]">{t("art_hero_subtitle")}</p>
          </div>
          <div className="as-v2-recipe-badge shrink-0">
            <Layers className="w-3.5 h-3.5 text-purple-300/80" strokeWidth={1.75} />
            <span>{t("art_recipe")}</span>
            <em>—</em>
          </div>
        </div>
      </header>

      <div
        className="as-v2-tabs mb-6"
        role="tablist"
        aria-label={t("art_page_title")}
        data-testid="artistic-tabs"
      >
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`as-v2-tab ${tab === id ? "as-v2-tab--active" : ""}`}
            data-testid={`artistic-tab-${id}`}
          >
            {tabLabels[id]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 xl:gap-8">
        <div className="rp-editor-panel overflow-hidden">
          <div className="rp-editor-panel-accent" />
          <div className="p-5 sm:p-7 space-y-7">
            <ArtisticStep step="1" title={t("art_input_image")} hint={t("art_upload_hint")}>
              <div className="flex flex-wrap gap-2 mb-4" data-testid="artistic-mode-toggle">
                <button
                  type="button"
                  className={`as-v2-mode ${mode === "text" ? "as-v2-mode--active" : ""}`}
                  onClick={() => setMode("text")}
                  aria-pressed={mode === "text"}
                >
                  <Type className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {t("art_mode_text")}
                </button>
                <button
                  type="button"
                  className={`as-v2-mode ${mode === "image" ? "as-v2-mode--active" : ""}`}
                  onClick={() => setMode("image")}
                  aria-pressed={mode === "image"}
                >
                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {t("art_mode_image")}
                </button>
              </div>

              {mode === "image" ? (
                <div className="as-v2-upload rp-editor-upload-dashed min-h-[180px] flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="as-v2-upload-icon">
                    <ImageIcon className="w-6 h-6 text-purple-300/70" strokeWidth={1.5} />
                  </div>
                  <p className="text-[#F4F1EA] text-sm font-medium font-['Inter_Tight']">{t("art_upload_label")}</p>
                  <p className="text-[#8A8A8E] text-xs max-w-[280px]">{t("art_upload_hint")}</p>
                  <button type="button" className="rp-btn-surface mt-1" disabled>
                    {t("upload_empty_label")}
                  </button>
                </div>
              ) : (
                <div className="as-v2-text-only rounded-xl border border-white/[0.06] bg-black/20 p-5">
                  <p className="text-[#8A8A8E] text-sm leading-relaxed">{t("art_prompt_ph_text")}</p>
                </div>
              )}
            </ArtisticStep>

            {tab === "style" && (
              <ArtisticStep step="2" title={t("art_sec_style")} hint={t("art_style_label")}>
                <SkeletonStyleGrid />
                <p className="as-v2-soon-note">{t("art_empty")}</p>
              </ArtisticStep>
            )}

            {tab === "effects" && (
              <ArtisticStep step="2" title={t("art_sec_effects")}>
                <SkeletonEffectChips />
                <p className="as-v2-soon-note mt-4">{t("art_result_empty")}</p>
              </ArtisticStep>
            )}

            {tab === "prompt" && (
              <>
                <ArtisticStep step="2" title={t("art_prompt_label")}>
                  <textarea
                    className="rp-editor-textarea min-h-[120px]"
                    placeholder={mode === "image" ? t("art_prompt_ph_image") : t("art_prompt_ph_text")}
                    disabled
                    aria-disabled="true"
                    data-testid="artistic-prompt"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" className="rp-btn-surface" disabled>
                      <Wand2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {t("art_refine_btn")}
                    </button>
                    <button type="button" className="rp-btn-surface" disabled>
                      {t("art_prompt_clear")}
                    </button>
                  </div>
                </ArtisticStep>

                <ArtisticStep step="3" title={t("art_format_label")}>
                  <div className="flex flex-wrap gap-2">
                    {["1:1", "4:5", "16:9", "9:16"].map((ratio) => (
                      <span key={ratio} className="rp-pill opacity-50 cursor-not-allowed" aria-disabled="true">
                        {ratio}
                      </span>
                    ))}
                  </div>
                </ArtisticStep>
              </>
            )}

            {tab !== "prompt" && (
              <ArtisticStep
                step="3"
                title={t("art_prompt_label_image")}
                hint={t("studio_styles_optional")}
              >
                <textarea
                  className="rp-editor-textarea min-h-[88px] opacity-60"
                  placeholder={t("art_extra_placeholder")}
                  disabled
                  aria-disabled="true"
                />
              </ArtisticStep>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rp-editor-panel overflow-hidden">
            <div className="rp-editor-panel-accent" />
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="rp-editor-section-cap !mb-0">{t("art_result_label")}</p>
                <SlidersHorizontal className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />
              </div>
              <div className="as-v2-preview" data-testid="artistic-preview">
                <Sparkles className="w-8 h-8 text-purple-400/30 mb-3" strokeWidth={1.25} />
                <p className="text-[#8A8A8E] text-sm text-center leading-relaxed px-2">
                  {t("art_result_empty")}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="rp-btn-surface flex-1 justify-center opacity-45" disabled>
                  <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {t("art_download")}
                </button>
                <button type="button" className="rp-btn-surface flex-1 justify-center opacity-45" disabled>
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {t("art_vary")}
                </button>
              </div>
            </div>
          </div>

          <div className="as-v2-meta-panel">
            <p className="as-v2-meta-line">{t("art_meta_style", { style: "—" })}</p>
            <p className="as-v2-meta-line">{t("art_meta_effects", { effects: "—" })}</p>
          </div>
        </aside>
      </div>

      <StudioGenerateBar
        ready={false}
        busy={false}
        onClick={() => {}}
        label={generateLabel}
        busyLabel={t("art_generating")}
        hint={t("art_empty")}
        layout="sticky"
        testId="artistic-generate"
        costMeta={<StudioGenerateCostMeta cost={cost} />}
      />
    </div>
  );
}
