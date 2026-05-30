import { useNavigate } from "react-router-dom";
import {
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import CreationResultMedia from "../CreationResultMedia";
import StudioResultAnchor from "../StudioResultAnchor";
import { useI18n } from "../../lib/i18n";

function ShimmerSkeleton({ recipeChips, t }) {
  return (
    <div className="art-studio-result-skeleton" data-testid="artistic-result-loading">
      <div className="art-studio-shimmer" aria-hidden />
      <div className="relative z-[1] flex flex-col items-center justify-center gap-4 p-8 min-h-[280px]">
        <div className="art-studio-ai-loader">
          <Sparkles className="w-6 h-6 text-[#C4B5FD] animate-pulse" />
        </div>
        <Loader2 className="w-7 h-7 text-[#A855F7] animate-spin" />
        <p className="text-[#E9D5FF] text-[14px] font-medium font-['Inter_Tight']">
          {t("art_applying_recipe")}
        </p>
        {recipeChips?.length > 0 && (
          <p className="text-[#6B7280] text-[11px] text-center max-w-[280px]">
            {recipeChips.map((c) => c.label).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ArtisticResultStudio({
  busy,
  downloadUrl,
  result,
  meta,
  recipeChips,
  onVary,
  onRefine,
  onReusePrompt,
  anchorRef,
}) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <StudioResultAnchor busy={busy} ready={Boolean(downloadUrl)} className="mt-6 flex-1" anchorRef={anchorRef}>
      <p className="art-studio-sublabel mb-3">{t("art_result_label")}</p>

      {busy && <ShimmerSkeleton recipeChips={recipeChips} t={t} />}

      {!busy && downloadUrl && (
        <div className="art-studio-result-card animate-in fade-in duration-500" data-testid="artistic-result-card">
          <div className="art-studio-result-card__media">
            <CreationResultMedia
              creation={result}
              className="w-full object-contain max-h-[440px]"
              containerClassName="min-h-[220px] bg-[#06060a] flex items-center justify-center"
              testId="artistic-result-image"
            />
          </div>
          {meta && (
            <div className="art-studio-result-meta">
              {meta.style && <p>{t("art_meta_style", { style: meta.style })}</p>}
              {meta.chips?.length > 0 && (
                <p>{t("art_meta_effects", { effects: meta.chips.map((c) => c.label).join(", ") })}</p>
              )}
              {meta.seed && <p className="font-mono text-[#6B7280]">ID: {meta.seed}</p>}
            </div>
          )}
          <div className="art-studio-result-actions">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="art-studio-result-btn art-studio-result-btn--primary"
              data-testid="artistic-download"
            >
              <Download className="w-3.5 h-3.5" />
              {t("art_download")}
            </a>
            <button
              type="button"
              onClick={() => navigate("/app/tools/upscale")}
              className="art-studio-result-btn"
              data-testid="artistic-upscale"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {t("art_result_upscale")}
            </button>
            <button
              type="button"
              onClick={onRefine}
              className="art-studio-result-btn"
              data-testid="artistic-refine"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("art_refine_btn")}
            </button>
            <button
              type="button"
              onClick={onVary}
              className="art-studio-result-btn"
              data-testid="artistic-vary"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("art_result_remix")}
            </button>
            <button
              type="button"
              onClick={onReusePrompt}
              className="art-studio-result-btn"
              data-testid="artistic-reuse-prompt"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("art_result_reuse")}
            </button>
          </div>
        </div>
      )}

      {!busy && !downloadUrl && (
        <div className="art-studio-result-empty" data-testid="artistic-result-empty">
          <div className="art-studio-result-empty__icon">
            <Sparkles className="w-6 h-6 text-[#7C3AED]/80" />
          </div>
          <p className="text-[#9CA3AF] text-[14px] font-medium">{t("art_result_empty")}</p>
          <p className="text-[#5A5A5E] text-[12px] mt-1 max-w-[240px] text-center">
            {t("art_result_empty_hint")}
          </p>
        </div>
      )}
    </StudioResultAnchor>
  );
}
