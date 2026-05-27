import { useMemo } from "react";
import { Clapperboard, ImageIcon, Type } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";

const CATEGORIES = [
  {
    id: "text",
    labelKey: "vid_tab_text",
    descKey: "vid_desc_text_mode",
    icon: Type,
    testId: "video-category-text",
    navTestId: "video-nav-text",
  },
  {
    id: "image",
    labelKey: "vid_tab_image",
    descKey: "vid_desc_image_mode",
    icon: ImageIcon,
    testId: "video-category-image",
    navTestId: "video-nav-image",
  },
  {
    id: "edit",
    labelKey: "vid_tab_editor",
    descKey: "vid_cat_edit_intro",
    icon: Clapperboard,
    testId: "video-category-edit",
    navTestId: "video-nav-edit",
  },
];

function scrollToCategory(id) {
  document.getElementById(`video-cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Video() {
  const { t } = useI18n();
  useTitle(t("sidebar_video"));

  const categories = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        label: t(cat.labelKey),
        desc: t(cat.descKey),
      })),
    [t],
  );

  return (
    <div className="max-w-[1200px] mx-auto pb-20" data-testid="video-page">
      <header className="mb-8 md:mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_cap")}</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-3 font-['Inter_Tight']">
          {t("vid_title_a")} <span className="italic text-[#C4B5FD]">{t("vid_title_b")}</span>
          {t("vid_title_dot")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">{t("vid_desc_body")}</p>
      </header>

      <nav
        className="flex flex-wrap gap-2 mb-10 md:mb-12"
        aria-label={t("vid_cat_nav_label")}
        data-testid="video-category-nav"
      >
        {categories.map(({ id, label, icon: Icon, navTestId }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToCategory(id)}
            className="rp-pill"
            data-testid={navTestId}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>

      <div className="space-y-0">
        {categories.map(({ id, label, desc, icon: Icon, testId }) => (
          <section
            key={id}
            id={`video-cat-${id}`}
            className="scroll-mt-28 mb-16 md:mb-20 pb-16 md:pb-20 border-b border-white/[0.06] last:mb-0 last:pb-0 last:border-b-0"
            data-testid={testId}
            aria-labelledby={`video-cat-heading-${id}`}
          >
            <header className="mb-8 md:mb-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7C3AED]/35 bg-[#7C3AED]/10">
                  <Icon className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
                </span>
                <h2
                  id={`video-cat-heading-${id}`}
                  className="text-[#F4F1EA] font-light tracking-[-0.02em] text-[26px] md:text-[32px] font-['Inter_Tight']"
                >
                  {label}
                </h2>
              </div>
              <p className="text-[#8A8A8E] text-[15px] max-w-[640px] pl-[52px]">{desc}</p>
            </header>

            {id === "edit" ? <VideoEditorAdmin /> : <VideoGenerate mode={id} />}
          </section>
        ))}
      </div>
    </div>
  );
}
