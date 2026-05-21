import { useMemo } from "react";
import { Plus, Trash2, ArrowLeftRight, GripVertical } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import { emptyPanel, PANEL_ASPECTS } from "../../lib/mangaStudioData";

const aspectClass = {
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
  "3:4": "aspect-[3/4]",
  "16:9": "aspect-video",
};

export default function MangaPageCanvas({
  project,
  activePanelId,
  onSelectPanel,
  onChange,
}) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  const panels = [...(project.panels || [])].sort((a, b) => a.order - b.order);
  const layout = project.pageLayout || "horizontal";

  const patchPanels = (next) => onChange({ ...project, panels: next });

  const addPanel = () => {
    const p = emptyPanel(panels.length);
    patchPanels([...panels, p]);
    onSelectPanel(p.id);
  };

  const removePanel = (id) => {
    if (panels.length <= 1) return;
    const next = panels.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i }));
    patchPanels(next);
    if (activePanelId === id) onSelectPanel(next[0]?.id || null);
  };

  const movePanel = (id, dir) => {
    const idx = panels.findIndex((p) => p.id === id);
    const j = idx + dir;
    if (j < 0 || j >= panels.length) return;
    const copy = [...panels];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    patchPanels(copy.map((p, i) => ({ ...p, order: i })));
  };

  const layoutGrid =
    layout === "grid_2x2"
      ? "manga-panels-grid manga-panels-grid--2x2"
      : layout === "vertical"
        ? "manga-panels-strip manga-panels-strip--vertical"
        : "manga-panels-strip manga-panels-strip--horizontal";

  return (
    <section className="manga-canvas rounded-2xl border border-[rgba(147,51,234,0.25)] bg-[#0D0D12] p-3 sm:p-4 min-h-0 lg:min-h-[420px]" data-testid="manga-canvas">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-white text-[13px] font-semibold tracking-wide mb-2">{t("manga_page_editor")}</h2>
        <p className="text-[10px] text-[#5A5A5E] mb-2 lg:hidden">{t("manga_page_editor_hint")}</p>
        <div className="manga-chip-scroll">
          {catalog.pageLayouts.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onChange({ ...project, pageLayout: l.id })}
              className={cn(
                "manga-pill shrink-0",
                layout === l.id && "manga-pill--active",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(layoutGrid, "mb-3 sm:mb-4")}>
        {panels.map((panel, i) => {
          const active = panel.id === activePanelId;
          const char = project.characters?.find((c) => c.id === panel.characterId);
          const scene = project.scenarios?.find((s) => s.id === panel.scenarioId);
          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => onSelectPanel(panel.id)}
              className={cn(
                "manga-panel-thumb relative rounded-xl border-2 overflow-hidden text-left transition-all",
                aspectClass[panel.aspect] || "aspect-[4/5]",
                active
                  ? "border-[#A855F7] shadow-[0_0_24px_-4px_rgba(168,85,247,0.45)]"
                  : "border-[#2E2E30] hover:border-[#5A5A5E]",
              )}
            >
              {panel.resultUrl ? (
                <img src={panel.resultUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#13131A] to-[#0B0B0C] p-2 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-[#A855F7]">{t("manga_panel_n", { n: i + 1 })}</span>
                  <span className="text-[8px] text-[#5A5A5E]">{panel.aspect}</span>
                  <div className="space-y-0.5 text-[9px] text-[#9CA3AF]">
                    <p>{char?.name || t("manga_no_character")}</p>
                    <p>{scene?.name || t("manga_no_scenario")}</p>
                    {panel.balloonText && (
                      <p className="italic text-[#C4B5FD] truncate">"{panel.balloonText}"</p>
                    )}
                  </div>
                </div>
              )}
              <span className="absolute top-1 right-1 text-[8px] bg-black/60 px-1 rounded text-[#F4F1EA]">
                {panel.aspect}
              </span>
            </button>
          );
        })}
      </div>

      <div className="manga-canvas-toolbar flex flex-wrap gap-2 items-center border-t border-[#2E2E30] pt-3">
        <button type="button" onClick={addPanel} className="manga-chip-btn">
          <Plus className="w-3.5 h-3.5" /> {t("manga_add_panel")}
        </button>
        {activePanelId && (
          <>
            <button
              type="button"
              onClick={() => removePanel(activePanelId)}
              className="manga-chip-btn text-red-400/90"
              disabled={panels.length <= 1}
            >
              <Trash2 className="w-3.5 h-3.5" /> {t("manga_remove")}
            </button>
            <button type="button" onClick={() => movePanel(activePanelId, -1)} className="manga-chip-btn" title={t("manga_move_left")}>
              <ArrowLeftRight className="w-3.5 h-3.5" /> ←
            </button>
            <button type="button" onClick={() => movePanel(activePanelId, 1)} className="manga-chip-btn" title={t("manga_move_right")}>
              <GripVertical className="w-3.5 h-3.5" /> →
            </button>
          </>
        )}
        {activePanelId && (
          <select
            className="ml-auto field-input text-[11px] py-1.5 max-w-[100px]"
            value={panels.find((p) => p.id === activePanelId)?.aspect || "4:5"}
            onChange={(e) => {
              patchPanels(
                panels.map((p) =>
                  p.id === activePanelId ? { ...p, aspect: e.target.value } : p),
              );
            }}
          >
            {PANEL_ASPECTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
      </div>
    </section>
  );
}
