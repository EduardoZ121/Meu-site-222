import { useState } from "react";
import { useFlowStore } from "./useFlowStore";
import FlowCanvas from "./FlowCanvas";
import NodeEditor from "./NodeEditor";
import EdgeInspector from "./EdgeInspector";
import PromptEnhancement from "./PromptEnhancement";
import StudioSidebar from "./StudioSidebar";
import SceneTabs from "./SceneTabs";

export default function StudioWorkspace({ busy, genCost, onGenerate }) {
  const [mobilePanel, setMobilePanel] = useState("node");
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const nodes = useFlowStore((s) => s.nodes);
  const viewportZoom = useFlowStore((s) => s.viewportZoom);
  const panMode = useFlowStore((s) => s.panMode);
  const getResolvedOutputMode = useFlowStore((s) => s.getResolvedOutputMode);

  const showInspector = selectedEdgeId ? "edge" : "node";

  return (
    <div className="as-workspace">
      <PromptEnhancement />
      <div className="as-workspace-meta">
        <SceneTabs />
        <div className="as-workspace-stats">
          <span>{Math.round((viewportZoom || 1) * 100)}%</span>
          <span>{nodes.length} elementos</span>
          <span>{getResolvedOutputMode?.() || "auto"}</span>
          <span>{genCost} créditos</span>
          {panMode && <span className="as-badge-pan">Pan</span>}
        </div>
      </div>

      <div className="as-workspace-grid">
        <StudioSidebar />

        <div className="as-canvas-wrap">
          <FlowCanvas />
        </div>

        <aside className="as-inspector hidden lg:flex lg:flex-col">
          <div className="as-inspector-tabs">
            <button
              type="button"
              className={showInspector === "node" ? "as-inspector-tab as-inspector-tab--on" : "as-inspector-tab"}
              onClick={() => useFlowStore.getState().selectEdge(null)}
            >
              Elemento
            </button>
            <button
              type="button"
              className={showInspector === "edge" ? "as-inspector-tab as-inspector-tab--on" : "as-inspector-tab"}
              disabled={!selectedEdgeId}
            >
              Ligação
            </button>
          </div>
          <div className="as-inspector-body">
            {selectedEdgeId ? <EdgeInspector /> : <NodeEditor />}
          </div>
        </aside>
      </div>

      {(selectedNodeId || selectedEdgeId) && (
        <div className="as-mobile-inspector lg:hidden">
          <div className="as-inspector-tabs">
            <button
              type="button"
              className={mobilePanel === "node" ? "as-inspector-tab as-inspector-tab--on" : "as-inspector-tab"}
              onClick={() => {
                setMobilePanel("node");
                useFlowStore.getState().selectEdge(null);
              }}
            >
              Elemento
            </button>
            <button
              type="button"
              className={mobilePanel === "edge" ? "as-inspector-tab as-inspector-tab--on" : "as-inspector-tab"}
              onClick={() => setMobilePanel("edge")}
            >
              Ligação
            </button>
          </div>
          <div className="as-inspector-body">
            {mobilePanel === "edge" && selectedEdgeId ? <EdgeInspector /> : <NodeEditor />}
          </div>
        </div>
      )}
    </div>
  );
}
