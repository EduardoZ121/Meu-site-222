import { useCallback, useState, useEffect } from "react";
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

import { useSceneFlowStore } from "./store";
import { nodeTypes } from "./nodes";
import Toolbar from "./Toolbar";
import AddNodeFAB from "./AddNodeFAB";
import NodePanel from "./NodePanel";
import EdgePanel from "./EdgePanel";

export default function SceneFlow() {
  const nodes = useSceneFlowStore((s) => s.nodes);
  const edges = useSceneFlowStore((s) => s.edges);
  const onNodesChange = useSceneFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useSceneFlowStore((s) => s.onEdgesChange);
  const onConnect = useSceneFlowStore((s) => s.onConnect);
  const setSelectedNode = useSceneFlowStore((s) => s.setSelectedNode);
  const setSelectedEdge = useSceneFlowStore((s) => s.setSelectedEdge);
  const selectedNodeId = useSceneFlowStore((s) => s.selectedNodeId);
  const selectedEdgeId = useSceneFlowStore((s) => s.selectedEdgeId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("rp_scene_flow_tutorial_seen")) {
      setShowTutorial(true);
    }
  }, []);

  const onNodeClick = useCallback((_, node) => setSelectedNode(node.id), [setSelectedNode]);
  const onEdgeClick = useCallback((_, edge) => setSelectedEdge(edge.id), [setSelectedEdge]);
  const onPaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); }, [setSelectedNode, setSelectedEdge]);

  const handleGenerate = async () => {
    if (nodes.length === 0) return;
    setIsGenerating(true);
    try {
      // Compose graph → prompt (placeholder until backend is wired)
      const payload = {
        nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
        edges: edges.map((e) => ({ source: e.source, target: e.target, data: e.data })),
        globalSettings: useSceneFlowStore.getState().globalSettings,
      };
      // eslint-disable-next-line no-console
      console.log("[SceneFlow] generate payload:", payload);
      await new Promise((r) => setTimeout(r, 1200));
      alert("Cena composta. Backend de geração será ligado em seguida.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full bg-[#0B0B0C]" style={{ height: "calc(100dvh - 56px)" }} data-testid="scene-flow-page">
      <Toolbar onGenerate={handleGenerate} isGenerating={isGenerating} />

      <div className="absolute inset-0 pt-[52px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          fitView
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep", animated: true, style: { stroke: "#7C3AED", strokeWidth: 2 } }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1F1F23" />
          <Controls
            style={{ background: "#16161A", border: "1px solid #2E2E30", borderRadius: 8, padding: 4 }}
            showInteractive={false}
          />
          <MiniMap
            style={{ background: "#0F0F11", border: "1px solid #2E2E30", borderRadius: 8 }}
            nodeColor="#7C3AED" maskColor="rgba(11,11,12,0.85)"
          />
        </ReactFlow>
      </div>

      <AddNodeFAB />

      {selectedNodeId && <NodePanel />}
      {selectedEdgeId && !selectedNodeId && <EdgePanel />}

      {showTutorial && nodes.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0B0B0C]/85 backdrop-blur-sm p-6" data-testid="tutorial-overlay">
          <div className="max-w-md bg-[#16161A] border border-[#2E2E30] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎬</span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Bem-vindo ao Scene Flow</h2>
            <p className="text-[#9CA3AF] text-sm mb-6 leading-relaxed">
              Cria cenas de mangá/comic ligando <strong className="text-white">caixas</strong>:
              personagens, cenários, objetos, efeitos e câmera.
              Liga-os com <strong className="text-white">relações</strong> e a IA compõe a imagem por ti.
            </p>
            <div className="text-left space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <span className="w-6 h-6 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold">1</span>
                Clica no <strong className="text-white">+</strong> para adicionar uma caixa
              </div>
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <span className="w-6 h-6 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold">2</span>
                Liga as caixas arrastando do ponto direito ao esquerdo
              </div>
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <span className="w-6 h-6 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold">3</span>
                Carrega em <strong className="text-white">Gerar</strong>
              </div>
            </div>
            <button
              onClick={() => { localStorage.setItem("rp_scene_flow_tutorial_seen", "1"); setShowTutorial(false); }}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors w-full"
              data-testid="tutorial-start"
            >
              Começar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
