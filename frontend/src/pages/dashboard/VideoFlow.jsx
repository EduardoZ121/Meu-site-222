import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import {
  VIDEO_FLOW_MODES,
  VIDEO_LEGACY_REDIRECTS,
  findVideoCategory,
} from "../../lib/videoCatalogue";
import { LEGACY_EDIT_MODE_MAP } from "../../lib/videoEditCatalog";
import { getVideoToolMeta } from "../../lib/videoModels";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";

export default function VideoFlow() {
  const { mode } = useParams();
  const { t } = useI18n();
  const valid = VIDEO_FLOW_MODES.has(mode);
  const legacyEditMode = LEGACY_EDIT_MODE_MAP[mode];
  const meta = valid && !legacyEditMode ? findVideoCategory(mode) : null;
  const isEditFlow = Boolean(legacyEditMode) || meta?.flow === "edit";
  useTitle(t(isEditFlow ? "vid_v2v_title" : meta ? meta.nameKey : "sidebar_video"));

  if (legacyEditMode) {
    return <Navigate to={`/app/video/edit?mode=${legacyEditMode}`} replace />;
  }

  if (!valid) {
    return <Navigate to="/app/video" replace />;
  }

  if (VIDEO_LEGACY_REDIRECTS[mode]) {
    return <Navigate to={`/app/video/${VIDEO_LEGACY_REDIRECTS[mode]}`} replace />;
  }

  if (!meta) {
    return <Navigate to="/app/video" replace />;
  }

  const toolMeta = getVideoToolMeta(meta.tool);
  const isEdit = meta.flow === "edit";

  return (
    <StudioCompactShell
      testId={`video-flow-${mode}`}
      maxWidth={isEdit ? "1400px" : "1200px"}
      className="pb-4 md:pb-8"
    >
      <Link
        to="/app/video"
        className="rp-studio-back mb-3 md:mb-5"
        data-testid="video-back-hub"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        {t("vid_back_hub")}
      </Link>

      <StudioInlineHeader
        eyebrow={t("vid_cap")}
        title={isEdit ? t("vid_v2v_title") : t(meta.nameKey)}
        description={
          isEdit
            ? t("vid_v2v_subtitle")
            : toolMeta?.modelLabel
              ? `${t(meta.descKey)} · ${t("vid_model_label")}: ${toolMeta.modelLabel}`
              : t(meta.descKey)
        }
        testId="video-flow-header"
      />

      {isEdit ? (
        <VideoEditorAdmin category={meta} />
      ) : (
        <VideoGenerate category={meta} />
      )}
    </StudioCompactShell>
  );
}
