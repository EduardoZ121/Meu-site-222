import { useMemo, useState } from "react";
import { Plus, Trash2, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { getMangaStudioCatalog } from "../../lib/mangaStudioCatalog";
import { emptyPanel, PANEL_ASPECTS } from "../../lib/mangaStudioData";
import MangaUploadZone from "./MangaUploadZone";

const PANELS_PER_PAGE = 4;

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
  onGeneratePage,
  pageGenCost,
  busy,
}) {
  const { t } = useI18n();
  const catalog = useMemo(() => getMangaStudioCatalog(t), [t]);
  const panels = [...(project.panels || [])].sort((a, b) => a.order - b.order);
  const layout = project.pageLayout || "horizontal";
  const totalPages = Math.max(1, Math.ceil(panels.length / PANELS_PER_PAGE));
  const [pageIndex, setPageIndex] = useState(0);
  const safePage = Math.min(pageIndex, totalPages - 1);

  const pagePanels = panels.slice(
    safePage * PANELS_PER_PAGE,
    safePage * PANELS_PER_PAGE + PANELS_PER_PAGE,
  );

  const patchPanels = (next) => onChange({ ...project, panels: next });

  const addPanel = () => {
    const p = emptyPanel(panels.length);
    patchPanels([...panels, p]);
    onSelectPanel(p.id);
    setPageIndex(Math.floor(panels.length / PANELS_PER_PAGE));
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

  const pageThumbs = project.pageThumbs || {};

  return (
    <section
      className="manga-canvas rounded-2xl border border-[rgba(147,51,234,0.25)] bg-[#0D0D12] p-3 sm:p-4 min-h-0"
      data-testid="manga-canvas"
    >
      <div className="manga-page-nav">
        <button
          type="button"
          className="manga-page-nav-btn"
          disabled={safePage <= 0}
          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          aria-label={t("manga_page_prev")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center flex-1 min-w-0">
          <h2 className="text-white text-[14px] font-semibold">
            {t("manga_page_of", { current: safePage + 1, total: totalPages })}
          </h2>
          <p className="text-[11px] text-[#5A5A5E]">{t("manga_page_ratio_hint")}</p>
        </div>
        <button
          type="button"
          className="manga-page-nav-btn"
          disabled={safePage >= totalPages - 1}
          onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
          aria-label={t("manga_page_next")}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <div className="manga-chip-scroll">
          {catalog.pageLayouts.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onChange({ ...project, pageLayout: l.id })}
              className={cn("manga-pill shrink-0", layout === l.id && "manga-pill--active")}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#5A5A5E] mt-2 lg:hidden">{t("manga_page_editor_hint")}</p>
        <p className="text-[11px] text-[#22C55E] mt-1">{t("manga_read_order_legend")}</p>
      </div>

      <div className={cn(layoutGrid, "mb-3 sm:mb-4")}>
        {pagePanels.map((panel) => {
          const globalIndex = panels.findIndex((p) => p.id === panel.id);
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
              <span className="manga-read-order-badge">
                {globalIndex + 1}
              </span>
              {panel.resultUrl ? (
                <img src={panel.resultUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#13131A] to-[#0B0B0C] p-2 flex flex-col justify-end">
                  <div className="space-y-0.5 text-[9px] text-[#9CA3AF]">
                    <p>{char?.name || t("manga_no_character")}</p>
                    <p>{scene?.name || t("manga_no_scenario")}</p>
                    {panel.balloonText && (
                      <p className="italic text-[#C4B5FD] truncate">"{panel.balloonText}"</p>
                    )}
                  </div>
                </div>
              )}
              <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 px-1 rounded text-[#F4F1EA]">
                {panel.aspect}
              </span>
            </button>
          );
        })}
      </div>

      <div className="manga-canvas-toolbar flex flex-wrap gap-2 items-center border-t border-[#2E2E30] pt-3">
        <button type="button" onClick={addPanel} className="manga-chip-btn min-h-[44px]">
          <Plus className="w-3.5 h-3.5" /> {t("manga_add_panel")}
        </button>
        {activePanelId && (
          <>
            <button
              type="button"
              onClick={() => removePanel(activePanelId)}
              className="manga-chip-btn text-red-400/90 min-h-[44px]"
              disabled={panels.length <= 1}
            >
              <Trash2 className="w-3.5 h-3.5" /> {t("manga_remove")}
            </button>
            <button
              type="button"
              onClick={() => movePanel(activePanelId, -1)}
              className="manga-chip-btn min-h-[44px]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => movePanel(activePanelId, 1)}
              className="manga-chip-btn min-h-[44px]"
            >
              →
            </button>
            <select
              className="field-input text-[14px] py-2 min-h-[44px] max-w-[120px]"
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
          </>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <MangaUploadZone
          label={t("manga_upload_page_png")}
          hint={t("manga_upload_page_hint")}
          onFile={({ url }) => {
            onChange({
              ...project,
              pageThumbs: { ...pageThumbs, [safePage]: url },
            });
          }}
        />
        {pageThumbs[safePage] && (
          <img
            src={pageThumbs[safePage]}
            alt=""
            className="w-full max-h-32 object-contain rounded-lg border border-[#2E2E30]"
          />
        )}
        {onGeneratePage && (
          <button
            type="button"
            disabled={busy}
            onClick={onGeneratePage}
            className="manga-cta-btn w-full min-h-[48px]"
          >
            {busy ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {t("manga_gen_page_btn", { n: pageGenCost ?? 40 })}
          </button>
        )}
      </div>
    </section>
  );
}
