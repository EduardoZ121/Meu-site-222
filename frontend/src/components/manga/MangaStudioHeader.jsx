import {
  ArrowLeft, FolderOpen, GraduationCap, MoreVertical, Plus, Sparkle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function MangaStudioHeader({
  t,
  projectName,
  onTutorial,
  onDemo,
  onNew,
  onOpen,
  coherenceScore,
  onCoherence,
}) {
  const navigate = useNavigate();

  return (
    <header className="manga-studio-header mb-4 lg:mb-6">
      <div className="flex items-center gap-2 mb-3 lg:mb-4">
        <button type="button" onClick={() => navigate("/app/tools")} className="manga-back-btn shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[#A855F7] text-[9px] font-mono uppercase tracking-[0.2em] truncate">
            Remake Pixel · {t("manga_title")}
          </p>
          <h1 className="text-white text-[18px] sm:text-[26px] lg:text-[34px] font-light tracking-tight font-['Inter_Tight'] leading-tight truncate">
            {t("manga_subtitle")}{" "}
            <span className="italic text-[#C4B5FD]">{t("manga_subtitle_accent")}</span>
          </h1>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-100 border border-emerald-400/35">
          v2
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="manga-icon-btn lg:hidden" aria-label={t("manga_menu")}>
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-[#111118] border-[#2E2E30] text-[#F4F1EA]">
            <DropdownMenuItem onClick={onTutorial} className="gap-2 cursor-pointer">
              <GraduationCap className="w-4 h-4" /> {t("manga_tutorial")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDemo} className="gap-2 cursor-pointer">
              <Sparkle className="w-4 h-4" /> {t("manga_load_demo")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2E2E30]" />
            <DropdownMenuItem onClick={onNew} className="gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> {t("manga_new_project")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpen} className="gap-2 cursor-pointer">
              <FolderOpen className="w-4 h-4" /> {t("manga_open_project")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="hidden sm:block text-[#9CA3AF] text-[13px] lg:text-[14px] mb-3 max-w-2xl leading-relaxed">
        {t("manga_desc_v2")}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="manga-project-chip truncate max-w-[55vw] sm:max-w-none">
          {projectName || t("manga_new_project_default")}
        </span>
        {coherenceScore != null && (
          <button
            type="button"
            onClick={onCoherence}
            className="manga-coherence-chip"
          >
            {t("manga_coherence_short")} {coherenceScore}%
          </button>
        )}
        <div className="hidden lg:flex gap-2 ml-auto flex-wrap">
          <button type="button" onClick={onTutorial} className="manga-header-btn manga-header-btn-outline">
            <GraduationCap className="w-4 h-4" /> {t("manga_tutorial")}
          </button>
          <button type="button" onClick={onDemo} className="manga-header-btn manga-header-btn-outline">
            <Sparkle className="w-4 h-4" /> {t("manga_load_demo")}
          </button>
          <button type="button" onClick={onNew} className="manga-header-btn">
            <Plus className="w-4 h-4" /> {t("manga_new_project")}
          </button>
          <button type="button" onClick={onOpen} className="manga-header-btn manga-header-btn-outline">
            <FolderOpen className="w-4 h-4" /> {t("manga_open_project")}
          </button>
        </div>
      </div>
    </header>
  );
}
