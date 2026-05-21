import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { orderNodesByFlow } from "./buildFlowPrompt";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FlowNode from "./FlowNode";
import FlowEdge from "./FlowEdge";
import { useFlowStore } from "./useFlowStore";
import { NODE_COLORS } from "./types";

const nodeTypes = { flowNode: FlowNode };
const edgeTypes = { flowEdge: FlowEdge };

function CanvasInner({ onAddMenu }) {
  const wrapRef = useRef(null);
  const [previewIdx, setPreviewIdx] = useState(-1);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const selectNode = useFlowStore((s) => s.selectNode);
  const panMode = useFlowStore((s) => s.panMode);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);

  const onNodeClick = useCallback(
    (_, node) => selectNode(node.id),
    [selectNode],
  );

  const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

  const runPreview = useCallback(() => {
    const ordered = orderNodesByFlow(nodes, edges);
    if (!ordered.length) {
      toast.error("Adiciona caixas ao canvas primeiro");
      return;
    }
    const next = (previewIdx + 1) % ordered.length;
    setPreviewIdx(next);
    const node = ordered[next];
    selectNode(node.id);
    setCenter(node.position.x + 120, node.position.y + 60, { zoom: 1, duration: 400 });
    toast.info(`Preview ${next + 1}/${ordered.length}: ${node.data.name || node.data.flowType}`);
  }, [nodes, edges, previewIdx, selectNode, setCenter]);

  return (
    <div className="mf-canvas-wrap" ref={wrapRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnDrag={panMode}
        selectionOnDrag={!panMode}
        nodesDraggable={!panMode}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: "flowEdge" }}
      >
        <Background gap={20} size={1} color="#2d2d44" style={{ opacity: 0.3 }} />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.data?.flowType] || "#8B5CF6"}
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: "#111118" }}
        />
        <Controls showInteractive={false} />
        <Panel position="bottom-left" className="text-[0.7rem] text-[#5a5a5e]">
          Mini-map · {nodes.length} caixas
        </Panel>
      </ReactFlow>

      <div className="mf-fab-col">
        <button type="button" className="mf-fab mf-fab--primary" onClick={onAddMenu} title="Adicionar caixa">
          +
        </button>
        <button
          type="button"
          className="mf-fab"
          onClick={() => useFlowStore.getState().setPanMode(!panMode)}
          title="Pan"
        >
          🖐️
        </button>
        <button type="button" className="mf-fab" onClick={() => zoomIn()} title="Zoom in">
          🔍+
        </button>
        <button type="button" className="mf-fab" onClick={() => zoomOut()} title="Zoom out">
          🔍-
        </button>
        <button type="button" className="mf-fab" onClick={() => fitView({ padding: 0.2 })} title="Fit">
          ⊘
        </button>
        <button type="button" className="mf-fab" title="Preview" onClick={runPreview}>
          ▶️
        </button>
      </div>
    </div>
  );
}

export default function FlowCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
