import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { isAdminUser } from "../../lib/isAdmin";
import useTitle from "../../lib/useTitle";
import { useStudioSessionBack } from "../../lib/useStudioSessionBack";
import {
  VIDEO_FLOW_MODES,
  VIDEO_LEGACY_REDIRECTS,
  findVideoCategory,
} from "../../lib/videoCatalogue";
import { LEGACY_EDIT_MODE_MAP } from "../../lib/videoEditCatalog";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";
import StudioCompactShell from "../../components/studio/StudioCompactShell";

export default function VideoFlow() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const valid = VIDEO_FLOW_MODES.has(mode);
  const legacyEditMode = LEGACY_EDIT_MODE_MAP[mode];
  const meta = valid && !legacyEditMode ? findVideoCategory(mode) : null;
  const isEditFlow = Boolean(legacyEditMode) || meta?.flow === "edit";
  useTitle(t(isEditFlow ? "vid_v2v_title" : meta ? meta.nameKey : "sidebar_video"));
  useStudioSessionBack(() => navigate("/app/video"));

  if (isEditFlow) {
    if (loading) return <div className="min-h-[40vh] bg-rp-bg" />;
    if (!isAdminUser(user)) {
      return <Navigate to="/app/video" replace />;
    }
  }

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

  return (
    <StudioCompactShell
      testId={`video-flow-${mode}`}
      maxWidth={isEditFlow ? "960px" : "720px"}
      className="pb-8"
    >
      {isEditFlow ? (
        <VideoEditorAdmin category={meta} />
      ) : (
        <VideoGenerate category={meta} />
      )}
    </StudioCompactShell>
  );
}
