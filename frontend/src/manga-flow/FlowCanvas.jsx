import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
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
import { orderNodesByFlow } from "./buildFlowPrompt";

const nodeTypes = { flowNode: FlowNode };
const edgeTypes = { flowEdge: FlowEdge };

function CanvasInner({ onAddType }) {
  const wrapRef = useRef(null);
  const [previewIdx, setPreviewIdx] = useState(-1);
  const { fitView, zoomIn, zoomOut, setCenter, screenToFlowPosition } = useReactFlow();

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const selectNode = useFlowStore((s) => s.selectNode);
  const selectEdge = useFlowStore((s) => s.selectEdge);
  const panMode = useFlowStore((s) => s.panMode);
  const addNode = useFlowStore((s) => s.addNode);
  const setViewportZoom = useFlowStore((s) => s.setViewportZoom);
  const setEdgesGenerating = useFlowStore((s) => s.setEdgesGenerating);

  const onNodeClick = useCallback(
    (_, node) => {
      selectNode(node.id);
      selectEdge(null);
    },
    [selectNode, selectEdge],
  );

  const onEdgeClick = useCallback(
    (_, edge) => {
      selectEdge(edge.id);
      selectNode(null);
    },
    [selectEdge, selectNode],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  const onMoveEnd = useCallback(
    (_, viewport) => {
      setViewportZoom(viewport.zoom);
    },
    [setViewportZoom],
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/mangaflow");
      if (!type) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(type, pos);
      toast.success("Caixa adicionada");
    },
    [addNode, screenToFlowPosition],
  );

  const runPreview = useCallback(() => {
    const ordered = orderNodesByFlow(nodes, edges);
    if (!ordered.length) {
      toast.error("Adiciona caixas ao canvas primeiro");
      return;
    }
    setEdgesGenerating(true);
    const next = (previewIdx + 1) % ordered.length;
    setPreviewIdx(next);
    const node = ordered[next];
    selectNode(node.id);
    setCenter(node.position.x + 140, node.position.y + 80, { zoom: 1, duration: 400 });
    toast.info(`Preview ${next + 1}/${ordered.length}: ${node.data.name || node.data.flowType}`);
    setTimeout(() => setEdgesGenerating(false), 1200);
  }, [nodes, edges, previewIdx, selectNode, setCenter, setEdgesGenerating]);

  return (
    <div className="mf-canvas-wrap mf-canvas-wrap--flow" ref={wrapRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onMoveEnd={onMoveEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        panOnDrag={panMode ? true : [1, 2]}
        panOnScroll
        zoomOnScroll
        selectionOnDrag={!panMode}
        nodesDraggable={!panMode}
        nodesConnectable={!panMode}
        elementsSelectable
        minZoom={0.15}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: "flowEdge", animated: false }}
        connectionLineStyle={{ stroke: "#8b5cf6", strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#2d2d44" style={{ opacity: 0.35 }} />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.data?.flowType] || "#8B5CF6"}
          maskColor="rgba(0,0,0,0.65)"
          className="mf-minimap"
          pannable
          zoomable
        />
        <Controls showInteractive={false} className="mf-flow-controls" />
        <Panel position="top-center" className="mf-canvas-hint">
          {nodes.length === 0
            ? "Arrasta uma caixa da paleta ou usa + para começar"
            : `${nodes.length} caixas · ${edges.length} ligações`}
        </Panel>
      </ReactFlow>

      <div className="mf-fab-col">
        <button
          type="button"
          className="mf-fab mf-fab--primary"
          onClick={() => onAddType?.("personagem")}
          title="Adicionar caixa"
        >
          +
        </button>
        <button
          type="button"
          className={`mf-fab ${panMode ? "mf-fab--active" : ""}`}
          onClick={() => useFlowStore.getState().setPanMode(!panMode)}
          title="Pan"
        >
          🖐️
        </button>
        <button type="button" className="mf-fab" onClick={() => zoomIn()} title="Zoom in">
          +
        </button>
        <button type="button" className="mf-fab" onClick={() => zoomOut()} title="Zoom out">
          −
        </button>
        <button type="button" className="mf-fab" onClick={() => fitView({ padding: 0.25, duration: 300 })} title="Fit">
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
