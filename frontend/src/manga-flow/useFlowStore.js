import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { defaultNodeData, autoOutputMode } from "./types";
import { orderNodesByFlow } from "./buildFlowPrompt";
import { DEFAULT_STORY, DEMO_STORY, getStorySequence } from "./storyAnalysis";

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
    story: { ...DEFAULT_STORY },
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
      story: state.story,
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
  story: initial.story ? { ...DEFAULT_STORY, ...initial.story } : { ...DEFAULT_STORY },
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
  viewportZoom: 1,

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

  setStory: (patch) => {
    set((s) => ({ story: { ...s.story, ...patch } }));
    persist(get());
  },

  setSceneNote: (nodeId, note) => {
    set((s) => ({
      story: {
        ...s.story,
        sceneNotes: { ...s.story.sceneNotes, [nodeId]: note },
      },
    }));
    persist(get());
  },

  setManualSequence: (manualSequence) => {
    set((s) => ({ story: { ...s.story, manualSequence } }));
    persist(get());
  },

  autoOrganizeSequence: () => {
    const ids = orderNodesByFlow(get().nodes, get().edges).map((n) => n.id);
    set((s) => ({ story: { ...s.story, manualSequence: ids } }));
    persist(get());
  },

  moveStoryStep: (nodeId, delta) => {
    const seq = getStorySequence(get().nodes, get().edges, get().story.manualSequence).map(
      (n) => n.id,
    );
    const i = seq.indexOf(nodeId);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= seq.length) return;
    const next = [...seq];
    [next[i], next[j]] = [next[j], next[i]];
    set((s) => ({ story: { ...s.story, manualSequence: next } }));
    persist(get());
  },

  addStoryBeat: (beat) => {
    const id = uid("beat");
    set((s) => ({
      story: {
        ...s.story,
        beats: [...(s.story.beats || []), { id, title: "Novo beat", summary: "", ...beat }],
      },
    }));
    persist(get());
  },

  updateStoryBeat: (beatId, patch) => {
    set((s) => ({
      story: {
        ...s.story,
        beats: (s.story.beats || []).map((b) => (b.id === beatId ? { ...b, ...patch } : b)),
      },
    }));
    persist(get());
  },

  removeStoryBeat: (beatId) => {
    set((s) => ({
      story: {
        ...s.story,
        beats: (s.story.beats || []).filter((b) => b.id !== beatId),
      },
    }));
    persist(get());
  },

  loadDemoStory: () => {
    const { nodes } = get();
    if (nodes.length > 0) {
      set((s) => ({ story: { ...s.story, ...DEMO_STORY } }));
      persist(get());
      return;
    }
    const positions = [
      { x: 80, y: 100 },
      { x: 380, y: 80 },
      { x: 680, y: 120 },
      { x: 380, y: 280 },
      { x: 680, y: 320 },
    ];
    const types = ["cenario", "personagem", "dialogo", "acao", "dialogo"];
    const names = ["Telhado", "Ana", "O pôr do sol…", "Aproximação", "Desde quando estás aqui?"];
    const newNodes = types.map((type, i) => {
      const id = uid("node");
      const data = { flowType: type, ...defaultNodeData(type) };
      data.name = names[i];
      if (type === "dialogo") data.text = names[i];
      if (type === "cenario") {
        data.name = "Telhado ao pôr do sol";
        data.location = "Telhado da escola";
        data.timeOfDay = "sunset";
      }
      if (type === "personagem") {
        data.name = "Ana";
        data.bodyType = "athletic";
      }
      return { id, type: "flowNode", position: positions[i], data };
    });
    const newEdges = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: uid("edge"),
        source: newNodes[i].id,
        target: newNodes[i + 1].id,
        type: "flowEdge",
        data: {
          sourceType: newNodes[i].data.flowType,
          targetType: newNodes[i + 1].data.flowType,
          promptEnhancement: `${names[i]} → ${names[i + 1]}`,
          autoEnhance: true,
          useStoryInjection: false,
        },
      });
    }
    set({
      projectName: "Demo — Telhado ao pôr do sol",
      nodes: newNodes,
      edges: newEdges,
      story: { ...DEFAULT_STORY, ...DEMO_STORY },
    });
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

  setViewportZoom: (viewportZoom) => set({ viewportZoom }),

  setEdgesGenerating: (generating) => {
    set((s) => ({
      edges: s.edges.map((e) => ({
        ...e,
        data: { ...e.data, generating: !!generating },
      })),
    }));
  },

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
      story: { ...DEFAULT_STORY },
    });
    persist(get());
  },

  getResolvedOutputMode: () => {
    const { globalSettings, nodes } = get();
    if (globalSettings.outputMode !== "auto") return globalSettings.outputMode;
    return autoOutputMode(nodes.length);
  },
}));
