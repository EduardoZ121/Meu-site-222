import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "reactflow";

const STORAGE_KEY = "rp_scene_flow_v1";

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  globalSettings: {
    output: "single", // single | manga_page_4 | manga_page_6 | storyboard
    style: "manga_bw", // manga_bw | manga_color | webtoon | comic_us
    aspect: "3:4",
    resolution: "1024x1365",
    model: "fast", // fast | gpt | aurora
    lighting: "natural",
  },
  history: [],
  historyIndex: -1,
};

const persist = (state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nodes: state.nodes,
        edges: state.edges,
        globalSettings: state.globalSettings,
      })
    );
  } catch (e) { /* ignore */ }
};

const hydrate = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
      globalSettings: { ...initialState.globalSettings, ...(parsed.globalSettings || {}) },
    };
  } catch (e) { return {}; }
};

export const useSceneFlowStore = create((set, get) => ({
  ...initialState,
  ...hydrate(),

  onNodesChange: (changes) => {
    set((s) => {
      const next = { ...s, nodes: applyNodeChanges(changes, s.nodes) };
      persist(next);
      return next;
    });
  },

  onEdgesChange: (changes) => {
    set((s) => {
      const next = { ...s, edges: applyEdgeChanges(changes, s.edges) };
      persist(next);
      return next;
    });
  },

  onConnect: (connection) => {
    set((s) => {
      const edge = {
        ...connection,
        id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "smoothstep",
        animated: true,
        data: { relation: "olhando_para", intensity: 70, prompt: "" },
        style: { stroke: "#7C3AED", strokeWidth: 2 },
      };
      const next = { ...s, edges: addEdge(edge, s.edges), selectedEdgeId: edge.id };
      persist(next);
      return next;
    });
  },

  addNode: (type, position = { x: 200, y: 200 }) => {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const defaults = {
      personagem: { label: "Personagem", appearance: "", outfit: "", pose: "", expression: "", refs: [] },
      cenario:    { label: "Cenário", lighting: "natural", weather: "clear", time: "day", layers: "", refs: [] },
      objeto:     { label: "Objeto", state: "", interaction: "", angle: "", effects: "" },
      efeito:     { label: "Efeito", kind: "smoke", intensity: 50, color: "#7C3AED", direction: "up" },
      camera:     { label: "Câmera", shot: "medium", angle: "eye", lens: "50mm", dof: "shallow" },
      texto:      { label: "Balão", balloon: "speech", content: "", position: "top", font: "manga" },
      grupo:      { label: "Grupo", color: "#7C3AED" },
    };
    const node = {
      id,
      type,
      position,
      data: defaults[type] || { label: type },
    };
    set((s) => {
      const next = { ...s, nodes: [...s.nodes, node], selectedNodeId: id };
      persist(next);
      return next;
    });
  },

  updateNodeData: (id, patch) => {
    set((s) => {
      const next = {
        ...s,
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      };
      persist(next);
      return next;
    });
  },

  updateEdgeData: (id, patch) => {
    set((s) => {
      const next = {
        ...s,
        edges: s.edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e)),
      };
      persist(next);
      return next;
    });
  },

  deleteNode: (id) => {
    set((s) => {
      const next = {
        ...s,
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: null,
      };
      persist(next);
      return next;
    });
  },

  duplicateNode: (id) => {
    const src = get().nodes.find((n) => n.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      position: { x: src.position.x + 40, y: src.position.y + 40 },
      data: { ...src.data, label: `${src.data.label} (cópia)` },
    };
    set((s) => {
      const next = { ...s, nodes: [...s.nodes, copy] };
      persist(next);
      return next;
    });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  updateGlobal: (patch) => {
    set((s) => {
      const next = { ...s, globalSettings: { ...s.globalSettings, ...patch } };
      persist(next);
      return next;
    });
  },

  clearAll: () => {
    set(initialState);
    persist(initialState);
  },
}));
