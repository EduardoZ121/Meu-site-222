import { BookOpen, GitBranch, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

const TABS = [
  { id: "library", icon: BookOpen, labelKey: "manga_mob_assets" },
  { id: "editor", icon: LayoutGrid, labelKey: "manga_mob_page" },
  { id: "config", icon: SlidersHorizontal, labelKey: "manga_mob_panel" },
  { id: "story", icon: GitBranch, labelKey: "manga_mob_story" },
];

export default function MangaStudioMobileNav({ active, onChange, t, panelIndex, panelTotal }) {
  return (
    <nav
      className="manga-mobile-nav manga-shell-nav lg:hidden"
      aria-label={t("manga_mobile_nav")}
      data-testid="manga-mobile-nav"
    >
      {TABS.map(({ id, icon: Icon, labelKey }) => {
        const isActive = active === id;
        const showBadge = id === "config" && panelTotal > 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn("manga-mobile-nav-btn", isActive && "manga-mobile-nav-btn--active")}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="manga-mobile-nav-icon-wrap">
              <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.25 : 1.75} />
              {showBadge && (
                <span className="manga-mobile-nav-badge" aria-hidden>
                  {panelIndex + 1}
                </span>
              )}
            </span>
            <span className="manga-mobile-nav-label">{t(labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
