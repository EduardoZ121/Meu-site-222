import { useMemo } from "react";
import { BookOpen, AlertTriangle, User, MapPin, FileImage, Layers } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";

export default function StoryNavigator({
  project,
  activePanelId,
  onSelectPanel,
  onCoherenceCheck,
  coherenceScore,
  coherenceLoading,
}) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  const panels = [...(project.panels || [])].sort((a, b) => a.order - b.order);
  const pageSize = project.pageLayout === "grid_2x2" ? 4 : project.pageLayout === "vertical" ? 1 : 2;
  const pages = [];
  for (let i = 0; i < panels.length; i += pageSize) {
    pages.push(panels.slice(i, i + pageSize));
  }

  const panelLinks = (charId) =>
    panels.filter((p) => p.characterId === charId).map((p) => p.order + 1);

  return (
    <div className="manga-story-tree" data-testid="manga-story-navigator">
      <h2 className="manga-pane-title">
        <BookOpen className="w-4 h-4 inline text-[#8B5CF6]" /> {t("manga_story_nav")}
      </h2>
      <p className="manga-pane-desc">{t("manga_story_nav_hint")}</p>

      <button
        type="button"
        onClick={onCoherenceCheck}
        disabled={coherenceLoading}
        className="manga-coherence-btn w-full min-h-[48px] mb-4"
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="flex-1 text-left font-semibold">{t("manga_coherence_btn")}</span>
        {coherenceScore != null && <span className="font-mono text-[#8B5CF6]">{coherenceScore}%</span>}
      </button>

      <div className="manga-tree-block">
        {(project.characters || []).map((c) => (
          <div key={c.id} className="manga-tree-node manga-tree-node--char">
            <User className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-[14px] text-white font-medium">{c.name}</p>
              <p className="text-[11px] text-[#9CA3AF]">
                {t("manga_tree_char_links", { panels: panelLinks(c.id).join(", ") || "—" })}
              </p>
            </div>
          </div>
        ))}
        {(project.scenarios || []).map((s) => (
          <div key={s.id} className="manga-tree-node manga-tree-node--scene">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <p className="text-[14px] text-white font-medium">{s.name}</p>
              <p className="text-[11px] text-[#9CA3AF]">{s.timeOfDay || t("manga_day_night")}</p>
            </div>
          </div>
        ))}
      </div>

      {pages.map((pagePanels, pageIdx) => (
        <div key={`pg-${pageIdx}`} className="manga-tree-page">
          <p className="manga-tree-page-title">
            <FileImage className="w-3.5 h-3.5" />
            {t("manga_page_n", { n: pageIdx + 1 })} ·{" "}
            {catalog.pageLayouts.find((l) => l.id === project.pageLayout)?.label}
          </p>
          {pagePanels.map((panel) => {
            const char = project.characters?.find((c) => c.id === panel.characterId);
            const pose = catalog.poses.find((p) => p.id === panel.poseId);
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => onSelectPanel(panel.id)}
                className={cn(
                  "manga-tree-panel",
                  activePanelId === panel.id && "manga-tree-panel--active",
                )}
              >
                <Layers className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[13px] text-white">
                    {t("manga_panel_n", { n: panel.order + 1 })} — {char?.name || "—"}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">
                    {pose?.emoji} {pose?.label}
                  </p>
                </div>
                <span className="manga-tree-order">{panel.order + 1}</span>
              </button>
            );
          })}
        </div>
      ))}

      <div className="manga-tree-legend">
        <p>{t("manga_story_legend")}</p>
        <p className="mt-1">
          <span className="text-blue-400">■</span> {t("manga_edge_scene")}{" "}
          <span className="text-orange-400 ml-2">■</span> {t("manga_edge_character")}{" "}
          <span className="text-green-400 ml-2">■</span> {t("manga_edge_sequence")}
        </p>
      </div>
    </div>
  );
}
