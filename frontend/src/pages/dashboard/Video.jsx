import { VIDEO_CATEGORIES } from "../../lib/videoCatalogue";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import VideoGridCard from "../../components/video/VideoGridCard";

export default function Video() {
  const { t } = useI18n();
  useTitle(t("sidebar_video"));

  return (
    <div
      className="relative w-full max-w-[1280px] mx-auto pb-20 md:pb-24"
      data-testid="video-page"
    >
      <header className="mb-10 md:mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_cap")}</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-3 font-['Inter_Tight']">
          {t("vid_title_a")} <span className="italic text-[#C4B5FD]">{t("vid_title_b")}</span>
          {t("vid_title_dot")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">{t("vid_grid_desc")}</p>
      </header>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
        data-testid="video-cards-grid"
      >
        {VIDEO_CATEGORIES.map((category, index) => (
          <VideoGridCard key={category.id} category={category} index={index} t={t} />
        ))}
      </div>
    </div>
  );
}
