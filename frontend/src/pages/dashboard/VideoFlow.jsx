import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import { VIDEO_CATEGORIES, VIDEO_FLOW_MODES } from "../../lib/videoCatalogue";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";

export default function VideoFlow() {
  const { mode } = useParams();
  const { t } = useI18n();
  const valid = VIDEO_FLOW_MODES.has(mode);
  const meta = valid ? VIDEO_CATEGORIES.find((c) => c.id === mode) : null;
  useTitle(t(meta ? meta.nameKey : "sidebar_video"));

  if (!valid) {
    return <Navigate to="/app/video" replace />;
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-20" data-testid={`video-flow-${mode}`}>
      <Link
        to="/app/video"
        className="inline-flex items-center gap-2 mb-6 text-[13px] text-[#8A8A8E] hover:text-[#F4F1EA] transition-colors"
        data-testid="video-back-hub"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        {t("vid_back_hub")}
      </Link>

      <header className="mb-8 md:mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_cap")}</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[32px] md:text-[44px] mb-3 font-['Inter_Tight']">
          {meta ? t(meta.nameKey) : t("sidebar_video")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">
          {meta ? t(meta.descKey) : t("vid_desc_body")}
        </p>
      </header>

      {mode === "edit" ? <VideoEditorAdmin /> : <VideoGenerate mode={mode} />}
    </div>
  );
}
