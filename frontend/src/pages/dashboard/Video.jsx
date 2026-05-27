import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, ImageIcon, Type } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import VideoGenerate from "./VideoGenerate";
import VideoEditorAdmin from "./VideoEditorAdmin";

export default function Video() {
  const { t } = useI18n();
  useTitle(t("sidebar_video"));
  const [mode, setMode] = useState("text");

  const tabs = useMemo(() => {
    return [
      { id: "text", label: t("vid_tab_text"), icon: Type, testId: "video-tab-text" },
      { id: "image", label: t("vid_tab_image"), icon: ImageIcon, testId: "video-tab-image" },
      { id: "edit", label: t("vid_tab_editor"), icon: Clapperboard, testId: "video-tab-editor" },
    ];
  }, [t]);

  return (
    <div className="max-w-[1200px] mx-auto pb-20" data-testid="video-page">
      <header className="mb-8 md:mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_cap")}</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-3 font-['Inter_Tight']">
          {t("vid_title_a")} <span className="italic text-[#C4B5FD]">{t("vid_title_b")}</span>{t("vid_title_dot")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">
          {mode === "edit" ? t("vid_edit_desc") : mode === "image" ? t("vid_desc_image_mode") : t("vid_desc_text_mode")}
        </p>
      </header>

      <div
        className="inline-flex flex-wrap items-center gap-1 p-1 mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl"
        role="tablist"
        data-testid="video-mode-tabs"
      >
        {tabs.map(({ id, label, icon: Icon, testId }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(id)}
              className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
              data-testid={testId}
            >
              {active && (
                <motion.span
                  layoutId="video-mode-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 shadow-[0_0_28px_-8px_rgba(168,85,247,0.65)]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 w-4 h-4" strokeWidth={1.75} />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {mode === "edit" ? <VideoEditorAdmin /> : <VideoGenerate mode={mode} />}
    </div>
  );
}
