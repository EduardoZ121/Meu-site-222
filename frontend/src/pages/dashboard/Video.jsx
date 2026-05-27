import { useMemo } from "react";
import { Clapperboard, ImageIcon, Type } from "lucide-react";
import { VIDEO_CATEGORIES } from "../../lib/videoCatalogue";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";

const COLUMN_ICONS = {
  text: Type,
  image: ImageIcon,
  edit: Clapperboard,
};

export default function Video() {
  const { t } = useI18n();
  useTitle(t("sidebar_video"));

  const columns = useMemo(
    () =>
      VIDEO_CATEGORIES.map((cat) => ({
        ...cat,
        Icon: COLUMN_ICONS[cat.id],
        title: t(cat.nameKey),
        desc: t(cat.descKey),
      })),
    [t],
  );

  return (
    <div
      className="w-full min-w-0 max-w-[1680px] mx-auto pb-20 md:pb-24"
      data-testid="video-page"
    >
      <header className="mb-8 md:mb-10 pb-8 border-b border-[rgba(244,241,234,0.06)]">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_cap")}</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-3 font-['Inter_Tight']">
          {t("vid_title_a")} <span className="italic text-[#C4B5FD]">{t("vid_title_b")}</span>
          {t("vid_title_dot")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[720px]">{t("vid_desc_body")}</p>
      </header>

      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 w-full min-w-0 items-start"
        data-testid="video-category-grid"
      >
        {columns.map(({ id, title, desc, Icon, testId }) => (
          <div
            key={id}
            className="min-w-0 flex flex-col gap-4"
            data-testid={testId || `video-column-${id}`}
          >
            <div className="flex items-start gap-3 pb-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10">
                <Icon className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[#F4F1EA] text-[17px] md:text-[18px] font-semibold tracking-[-0.02em] font-['Inter_Tight']">
                  {title}
                </h2>
                <p className="text-[#8A8A8E] text-[12px] leading-relaxed mt-1">{desc}</p>
              </div>
            </div>

            {id === "edit" ? (
              <VideoEditorAdmin layout="column" />
            ) : (
              <VideoGenerate mode={id} layout="column" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
