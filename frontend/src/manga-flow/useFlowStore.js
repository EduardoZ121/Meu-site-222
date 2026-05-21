import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { defaultNodeData, autoOutputMode } from "./types";

const STORAGE_KEY = "rp_manga_flow_project";

function uid(p = "n") {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    id: uid("proj"),
    name: "Manga Flow",
    nodes: [],
    edges: [],
    globalSettings: {
      style: "manga",
      engine: "grok",
      gptCompose: true,
      outputMode: "auto",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tutorialDone: false,
  };
}

function persist(state) {
  try {
    const payload = {
      id: state.projectId,
      name: state.projectName,
      nodes: state.nodes,
      edges: state.edges,
      globalSettings: state.globalSettings,
      createdAt: state.createdAt,
      updatedAt: new Date().toISOString(),
      tutorialDone: state.tutorialDone,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

const initial = loadProject();

export const useFlowStore = create((set, get) => ({
  projectId: initial.id,
  projectName: initial.name,
  nodes: initial.nodes || [],
  edges: initial.edges || [],
  globalSettings: initial.globalSettings,
  createdAt: initial.createdAt,
  tutorialDone: initial.tutorialDone || false,
  selectedNodeId: null,
  selectedEdgeId: null,
  panMode: false,
  pendingConnection: null,
  showEnhancement: false,
  enhancementDraft: {
    promptEnhancement: "",
    useStoryInjection: false,
    autoEnhance: true,
  },
  tutorialStep: initial.tutorialDone ? -1 : 0,
  status: "",

  setStatus: (status) => set({ status }),

  setTutorialStep: (tutorialStep) => {
    set({ tutorialStep });
    if (tutorialStep < 0) {
      set({ tutorialDone: true });
      persist({ ...get(), tutorialDone: true });
    }
  },

  setProjectName: (projectName) => {
    set({ projectName });
    persist(get());
  },

  setGlobalSettings: (patch) => {
    set((s) => ({ globalSettings: { ...s.globalSettings, ...patch } }));
    persist(get());
  },

  onNodesChange: (changes) => {
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) }));
    persist(get());
  },

  onEdgesChange: (changes) => {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }));
    persist(get());
  },

  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedEdgeId: null }),

  selectEdge: (selectedEdgeId) => set({ selectedEdgeId, selectedNodeId: null }),

  setPanMode: (panMode) => set({ panMode }),

  addNode: (type, position) => {
    const id = uid("node");
    const node = {
      id,
      type: "flowNode",
      position: position || { x: 120 + get().nodes.length * 40, y: 80 + get().nodes.length * 30 },
      data: { flowType: type, ...defaultNodeData(type) },
    };
    set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: id }));
    persist(get());
    return id;
  },

  updateNodeData: (nodeId, patch) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n),
    }));
    persist(get());
  },

  changeNodeType: (nodeId, newType, force = false) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const hasData = node.data?.name && node.data.name !== defaultNodeData(node.data.flowType).name;
    if (hasData && !force && !window.confirm("Mudar tipo apaga o conteúdo desta caixa. Continuar?")) {
      return;
    }
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { flowType: newType, ...defaultNodeData(newType) } }
          : n),
    }));
    persist(get());
  },

  deleteNode: (nodeId) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    }));
    persist(get());
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const id = uid("node");
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          ...node,
          id,
          position: { x: node.position.x + 40, y: node.position.y + 40 },
          data: { ...node.data },
          selected: false,
        },
      ],
      selectedNodeId: id,
    }));
    persist(get());
  },

  onConnectStart: (_, { nodeId, handleType }) => {
    if (handleType === "source") {
      set({ pendingConnection: { sourceNodeId: nodeId } });
    }
  },

  onConnectEnd: () => {
    /* handled in onConnect */
  },

  onConnect: (connection) => {
    const source = get().nodes.find((n) => n.id === connection.source);
    const target = get().nodes.find((n) => n.id === connection.target);
    if (!source || !target) return;

    set({
      pendingConnection: {
        connection,
        sourceType: source.data.flowType,
        targetType: target.data.flowType,
      },
      showEnhancement: true,
      enhancementDraft: {
        promptEnhancement: `${source.data.name || source.data.flowType} → ${target.data.name || target.data.flowType}`,
        useStoryInjection: false,
        autoEnhance: true,
      },
    });
  },

  confirmConnection: () => {
    const { pendingConnection, enhancementDraft, edges, nodes } = get();
    if (!pendingConnection?.connection) return;
    const source = nodes.find((n) => n.id === pendingConnection.connection.source);
    const target = nodes.find((n) => n.id === pendingConnection.connection.target);
    let promptEnhancement = enhancementDraft.promptEnhancement?.trim() || "";
    if (!promptEnhancement) {
      const sn = source?.data?.name || pendingConnection.sourceType;
      const tn = target?.data?.name || pendingConnection.targetType;
      promptEnhancement = `${sn} liga-se a ${tn} mantendo estilo e continuidade visual`;
      if (enhancementDraft.autoEnhance) {
        promptEnhancement += ", com detalhes de movimento e roupa consistentes";
      }
    }
    const edge = {
      ...pendingConnection.connection,
      id: uid("edge"),
      type: "flowEdge",
      data: {
        sourceType: pendingConnection.sourceType,
        targetType: pendingConnection.targetType,
        ...enhancementDraft,
        promptEnhancement,
      },
    };
    set({
      edges: addEdge(edge, edges),
      showEnhancement: false,
      pendingConnection: null,
    });
    persist(get());
  },

  cancelConnection: () => set({ showEnhancement: false, pendingConnection: null }),

  updateEdgeData: (edgeId, patch) => {
    set((s) => ({
      edges: s.edges.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e)),
    }));
    persist(get());
  },

  deleteEdge: (edgeId) => {
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: null,
    }));
    persist(get());
  },

  newProject: () => {
    const p = {
      id: uid("proj"),
      name: "Novo Flow",
      nodes: [],
      edges: [],
      globalSettings: get().globalSettings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tutorialDone: false,
    };
    set({
      ...p,
      projectId: p.id,
      projectName: p.name,
      selectedNodeId: null,
      tutorialStep: 0,
    });
    persist(get());
  },

  getResolvedOutputMode: () => {
    const { globalSettings, nodes } = get();
    if (globalSettings.outputMode !== "auto") return globalSettings.outputMode;
    return autoOutputMode(nodes.length);
  },
}));
