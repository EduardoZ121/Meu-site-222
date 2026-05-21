import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  LayoutGrid,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { useFlowStore } from "./useFlowStore";
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from "./types";
import { getStorySequence } from "./storyAnalysis";
import { BORDER_STYLES, PAGE_LAYOUTS, READING_ORDERS, layoutMeta } from "./pageDefaults";
import { buildPagePromptFromFlow } from "./pageUtils";
import UploadField from "./UploadField";

function PageSlot({
  index,
  nodeId,
  node,
  panelConfig,
  layoutId,
  onSelect,
  onClear,
  onEditPanel,
  readingOrder,
}) {
  const meta = layoutMeta(layoutId);
  const orderNum =
    readingOrder === "rtl"
      ? meta.slots - index
      : readingOrder === "ttb"
        ? index + 1
        : index + 1;

  return (
    <button
      type="button"
      className={`mf-page-slot ${nodeId ? "mf-page-slot--filled" : ""}`}
      onClick={() => (nodeId ? onEditPanel(nodeId) : onSelect(index))}
    >
      <span className="mf-page-slot-order">{orderNum}</span>
      {node ? (
        <>
          <span className="mf-page-slot-type" style={{ color: NODE_COLORS[node.data.flowType] }}>
            {NODE_ICONS[node.data.flowType]}
          </span>
          <span className="mf-page-slot-name">{node.data.name || NODE_LABELS[node.data.flowType]}</span>
          {(panelConfig?.resultUrl || node.data.avatarUrl || node.data.backgroundUrl) && (
            <img
              src={panelConfig?.resultUrl || node.data.avatarUrl || node.data.backgroundUrl}
              alt=""
              className="mf-page-slot-img"
            />
          )}
          <button
            type="button"
            className="mf-page-slot-clear"
            onClick={(e) => {
              e.stopPropagation();
              onClear(index);
            }}
          >
            ×
          </button>
        </>
      ) : (
        <span className="mf-page-slot-empty">+ Painel</span>
      )}
    </button>
  );
}

export default function PageTab({
  busy,
  pageCost,
  onGeneratePage,
  onGoToFlow,
  onGoToPanel,
}) {
  const { t } = useI18n();

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const story = useFlowStore((s) => s.story);
  const panels = useFlowStore((s) => s.panels);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const pageState = useFlowStore((s) => s.pageState);
  const ensurePagesInitialized = useFlowStore((s) => s.ensurePagesInitialized);
  const setActivePage = useFlowStore((s) => s.setActivePage);
  const updatePage = useFlowStore((s) => s.updatePage);
  const setPageLayout = useFlowStore((s) => s.setPageLayout);
  const setPageSlot = useFlowStore((s) => s.setPageSlot);
  const addPage = useFlowStore((s) => s.addPage);
  const removePage = useFlowStore((s) => s.removePage);
  const autoFillPagesFromStory = useFlowStore((s) => s.autoFillPagesFromStory);
  const getPanelConfig = useFlowStore((s) => s.getPanelConfig);

  const [pickSlot, setPickSlot] = useState(null);

  useEffect(() => {
    ensurePagesInitialized();
  }, [nodes.length, ensurePagesInitialized]);

  const sequence = useMemo(
    () => getStorySequence(nodes, edges, story.manualSequence),
    [nodes, edges, story.manualSequence],
  );

  const items = pageState.items || [];
  const activePage = items.find((p) => p.id === pageState.activePageId) || items[0];
  const activeIndex = items.findIndex((p) => p.id === activePage?.id);

  const meta = activePage ? layoutMeta(activePage.layout) : layoutMeta("horizontal");

  const promptPreview = useMemo(() => {
    if (!activePage) return "";
    const getCfg = (id) => ({ ...getPanelConfig(id), ...panels[id] });
    return buildPagePromptFromFlow(activePage, nodes, globalSettings, getCfg);
  }, [activePage, nodes, globalSettings, panels, getPanelConfig]);

  const filledCount = activePage?.slotNodeIds?.filter(Boolean).length || 0;

  const goPage = (delta) => {
    if (!items.length) return;
    const i = (activeIndex + delta + items.length) % items.length;
    setActivePage(items[i].id);
  };

  const assignFromStory = (nodeId) => {
    if (!activePage || pickSlot == null) return;
    setPageSlot(activePage.id, pickSlot, nodeId);
    setPickSlot(null);
    toast.success("Painel colocado na página");
  };

  const copyPrompt = async () => {
    if (!promptPreview) return;
    await navigator.clipboard.writeText(promptPreview);
    toast.success("Prompt da página copiado");
  };

  if (!sequence.length) {
    return (
      <div className="mf-page-tab">
        <div className="mf-panel-hero">
          <h2>{t("manga_page_editor")}</h2>
          <p>{t("manga_page_editor_hint")}</p>
        </div>
        <div className="mf-empty">
          <p>Cria a história no Flow primeiro — depois organiza em páginas aqui.</p>
          <button type="button" className="mf-btn mf-btn--primary mt-2" onClick={onGoToFlow}>
            <Workflow className="w-4 h-4" />
            Ir ao Flow
          </button>
        </div>
      </div>
    );
  }

  if (!activePage) return null;

  return (
    <div className="mf-page-tab" data-testid="manga-flow-page-tab">
      <div className="mf-page-hero">
        <div>
          <p className="mf-story-eyebrow">{t("manga_page_editor")}</p>
          <h2 className="mf-story-title">
            {t("manga_page_of", { current: activeIndex + 1, total: items.length })}
          </h2>
          <p className="mf-story-sub">{activePage.title} · {filledCount}/{meta.slots} painéis</p>
        </div>
        <div className="mf-panel-hero-nav">
          <button type="button" className="mf-btn" onClick={() => goPage(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button type="button" className="mf-btn" onClick={() => goPage(1)}>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" className="mf-btn" onClick={addPage}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mf-page-strip">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`mf-panel-thumb ${p.id === activePage.id ? "mf-panel-thumb--on" : ""}`}
            onClick={() => setActivePage(p.id)}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{t("manga_page_n", { n: i + 1 })}</span>
            <span className="text-[0.6rem]">{p.slotNodeIds?.filter(Boolean).length || 0} p</span>
          </button>
        ))}
      </div>

      <div className="mf-page-toolbar">
        <div className="mf-chips">
          {PAGE_LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`mf-chip ${activePage.layout === l.id ? "mf-chip--on" : ""}`}
              onClick={() => setPageLayout(activePage.id, l.id)}
            >
              {l.icon} {l.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="mf-btn" onClick={autoFillPagesFromStory}>
            Auto-organizar história
          </button>
          <button type="button" className="mf-btn" onClick={onGoToFlow}>
            <Workflow className="w-4 h-4" />
            Flow
          </button>
          <button
            type="button"
            className="mf-btn mf-btn--primary"
            disabled={busy || filledCount < 1}
            onClick={() => onGeneratePage?.(activePage.id)}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t("manga_gen_page_btn", { n: pageCost ?? 40 })}
          </button>
        </div>
      </div>

      <div className="mf-page-grid-layout">
        <div
          className="mf-page-mockup"
          style={{
            background: activePage.background || "#f8f8fc",
            gap: `${activePage.gutter ?? 10}px`,
            padding: `${activePage.margin ?? 14}px`,
          }}
          data-layout={activePage.layout}
        >
          <div
            className="mf-page-mockup-grid"
            style={{
              gridTemplateColumns: `repeat(${meta.cols}, 1fr)`,
              gridTemplateRows: `repeat(${meta.rows}, 1fr)`,
              gap: `${activePage.gutter ?? 10}px`,
            }}
          >
            {(activePage.slotNodeIds || []).map((nodeId, i) => {
              const node = nodes.find((n) => n.id === nodeId);
              const cfg = nodeId ? { ...getPanelConfig(nodeId), ...panels[nodeId] } : null;
              return (
                <PageSlot
                  key={i}
                  index={i}
                  nodeId={nodeId}
                  node={node}
                  panelConfig={cfg}
                  layoutId={activePage.layout}
                  readingOrder={activePage.readingOrder}
                  onSelect={(idx) => {
                    setPickSlot(idx);
                    toast.info("Escolhe um passo da história abaixo");
                  }}
                  onClear={(idx) => setPageSlot(activePage.id, idx, null)}
                  onEditPanel={(nid) => {
                    useFlowStore.getState().setActivePanel(nid);
                    onGoToPanel?.(nid);
                  }}
                />
              );
            })}
          </div>
          {activePage.resultUrl && (
            <img src={activePage.resultUrl} alt="" className="mf-page-result-overlay" />
          )}
        </div>

        <aside className="mf-page-side">
          <div className="mf-card mf-card--pad mb-2">
            <h3 className="text-white font-semibold text-[0.85rem] mb-2">Definições da página</h3>
            <input
              className="mf-field"
              value={activePage.title || ""}
              onChange={(e) => updatePage(activePage.id, { title: e.target.value })}
              placeholder="Título da página"
            />
            <p className="text-[0.7rem] text-[#9ca3af] mt-2">Margem: {activePage.margin ?? 14}px</p>
            <input
              type="range"
              min={4}
              max={32}
              value={activePage.margin ?? 14}
              onChange={(e) => updatePage(activePage.id, { margin: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-[0.7rem] text-[#9ca3af]">Gutter: {activePage.gutter ?? 10}px</p>
            <input
              type="range"
              min={0}
              max={24}
              value={activePage.gutter ?? 10}
              onChange={(e) => updatePage(activePage.id, { gutter: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-[0.7rem] text-[#9ca3af] mb-1">Ordem de leitura</p>
            <div className="mf-chips">
              {READING_ORDERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`mf-chip ${activePage.readingOrder === r.id ? "mf-chip--on" : ""}`}
                  onClick={() => updatePage(activePage.id, { readingOrder: r.id })}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-[0.7rem] text-[#9ca3af] mb-1 mt-2">Estilo de borda</p>
            <div className="mf-chips flex-wrap">
              {BORDER_STYLES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`mf-chip ${activePage.borderStyle === b.id ? "mf-chip--on" : ""}`}
                  onClick={() => updatePage(activePage.id, { borderStyle: b.id })}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-[0.7rem] text-[#9ca3af] mt-2">Fundo da página</p>
            <input
              type="color"
              className="mf-color-input w-full h-10"
              value={activePage.background?.startsWith("#") ? activePage.background : "#f8f8fc"}
              onChange={(e) => updatePage(activePage.id, { background: e.target.value })}
            />
            <UploadField
              label={t("manga_upload_page_png")}
              hint={t("manga_upload_page_hint")}
              onFile={({ url }) => updatePage(activePage.id, { referenceUrl: url })}
            />
            <textarea
              className="mf-field min-h-[64px] mt-2"
              placeholder="Notas para esta página (composição, ritmo…)"
              value={activePage.pageNotes || ""}
              onChange={(e) => updatePage(activePage.id, { pageNotes: e.target.value })}
            />
            {items.length > 1 && (
              <button
                type="button"
                className="mf-btn w-full mt-2"
                onClick={() => {
                  removePage(activePage.id);
                  toast.success("Página removida");
                }}
              >
                <Trash2 className="w-4 h-4" />
                Remover página
              </button>
            )}
          </div>

          <div className="mf-card mf-card--pad">
            <h3 className="text-white font-semibold text-[0.85rem] mb-2">
              Passos da história {pickSlot != null ? `(slot ${pickSlot + 1})` : ""}
            </h3>
            <p className="text-[0.7rem] text-[#9ca3af] mb-2">{t("manga_page_ratio_hint")}</p>
            <div className="mf-page-story-picks">
              {sequence.map((node, i) => (
                <button
                  key={node.id}
                  type="button"
                  className="mf-page-story-pick"
                  onClick={() => assignFromStory(node.id)}
                >
                  <span className="text-[#22c55e] font-bold">{i + 1}</span>
                  {NODE_ICONS[node.data.flowType]} {node.data.name || NODE_LABELS[node.data.flowType]}
                </button>
              ))}
            </div>
          </div>

          <div className="mf-card mf-card--pad mt-2">
            <h3 className="text-white font-semibold text-[0.85rem] mb-2">{t("manga_prompt_preview")}</h3>
            <pre className="mf-prompt-preview">{promptPreview || "—"}</pre>
            <button type="button" className="mf-btn w-full mt-2" onClick={copyPrompt}>
              <Copy className="w-4 h-4" />
              Copiar
            </button>
          </div>
        </aside>
      </div>

      <p className="text-[0.7rem] text-[#5a5a5e] mt-2 text-center">{t("manga_page_editor_hint")}</p>
    </div>
  );
}
