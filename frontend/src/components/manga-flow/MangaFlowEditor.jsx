import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, HelpCircle, Save, FolderOpen, Undo2, Redo2, Grid3X3 } from "lucide-react";
import PersonNode from "./nodes/PersonNode";
import ScenarioNode from "./nodes/ScenarioNode";
import ObjectNode from "./nodes/ObjectNode";
import NodeInspector from "./NodeInspector";
import ConnectionPromptModal from "./ConnectionPromptModal";
import AddNodeMenu from "./AddNodeMenu";
import TutorialOverlay from "./TutorialOverlay";
import { uid, createDefaultProject, saveFlowProject, loadFlowProject } from "./mangaFlowData";
import { toast } from "sonner";

const nodeTypes = { person: PersonNode, scenario: ScenarioNode, object: ObjectNode };

const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  style: { stroke: "#A855F7", strokeWidth: 2.5, filter: "drop-shadow(0 0 4px rgba(168,85,247,0.4))" },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#A855F7", width: 18, height: 18 },
};

const MAX_HISTORY = 40;

export default function MangaFlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [projectName, setProjectName] = useState("Page 1");
  const [projectId, setProjectId] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const historyRef = useRef({ past: [], future: [] });
  const skipHistoryRef = useRef(false);

  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    const h = historyRef.current;
    h.past.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    if (h.past.length > MAX_HISTORY) h.past.shift();
    h.future = [];
  }, [nodes, edges]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    h.future.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    const prev = h.past.pop();
    skipHistoryRef.current = true;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setPendingConnection(null);
    setEditingEdge(null);
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    h.past.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    const next = h.future.pop();
    skipHistoryRef.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);
    setPendingConnection(null);
    setEditingEdge(null);
  }, [nodes, edges, setNodes, setEdges]);

  useEffect(() => {
    const saved = loadFlowProject();
    if (saved) {
      setNodes(saved.nodes || []);
      setEdges(saved.edges || []);
      setProjectName(saved.name || "Page 1");
      setProjectId(saved.id);
    } else {
      const fresh = createDefaultProject();
      setNodes(fresh.nodes);
      setEdges(fresh.edges);
      setProjectName(fresh.name);
      setProjectId(fresh.id);
    }
    if (!localStorage.getItem("manga_flow_tutorial_done")) {
      setShowTutorial(true);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (projectId) {
        saveFlowProject({ id: projectId, name: projectName, nodes, edges });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges, projectId, projectName]);

  const onConnect = useCallback((params) => {
    pushHistory();
    setPendingConnection(params);
  }, [pushHistory]);

  const confirmConnection = useCallback((prompt) => {
    if (editingEdge) {
      pushHistory();
      setEdges((eds) =>
        eds.map((e) =>
          e.id === editingEdge.id
            ? {
                ...e,
                data: { ...e.data, prompt: prompt || "" },
                label: prompt ? (prompt.length > 30 ? `${prompt.slice(0, 28)}…` : prompt) : "",
                labelStyle: { fill: "#C4B5FD", fontSize: 11, fontFamily: "'Inter Tight', sans-serif" },
                labelBgStyle: { fill: "#111118", fillOpacity: 0.92 },
                labelBgPadding: [6, 4],
                labelBgBorderRadius: 6,
              }
            : e
        )
      );
      setEditingEdge(null);
      return;
    }
    if (!pendingConnection) return;
    const edge = {
      ...pendingConnection,
      id: `e_${pendingConnection.source}_${pendingConnection.target}_${Date.now()}`,
      data: { prompt: prompt || "" },
      label: prompt ? (prompt.length > 30 ? `${prompt.slice(0, 28)}…` : prompt) : "",
      labelStyle: { fill: "#C4B5FD", fontSize: 11, fontFamily: "'Inter Tight', sans-serif" },
      labelBgStyle: { fill: "#111118", fillOpacity: 0.92 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 6,
    };
    setEdges((eds) => addEdge(edge, eds));
    setPendingConnection(null);
  }, [pendingConnection, editingEdge, setEdges, pushHistory]);

  const onEdgeClick = useCallback(
    (_, edge) => {
      pushHistory();
      const src = nodes.find((n) => n.id === edge.source);
      const tgt = nodes.find((n) => n.id === edge.target);
      setEditingEdge({ ...edge, _srcNode: src, _tgtNode: tgt });
    },
    [nodes, pushHistory]
  );

  const cancelConnectionModal = useCallback(() => {
    setPendingConnection(null);
    setEditingEdge(null);
  }, []);

  const addNode = useCallback(
    (type) => {
      pushHistory();
      const id = uid(type.slice(0, 4));
      const centerX = 250 + Math.random() * 200;
      const centerY = 150 + Math.random() * 200;
      const colors = {
        person: { bg: "rgba(147,51,234,0.15)", border: "#9333EA" },
        scenario: { bg: "rgba(20,184,166,0.15)", border: "#14B8A6" },
        object: { bg: "rgba(250,204,21,0.15)", border: "#FACC15" },
      };
      const defaults = {
        person: {
          name: "",
          pose: "talk",
          emotion: "normal",
          speech: "",
          speechType: "speech",
          clothing: "",
          refImage: null,
          refImageUrl: null,
        },
        scenario: {
          name: "",
          timeOfDay: "day",
          weather: "clear",
          mood: "neutral",
          description: "",
          refImage: null,
          refImageUrl: null,
        },
        object: {
          name: "",
          description: "",
          size: "medium",
          refImage: null,
          refImageUrl: null,
        },
      };
      const newNode = {
        id,
        type,
        position: { x: centerX, y: centerY },
        data: { ...defaults[type], _color: colors[type] },
      };
      setNodes((nds) => [...nds, newNode]);
      setShowAddMenu(false);
      setSelectedNode(id);
      toast.success(type === "person" ? "Character added" : type === "scenario" ? "Scenario added" : "Object added");
    },
    [setNodes, pushHistory]
  );

  const deleteNode = useCallback(
    (id) => {
      pushHistory();
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      if (selectedNode === id) setSelectedNode(null);
      toast.message("Card removed");
    },
    [setNodes, setEdges, selectedNode, pushHistory]
  );

  const updateNodeData = useCallback((id, data) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)));
  }, [setNodes]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeDragStop = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const selectedNodeObj = useMemo(() => nodes.find((n) => n.id === selectedNode), [nodes, selectedNode]);
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter((e) => e.source === selectedNode || e.target === selectedNode);
  }, [edges, selectedNode]);

  const handleNewProject = () => {
    pushHistory();
    const name = window.prompt("Project name:", "New Page");
    if (name === null) return;
    const fresh = createDefaultProject(name || "New Page");
    setNodes(fresh.nodes);
    setEdges(fresh.edges);
    setProjectName(fresh.name);
    setProjectId(fresh.id);
    setSelectedNode(null);
    toast.success("New project created");
  };

  const handleSave = () => {
    saveFlowProject({ id: projectId, name: projectName, nodes, edges });
    toast.success("Project saved");
  };

  return (
    <div className="manga-flow-root" data-testid="manga-flow-editor">
      <div className="manga-flow-topbar">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#9333EA]/20 border border-[#9333EA]/40 flex items-center justify-center text-sm shrink-0">🎌</div>
          <div className="min-w-0">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="manga-flow-project-name"
              data-testid="manga-flow-project-name"
            />
            <p className="text-[10px] text-[#5A5A5E] font-mono uppercase tracking-wider">Manga Flow Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => setShowAddMenu(true)} className="manga-flow-btn manga-flow-btn-primary" data-testid="manga-flow-add-btn">
            <Plus className="w-4 h-4" /> Add Card
          </button>
          <button type="button" onClick={undo} className="manga-flow-btn" title="Undo" data-testid="manga-flow-undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={redo} className="manga-flow-btn" title="Redo" data-testid="manga-flow-redo">
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`manga-flow-btn ${snapToGrid ? "manga-flow-btn--active" : ""}`}
            title="Snap to grid"
            data-testid="manga-flow-snap"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button type="button" onClick={handleSave} className="manga-flow-btn" data-testid="manga-flow-save" title="Save">
            <Save className="w-4 h-4" />
          </button>
          <button type="button" onClick={handleNewProject} className="manga-flow-btn" data-testid="manga-flow-new" title="New project">
            <FolderOpen className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setShowTutorial(true)} className="manga-flow-btn manga-flow-btn-help" data-testid="manga-flow-help" title="Help">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="manga-flow-canvas-wrap">
        <div className="manga-flow-canvas" data-testid="manga-flow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            minZoom={0.3}
            maxZoom={2}
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
            proOptions={{ hideAttribution: true }}
            connectionLineStyle={{ stroke: "#A855F7", strokeWidth: 2 }}
          >
            <Background color="#1a1a2e" gap={20} size={1} />
            <Controls className="manga-flow-controls" showInteractive={false} />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === "person") return "#9333EA";
                if (n.type === "scenario") return "#14B8A6";
                return "#FACC15";
              }}
              maskColor="rgba(10,10,15,0.85)"
              className="manga-flow-minimap"
            />
            <Panel position="bottom-center" className="manga-flow-hint-panel">
              <p className="text-[11px] text-[#5A5A5E] font-mono">
                Drag cards • Connect handles • Click a link to edit • Tap card to configure
              </p>
            </Panel>
          </ReactFlow>
        </div>

        {selectedNodeObj && (
          <NodeInspector
            node={selectedNodeObj}
            edges={connectedEdges}
            allNodes={nodes}
            onUpdate={(data) => updateNodeData(selectedNode, data)}
            onDelete={() => deleteNode(selectedNode)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {showAddMenu && <AddNodeMenu onAdd={addNode} onClose={() => setShowAddMenu(false)} />}
      {(pendingConnection || editingEdge) && (
        <ConnectionPromptModal
          source={editingEdge ? editingEdge._srcNode : nodes.find((n) => n.id === pendingConnection?.source)}
          target={editingEdge ? editingEdge._tgtNode : nodes.find((n) => n.id === pendingConnection?.target)}
          initialPrompt={editingEdge?.data?.prompt || ""}
          isEditing={Boolean(editingEdge)}
          onConfirm={confirmConnection}
          onCancel={cancelConnectionModal}
        />
      )}
      {showTutorial && (
        <TutorialOverlay
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem("manga_flow_tutorial_done", "1");
          }}
        />
      )}
    </div>
  );
}
