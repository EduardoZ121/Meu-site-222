import { useMemo } from "react";
import { Clapperboard, ImageIcon, Type } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import ArtisticStudioModule from "../../components/artistic/ArtisticStudioModule";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";

export default function Video() {
  const { t } = useI18n();
  useTitle(t("sidebar_video"));

  const columns = useMemo(
    () => [
      {
        id: "text",
        title: t("vid_tab_text"),
        subtitle: t("vid_desc_text_mode"),
        icon: Type,
        accent: "violet",
        testId: "video-module-text",
      },
      {
        id: "image",
        title: t("vid_tab_image"),
        subtitle: t("vid_desc_image_mode"),
        icon: ImageIcon,
        accent: "cyan",
        testId: "video-module-image",
      },
      {
        id: "edit",
        title: t("vid_tab_editor"),
        subtitle: t("vid_edit_desc"),
        icon: Clapperboard,
        accent: "pink",
        testId: "video-module-edit",
      },
    ],
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
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full min-w-0"
        data-testid="video-category-grid"
      >
        {columns.map(({ id, title, subtitle, icon, accent, testId }) => (
          <ArtisticStudioModule
            key={id}
            title={title}
            subtitle={subtitle}
            icon={icon}
            accent={accent}
            testId={testId}
            className="flex flex-col min-h-0"
          >
            {id === "edit" ? (
              <VideoEditorAdmin layout="module" />
            ) : (
              <VideoGenerate mode={id} layout="module" />
            )}
          </ArtisticStudioModule>
        ))}
      </div>
    </div>
  );
}
