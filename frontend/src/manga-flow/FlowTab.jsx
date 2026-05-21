import { useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { useFlowStore } from "./useFlowStore";
import FlowCanvas from "./FlowCanvas";
import FlowPalette from "./FlowPalette";
import NodeEditor from "./NodeEditor";
import EdgeInspector from "./EdgeInspector";
import PromptEnhancement from "./PromptEnhancement";
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from "./types";

const NODE_TYPES = ["personagem", "cenario", "objeto", "acao", "dialogo", "efeito", "transicao"];

function Chip({ label, active, onClick }) {
  return (
    <button type="button" className={`mf-chip ${active ? "mf-chip--on" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

export default function FlowTab({ busy, genCost, onGenerate, getResolvedOutputMode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("node");

  const globalSettings = useFlowStore((s) => s.globalSettings);
  const setGlobalSettings = useFlowStore((s) => s.setGlobalSettings);
  const addNode = useFlowStore((s) => s.addNode);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const panMode = useFlowStore((s) => s.panMode);
  const viewportZoom = useFlowStore((s) => s.viewportZoom);

  const handleAddType = (type) => {
    const offset = nodes.length * 36;
    addNode(type, { x: 140 + offset, y: 100 + offset });
  };

  const showInspector = selectedEdgeId ? "edge" : "node";

  return (
    <div className="mf-flow-tab">
      <PromptEnhancement />

      <div className="mf-flow-toolbar">
        <div className="mf-flow-toolbar-left">
          <span className="mf-flow-zoom">{Math.round((viewportZoom || 1) * 100)}%</span>
          <span className="mf-flow-meta">
            {nodes.length} caixas · {getResolvedOutputMode?.() || "auto"} · {genCost} cr
          </span>
          {panMode && <span className="mf-flow-badge">🖐️ Pan</span>}
        </div>
        <div className="mf-flow-toolbar-right">
          <button
            type="button"
            className="mf-btn mf-btn--icon"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-expanded={settingsOpen}
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="mf-btn mf-btn--primary"
            disabled={busy || !nodes.length}
            onClick={onGenerate}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            🔄 Gerar · {genCost} cr
          </button>
        </div>
      </div>

      <div className="mf-flow-mobile-palette md:hidden">
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className="mf-chip"
            style={{ borderColor: NODE_COLORS[type] }}
            onClick={() => handleAddType(type)}
          >
            {NODE_ICONS[type]} {NODE_LABELS[type]}
          </button>
        ))}
      </div>

      {settingsOpen && (
        <div className="mf-flow-settings">
          <div className="mf-chips">
            <Chip label="Manga" active={globalSettings.style === "manga"} onClick={() => setGlobalSettings({ style: "manga" })} />
            <Chip label="Comic" active={globalSettings.style === "comic"} onClick={() => setGlobalSettings({ style: "comic" })} />
            <Chip label="Webtoon" active={globalSettings.style === "webtoon"} onClick={() => setGlobalSettings({ style: "webtoon" })} />
            <Chip label="Manhwa" active={globalSettings.style === "manhwa"} onClick={() => setGlobalSettings({ style: "manhwa" })} />
          </div>
          <div className="mf-chips">
            <Chip label="Grok" active={globalSettings.engine === "grok"} onClick={() => setGlobalSettings({ engine: "grok" })} />
            <Chip label="GPT" active={globalSettings.engine === "gpt_image"} onClick={() => setGlobalSettings({ engine: "gpt_image" })} />
          </div>
          <label className="flex items-center gap-2 text-[0.8rem] text-[#c4b5fd]">
            <input
              type="checkbox"
              checked={globalSettings.gptCompose}
              onChange={(e) => setGlobalSettings({ gptCompose: e.target.checked })}
            />
            GPT compõe prompt
          </label>
          <div className="mf-chips">
            <Chip label="Auto" active={globalSettings.outputMode === "auto"} onClick={() => setGlobalSettings({ outputMode: "auto" })} />
            <Chip label="Painel" active={globalSettings.outputMode === "panel"} onClick={() => setGlobalSettings({ outputMode: "panel" })} />
            <Chip label="Página" active={globalSettings.outputMode === "page"} onClick={() => setGlobalSettings({ outputMode: "page" })} />
            <Chip label="Capítulo" active={globalSettings.outputMode === "chapter"} onClick={() => setGlobalSettings({ outputMode: "chapter" })} />
          </div>
        </div>
      )}

      <div className="mf-flow-workspace">
        <FlowPalette onAddType={handleAddType} />

        <div className="mf-flow-canvas-area">
          <FlowCanvas onAddType={handleAddType} />
        </div>

        <aside className="mf-flow-inspector hidden lg:flex lg:flex-col">
          <div className="mf-inspector-tabs">
            <button
              type="button"
              className={showInspector === "node" ? "mf-inspector-tab mf-inspector-tab--on" : "mf-inspector-tab"}
              onClick={() => useFlowStore.getState().selectEdge(null)}
            >
              Caixa
            </button>
            <button
              type="button"
              className={showInspector === "edge" ? "mf-inspector-tab mf-inspector-tab--on" : "mf-inspector-tab"}
              disabled={!selectedEdgeId}
            >
              Ligação
            </button>
          </div>
          <div className="mf-inspector-scroll">
            {selectedEdgeId ? <EdgeInspector /> : <NodeEditor />}
          </div>
        </aside>
      </div>

      {(selectedNodeId || selectedEdgeId) && (
        <div className="mf-flow-mobile-panel lg:hidden">
          <div className="mf-inspector-tabs">
            <button
              type="button"
              className={mobilePanel === "node" ? "mf-inspector-tab mf-inspector-tab--on" : "mf-inspector-tab"}
              onClick={() => {
                setMobilePanel("node");
                useFlowStore.getState().selectEdge(null);
              }}
            >
              Caixa
            </button>
            <button
              type="button"
              className={mobilePanel === "edge" ? "mf-inspector-tab mf-inspector-tab--on" : "mf-inspector-tab"}
              onClick={() => {
                setMobilePanel("edge");
                if (selectedEdgeId) useFlowStore.getState().selectNode(null);
              }}
              disabled={!selectedEdgeId && !edges.length}
            >
              Ligação
            </button>
          </div>
          <div className="mf-inspector-scroll">
            {mobilePanel === "edge" && selectedEdgeId ? <EdgeInspector /> : <NodeEditor />}
          </div>
        </div>
      )}
    </div>
  );
}
