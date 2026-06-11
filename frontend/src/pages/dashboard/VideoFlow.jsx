import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import {
  VIDEO_FLOW_MODES,
  VIDEO_LEGACY_REDIRECTS,
  findVideoCategory,
} from "../../lib/videoCatalogue";
import { getVideoToolMeta } from "../../lib/videoModels";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";

export default function VideoFlow() {
  const { mode } = useParams();
  const { t } = useI18n();
  const valid = VIDEO_FLOW_MODES.has(mode);
  const meta = valid ? findVideoCategory(mode) : null;
  useTitle(t(meta ? meta.nameKey : "sidebar_video"));

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
    <StudioCompactShell testId={`video-flow-${mode}`} maxWidth="1200px" className="pb-4 md:pb-8">
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
        title={t(meta.nameKey)}
        description={
          toolMeta?.modelLabel
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
