import { useMemo } from "react";
import {
  BookOpen, FileImage, Layers, User, MapPin, Wand2, AlertTriangle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";

const EDGE = {
  sequence: "#22C55E",
  character: "#F97316",
  scene: "#3B82F6",
  emotion: "#8B5CF6",
};

function NodeCard({ color, icon: Icon, title, sub, active, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 w-[140px] rounded-xl border p-2.5 text-left transition-all",
        active
          ? "border-[#A855F7] shadow-[0_0_20px_rgba(147,51,234,0.35)] bg-[#9333EA]/15"
          : "border-[#2E2E30] bg-[#0B0B0C]/80 hover:border-[#5A5A5E]",
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A5A5E]">{badge}</span>
      </div>
      <p className="text-[12px] text-white font-medium truncate">{title}</p>
      {sub && <p className="text-[9px] text-[#5A5A5E] truncate mt-0.5">{sub}</p>}
    </button>
  );
}

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

  const autoLayout = () => {
    /* visual only — order already in panels */
  };

  return (
    <section
      className="rounded-2xl border border-[rgba(147,51,234,0.25)] bg-[#0a0a0f] p-4 min-h-[420px]"
      data-testid="manga-story-navigator"
      style={{
        backgroundImage:
          "linear-gradient(rgba(147,51,234,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-white text-[13px] font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#A855F7]" />
          {t("manga_story_nav")}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={autoLayout} className="manga-chip-btn text-[10px]">
            <Wand2 className="w-3 h-3" /> {t("manga_auto_layout")}
          </button>
          <button
            type="button"
            onClick={onCoherenceCheck}
            disabled={coherenceLoading}
            className="manga-chip-btn text-[10px] border-amber-500/40 text-amber-100"
          >
            <AlertTriangle className="w-3 h-3" />
            {t("manga_coherence_btn")}
            {coherenceScore != null && (
              <span className="ml-1 text-[#A855F7]">{coherenceScore}%</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
        {(project.characters || []).map((c) => (
          <NodeCard
            key={c.id}
            color={EDGE.character}
            icon={User}
            title={c.name}
            sub={c.bodyType || c.tag}
            badge={t("manga_node_character")}
            active={false}
            onClick={() => {}}
          />
        ))}
        {(project.scenarios || []).map((s) => (
          <NodeCard
            key={s.id}
            color={EDGE.scene}
            icon={MapPin}
            title={s.name}
            sub={s.timeOfDay || s.location}
            badge={t("manga_node_scene")}
            active={false}
            onClick={() => {}}
          />
        ))}
      </div>

      <div className="space-y-6 overflow-x-auto">
        {pages.map((pagePanels, pageIdx) => (
          <div key={`page-${pageIdx}`} className="min-w-0">
            <p className="text-[10px] text-[#A855F7] font-mono uppercase mb-2 flex items-center gap-1">
              <FileImage className="w-3 h-3" />
              {t("manga_page_n", { n: pageIdx + 1 })} · {catalog.pageLayouts.find((l) => l.id === project.pageLayout)?.label}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {pagePanels.map((panel, i) => {
                const char = project.characters?.find((c) => c.id === panel.characterId);
                const pose = catalog.poses.find((p) => p.id === panel.poseId);
                return (
                  <div key={panel.id} className="flex items-center gap-2">
                    {i > 0 && (
                      <div
                        className="w-6 h-0.5 shrink-0"
                        style={{ background: EDGE.sequence }}
                        title={t("manga_edge_sequence")}
                      />
                    )}
                    <NodeCard
                      color={EDGE.emotion}
                      icon={Layers}
                      title={t("manga_panel_n", { n: panel.order + 1 })}
                      sub={`${char?.name || "—"} ${pose?.emoji || ""}`}
                      badge={t("manga_node_panel")}
                      active={activePanelId === panel.id}
                      onClick={() => onSelectPanel(panel.id)}
                    />
                    {panel.resultUrl && (
                      <img
                        src={panel.resultUrl}
                        alt=""
                        className="w-8 h-10 rounded object-cover border border-[#2E2E30] shrink-0 hidden sm:block"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#5A5A5E] mt-4 italic">{t("manga_story_legend")}</p>
      <div className="flex flex-wrap gap-3 mt-2 text-[9px]">
        <span><span className="inline-block w-3 h-0.5 align-middle mr-1" style={{ background: EDGE.scene }} /> {t("manga_edge_scene")}</span>
        <span><span className="inline-block w-3 h-0.5 align-middle mr-1" style={{ background: EDGE.character }} /> {t("manga_edge_character")}</span>
        <span><span className="inline-block w-3 h-0.5 align-middle mr-1" style={{ background: EDGE.sequence }} /> {t("manga_edge_sequence")}</span>
      </div>
    </section>
  );
}
