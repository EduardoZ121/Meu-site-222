import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, MarkerType, Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus, HelpCircle, Save, FolderOpen, Undo2, Redo2, Grid3X3,
  FilePlus2, X, Trash2, LayoutGrid, Wand2, ChevronDown, Copy,
  Pencil, FileText, Check, LayoutTemplate, History,
  Variable, List, Maximize2, Minimize2, Eye, EyeOff,
  Download, Upload, BarChart3, Search, Keyboard, Sparkles,
} from "lucide-react";
import PersonNode from "./nodes/PersonNode";
import ScenarioNode from "./nodes/ScenarioNode";
import ObjectNode from "./nodes/ObjectNode";
import SpeechNode from "./nodes/SpeechNode";
import EffectNode from "./nodes/EffectNode";
import CameraNode from "./nodes/CameraNode";
import PanelNode from "./nodes/PanelNode";
import NodeInspector from "./NodeInspector";
import ConnectionPromptModal from "./ConnectionPromptModal";
import { buildEdgeSemanticData, enrichEdgesSemantics } from "../../lib/mangaFlowSemantics";
import AddNodeMenu from "./AddNodeMenu";
import TutorialOverlay from "./TutorialOverlay";
import TemplatesModal from "./TemplatesModal";
import SnapshotsModal from "./SnapshotsModal";
import GlobalVarsModal from "./GlobalVarsModal";
import StoryboardView from "./StoryboardView";
import StatsPanel from "./StatsPanel";
import GenerationModal from "./GenerationModal";
import AIWizardModal from "./AIWizardModal";
import {
  uid, createDefaultProject, createEmptyPage, saveFlowProject,
  loadFlowProject, listFlowProjects, loadFlowProjectById, deleteFlowProject,
} from "./mangaFlowData";
import { NODE_DEFAULTS, NODE_COLORS } from "./nodeDefaults";
import { buildPromptFromFlow } from "./buildFlowPrompt";
import { toast } from "sonner";

const nodeTypes = {
  person: PersonNode, scenario: ScenarioNode, object: ObjectNode,
  speech: SpeechNode, effect: EffectNode, camera: CameraNode, panel: PanelNode,
};

const defaultEdgeOptions = {
  type: "smoothstep", animated: true,
  style: { stroke: "#A855F7", strokeWidth: 2.5, filter: "drop-shadow(0 0 4px rgba(168,85,247,0.4))" },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#A855F7", width: 18, height: 18 },
};

const MAX_HISTORY = 40;

/* ================================================================ */

export default function MangaFlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showGlobalVars, setShowGlobalVars] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGeneration, setShowGeneration] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [viewMode, setViewMode] = useState("canvas"); // "canvas" | "storyboard"
  const [zenMode, setZenMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [globalVars, setGlobalVars] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rp_manga_globalvars") || "{}"); } catch { return {}; }
  });
  const [snapshots, setSnapshots] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rp_manga_snapshots") || "[]"); } catch { return []; }
  });
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Project + multi-page state
  const [project, setProject] = useState(null);
  const [activePageId, setActivePageId] = useState(null);
  const historyRef = useRef({ past: [], future: [] });
  const skipHistoryRef = useRef(false);
  const pageDropRef = useRef(null);

  const projectName = project?.name || "My Manga";
  const projectId = project?.id || null;
  const pages = useMemo(() => project?.pages || [], [project?.pages]);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0] || null;
  const activePageIndex = pages.findIndex((p) => p.id === activePageId);

  const generationPageContext = useMemo(() => {
    const meta = project?.storyMeta;
    const prior = pages
      .slice(0, Math.max(0, activePageIndex))
      .filter((_, i) => i < activePageIndex)
      .map((pg, i) => `Page ${i + 1} (${pg.name}): ${pg.pageBeat || pg.name}`)
      .join("; ");
    return {
      pageName: activePage?.name,
      pageBeat: activePage?.pageBeat,
      storySynopsis: [meta?.synopsis, meta?.storyPrompt].filter(Boolean).join(" ").trim(),
      priorPagesSummary: prior || undefined,
    };
  }, [project?.storyMeta, pages, activePage, activePageIndex]);

  /* ---- History ---- */
  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return; }
    const h = historyRef.current;
    h.past.push({ n: JSON.parse(JSON.stringify(nodes)), e: JSON.parse(JSON.stringify(edges)) });
    if (h.past.length > MAX_HISTORY) h.past.shift();
    h.future = [];
  }, [nodes, edges]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    h.future.push({ n: JSON.parse(JSON.stringify(nodes)), e: JSON.parse(JSON.stringify(edges)) });
    const prev = h.past.pop();
    skipHistoryRef.current = true;
    setNodes(prev.n); setEdges(prev.e);
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    h.past.push({ n: JSON.parse(JSON.stringify(nodes)), e: JSON.parse(JSON.stringify(edges)) });
    const next = h.future.pop();
    skipHistoryRef.current = true;
    setNodes(next.n); setEdges(next.e);
  }, [nodes, edges, setNodes, setEdges]);

  /* ---- Save current page state into project ---- */
  const savePageState = useCallback(() => {
    if (!project || !activePageId) return project;
    const updatedPages = (project.pages || []).map((pg) =>
      pg.id === activePageId ? { ...pg, nodes, edges } : pg,
    );
    return { ...project, pages: updatedPages, activePageId };
  }, [project, activePageId, nodes, edges]);

  /* ---- Load on mount ---- */
  useEffect(() => {
    const saved = loadFlowProject();
    if (saved) {
      setProject(saved);
      const pg = saved.pages.find((p) => p.id === saved.activePageId) || saved.pages[0];
      if (pg) { setActivePageId(pg.id); setNodes(pg.nodes || []); setEdges(pg.edges || []); }
    } else {
      const fresh = createDefaultProject();
      setProject(fresh);
      const pg = fresh.pages[0];
      setActivePageId(pg.id); setNodes(pg.nodes); setEdges(pg.edges);
      saveFlowProject(fresh);
    }
    if (!localStorage.getItem("manga_flow_tutorial_done")) setShowTutorial(true);
  }, [setNodes, setEdges]);

  /* Backfill semantic prompts on edges (old projects + after load). */
  useEffect(() => {
    if (!nodes.length) return;
    setEdges((eds) => {
      if (!eds.length) return eds;
      const next = enrichEdgesSemantics(eds, nodes);
      return next.some((e, i) => e !== eds[i]) ? next : eds;
    });
  }, [nodes, setEdges]);

  /* ---- Auto-save ---- */
  useEffect(() => {
    const timer = setTimeout(() => {
      const updated = savePageState();
      if (updated) { setProject(updated); saveFlowProject(updated); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [nodes, edges, savePageState]);

  /* ---- Close dropdown on outside click ---- */
  useEffect(() => {
    if (!showPageDropdown) return;
    const handler = (e) => { if (pageDropRef.current && !pageDropRef.current.contains(e.target)) setShowPageDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPageDropdown]);

  /* ---- Switch page ---- */
  const switchToPage = useCallback((pageId) => {
    if (pageId === activePageId) { setShowPageDropdown(false); return; }
    // Save current page first
    const updated = savePageState();
    if (updated) {
      const target = updated.pages.find((p) => p.id === pageId);
      if (target) {
        setProject({ ...updated, activePageId: pageId });
        setActivePageId(pageId);
        setNodes(target.nodes || []); setEdges(target.edges || []);
        historyRef.current = { past: [], future: [] };
        setSelectedNode(null);
        saveFlowProject({ ...updated, activePageId: pageId });
      }
    }
    setShowPageDropdown(false);
  }, [activePageId, savePageState, setNodes, setEdges]);

  /* ---- Page CRUD ---- */
  const addPage = useCallback(() => {
    const updated = savePageState();
    if (!updated) return;
    const num = updated.pages.length + 1;
    const pg = createEmptyPage(`Página ${num}`);
    const next = { ...updated, pages: [...updated.pages, pg], activePageId: pg.id };
    setProject(next); setActivePageId(pg.id);
    setNodes(pg.nodes); setEdges(pg.edges);
    historyRef.current = { past: [], future: [] };
    setSelectedNode(null);
    saveFlowProject(next);
    toast.success(`Página ${num} created`);
  }, [savePageState, setNodes, setEdges]);

  const renamePage = useCallback((pageId) => {
    const pg = pages.find((p) => p.id === pageId);
    if (!pg) return;
    const name = window.prompt("Page name:", pg.name);
    if (name === null || !name.trim()) return;
    const updatedPages = pages.map((p) => p.id === pageId ? { ...p, name: name.trim() } : p);
    const next = { ...project, pages: updatedPages };
    setProject(next); saveFlowProject(next);
  }, [pages, project]);

  const duplicatePage = useCallback(() => {
    const updated = savePageState();
    if (!updated || !activePage) return;
    const currentPg = updated.pages.find((p) => p.id === activePageId);
    if (!currentPg) return;
    const dup = {
      id: uid("pg"),
      name: `${currentPg.name} (copy)`,
      nodes: JSON.parse(JSON.stringify(currentPg.nodes)).map((n) => ({ ...n, id: uid(n.type?.slice(0, 4) || "n") })),
      edges: [],
    };
    const next = { ...updated, pages: [...updated.pages, dup], activePageId: dup.id };
    setProject(next); setActivePageId(dup.id);
    setNodes(dup.nodes); setEdges(dup.edges);
    historyRef.current = { past: [], future: [] };
    saveFlowProject(next); toast.success(`"${dup.name}" created`);
  }, [savePageState, activePage, activePageId, setNodes, setEdges]);

  const deletePage = useCallback((pageId) => {
    if (pages.length <= 1) { toast.error("Must have at least 1 page"); return; }
    const pg = pages.find((p) => p.id === pageId);
    if (!window.confirm(`Delete "${pg?.name || "this page"}" and all its content?`)) return;
    const remaining = pages.filter((p) => p.id !== pageId);
    const newActive = pageId === activePageId ? remaining[0] : pages.find((p) => p.id === activePageId) || remaining[0];
    const next = { ...project, pages: remaining, activePageId: newActive.id };
    setProject(next);
    if (pageId === activePageId) {
      setActivePageId(newActive.id); setNodes(newActive.nodes || []); setEdges(newActive.edges || []);
      historyRef.current = { past: [], future: [] };
    }
    saveFlowProject(next); toast.message(`"${pg?.name}" deleted`);
  }, [pages, project, activePageId, setNodes, setEdges]);

  /* ---- Connections ---- */
  const onConnect = useCallback((params) => { pushHistory(); setPendingConnection(params); }, [pushHistory]);

  const confirmConnection = useCallback((prompt, condition, relationType) => {
    const srcNode = editingEdge?._srcNode || nodes.find((n) => n.id === pendingConnection?.source);
    const tgtNode = editingEdge?._tgtNode || nodes.find((n) => n.id === pendingConnection?.target);
    const semanticFields =
      srcNode && tgtNode
        ? buildEdgeSemanticData(srcNode, tgtNode, prompt || "", relationType || null)
        : {};
    const labelText = prompt
      ? (prompt.length > 30 ? prompt.slice(0, 28) + "…" : prompt)
      : semanticFields.connectionType?.replace("→", "→").slice(0, 12) || "link";
    const condLabel = condition?.value ? ` [if ${condition.field} ${condition.op} ${condition.value}]` : "";
    const fullLabel = (labelText + condLabel).slice(0, 40) || semanticFields.connectionType || "link";
    const edgeData = {
      prompt: prompt || "",
      condition: condition || null,
      ...semanticFields,
    };
    if (editingEdge) {
      setEdges((eds) => eds.map((e) => e.id === editingEdge.id ? {
        ...e, data: { ...e.data, ...edgeData },
        label: fullLabel,
        labelStyle: { fill: condition?.value ? "#FDE68A" : "#C4B5FD", fontSize: 11, fontFamily: "'Inter Tight', sans-serif" },
        labelBgStyle: { fill: "#111118", fillOpacity: 0.92 }, labelBgPadding: [6, 4], labelBgBorderRadius: 6,
      } : e));
      setEditingEdge(null); return;
    }
    if (!pendingConnection) return;
    const edge = {
      ...pendingConnection,
      id: `e_${pendingConnection.source}_${pendingConnection.target}_${Date.now()}`,
      data: edgeData,
      label: fullLabel,
      labelStyle: { fill: condition?.value ? "#FDE68A" : "#C4B5FD", fontSize: 11, fontFamily: "'Inter Tight', sans-serif" },
      labelBgStyle: { fill: "#111118", fillOpacity: 0.92 }, labelBgPadding: [6, 4], labelBgBorderRadius: 6,
    };
    setEdges((eds) => addEdge(edge, eds)); setPendingConnection(null);
  }, [pendingConnection, editingEdge, setEdges, nodes]);

  const onEdgeClick = useCallback((_, edge) => {
    setEditingEdge({ ...edge, _srcNode: nodes.find((n) => n.id === edge.source), _tgtNode: nodes.find((n) => n.id === edge.target) });
  }, [nodes]);
  const cancelConnectionModal = useCallback(() => { setPendingConnection(null); setEditingEdge(null); }, []);

  /* ---- Nodes ---- */
  const addNode = useCallback((type) => {
    pushHistory();
    const newNode = { id: uid(type.slice(0, 4)), type, position: { x: 200 + Math.random() * 300, y: 120 + Math.random() * 250 }, data: { ...NODE_DEFAULTS[type], _color: NODE_COLORS[type] } };
    setNodes((nds) => [...nds, newNode]); setShowAddMenu(false); setSelectedNode(newNode.id);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} card added`);
  }, [setNodes, pushHistory]);

  const deleteNode = useCallback((id) => {
    pushHistory(); setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (selectedNode === id) setSelectedNode(null); toast.message("Card removed");
  }, [setNodes, setEdges, selectedNode, pushHistory]);

  const updateNodeData = useCallback((id, data) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  }, [setNodes]);

  const onNodeClick = useCallback((_, node) => setSelectedNode(node.id), []);
  const onPaneClick = useCallback(() => { setSelectedNode(null); setShowPageDropdown(false); }, []);
  const onNodeDragStop = useCallback(() => pushHistory(), [pushHistory]);

  const selectedNodeObj = useMemo(() => nodes.find((n) => n.id === selectedNode), [nodes, selectedNode]);
  const connectedEdges = useMemo(() => selectedNode ? edges.filter((e) => e.source === selectedNode || e.target === selectedNode) : [], [edges, selectedNode]);

  /* ---- Auto Arrange ---- */
  const autoArrange = useCallback(() => {
    pushHistory();
    const typeOrder = { panel: 0, scenario: 1, person: 2, object: 3, speech: 4, effect: 5, camera: 6 };
    const sorted = [...nodes].sort((a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9));
    const cols = Math.max(2, Math.ceil(Math.sqrt(sorted.length)));
    const gapX = 260; const gapY = 220; const startX = 60; const startY = 40;
    const arranged = sorted.map((n, i) => ({
      ...n, position: { x: startX + (i % cols) * gapX, y: startY + Math.floor(i / cols) * gapY },
    }));
    setNodes(arranged);
    toast.success("Cards organized");
  }, [nodes, setNodes, pushHistory]);

  /* ---- Generate AI Prompt ---- */
  const generatePrompt = useCallback(() => {
    const prompt = buildPromptFromFlow(nodes, edges);
    setGeneratedPrompt(prompt);
    setShowPromptModal(true);
  }, [nodes, edges]);

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(generatedPrompt).then(() => toast.success("Prompt copied!")).catch(() => toast.error("Failed to copy"));
  }, [generatedPrompt]);

  /* ---- Templates ---- */
  const applyTemplate = useCallback((template) => {
    if (nodes.length > 2 && !window.confirm("Replace current page with template?")) return;
    pushHistory();
    setNodes(template.nodes); setEdges(template.edges || []);
    setSelectedNode(null);
    toast.success("Template applied");
  }, [nodes, setNodes, setEdges, pushHistory]);

  /* ---- Snapshots ---- */
  const saveSnapshot = useCallback((name) => {
    const snap = { name, timestamp: Date.now(), nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)), nodeCount: nodes.length };
    const next = [snap, ...snapshots].slice(0, 20);
    setSnapshots(next);
    try { localStorage.setItem("rp_manga_snapshots", JSON.stringify(next)); } catch {}
    toast.success(`Snapshot "${name}" saved`);
  }, [nodes, edges, snapshots]);

  const restoreSnapshot = useCallback((index) => {
    const snap = snapshots[index];
    if (!snap) return;
    if (!window.confirm(`Restore "${snap.name}"? Current work will be replaced.`)) return;
    pushHistory();
    setNodes(snap.nodes || []); setEdges(snap.edges || []);
    setSelectedNode(null);
    toast.success(`Restored "${snap.name}"`);
  }, [snapshots, setNodes, setEdges, pushHistory]);

  const deleteSnapshot = useCallback((index) => {
    const next = snapshots.filter((_, i) => i !== index);
    setSnapshots(next);
    try { localStorage.setItem("rp_manga_snapshots", JSON.stringify(next)); } catch {};
    toast.message("Snapshot deleted");
  }, [snapshots]);

  /* ---- Global Vars ---- */
  const updateGlobalVars = useCallback((vars) => {
    setGlobalVars(vars);
    try { localStorage.setItem("rp_manga_globalvars", JSON.stringify(vars)); } catch {}
  }, []);

  /* ---- Copy / Paste ---- */
  const copySelectedNode = useCallback(() => {
    if (!selectedNodeObj) return;
    setClipboard(JSON.parse(JSON.stringify(selectedNodeObj)));
    toast.success("Card copied");
  }, [selectedNodeObj]);

  const pasteNode = useCallback(() => {
    if (!clipboard) return;
    pushHistory();
    const newNode = {
      ...clipboard,
      id: uid(clipboard.type?.slice(0, 4) || "n"),
      position: { x: clipboard.position.x + 40, y: clipboard.position.y + 40 },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode.id);
    toast.success("Card pasted");
  }, [clipboard, setNodes, pushHistory]);

  /* ---- Import / Export ---- */
  const exportProject = useCallback(() => {
    const updated = savePageState();
    if (!updated) return;
    const json = JSON.stringify(updated, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${updated.name || "manga"}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success("Project exported");
  }, [savePageState]);

  const importProject = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const proj = JSON.parse(ev.target.result);
          if (!proj.pages && !proj.nodes) { toast.error("Invalid project file"); return; }
          setProject(proj);
          const pg = (proj.pages || []).find(p => p.id === proj.activePageId) || proj.pages?.[0];
          if (pg) { setActivePageId(pg.id); setNodes(pg.nodes || []); setEdges(pg.edges || []); }
          saveFlowProject(proj);
          toast.success(`Imported "${proj.name}"`);
        } catch { toast.error("Failed to parse file"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges]);

  /* ---- AI Wizard Result ---- */
  const handleWizardResult = useCallback((result) => {
    if (!result?.pages?.length) return;
    pushHistory();
    const newProject = {
      ...project,
      pages: result.pages,
      activePageId: result.pages[0].id,
      storyMeta: result.storyMeta || project?.storyMeta,
    };
    setProject(newProject);
    setActivePageId(result.pages[0].id);
    setNodes(result.pages[0].nodes || []);
    setEdges(result.pages[0].edges || []);
    historyRef.current = { past: [], future: [] };
    setSelectedNode(null);
    saveFlowProject(newProject);
    setShowAIWizard(false);
  }, [project, setNodes, setEdges, pushHistory]);


  /* ---- Fullscreen ---- */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  /* ---- Project save/load ---- */
  const handleSave = useCallback(() => {
    const updated = savePageState();
    if (updated) { setProject(updated); saveFlowProject(updated); toast.success(`"${updated.name}" saved`); }
  }, [savePageState]);

  /* ---- Keyboard Shortcuts ---- */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z") { e.preventDefault(); undo(); }
      if (ctrl && e.key === "y") { e.preventDefault(); redo(); }
      if (ctrl && e.key === "c") { e.preventDefault(); copySelectedNode(); }
      if (ctrl && e.key === "v") { e.preventDefault(); pasteNode(); }
      if (ctrl && e.key === "d") { e.preventDefault(); if (selectedNodeObj) { setClipboard(JSON.parse(JSON.stringify(selectedNodeObj))); pasteNode(); } }
      if (ctrl && e.key === "s") { e.preventDefault(); handleSave(); }
      if (ctrl && e.key === "f") { e.preventDefault(); setShowSearch(true); }
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedNode) deleteNode(selectedNode); }
      if (e.key === "Escape") { setSelectedNode(null); setShowSearch(false); }
      if (ctrl && e.key === "n") { e.preventDefault(); addPage(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, copySelectedNode, pasteNode, selectedNode, selectedNodeObj, deleteNode, handleSave, addPage]);

  const handleNewProject = () => {
    if (nodes.length > 0 && !window.confirm("Start a new project? Unsaved changes will be lost.")) return;
    const name = window.prompt("Project name:", "New Manga");
    if (name === null) return;
    const fresh = createDefaultProject(name || "New Manga");
    setProject(fresh); const pg = fresh.pages[0];
    setActivePageId(pg.id); setNodes(pg.nodes); setEdges(pg.edges);
    historyRef.current = { past: [], future: [] }; setSelectedNode(null);
    saveFlowProject(fresh); toast.success("New project created");
  };

  const handleLoadProject = (id) => {
    const proj = loadFlowProjectById(id);
    if (!proj) { toast.error("Project not found"); return; }
    setProject(proj);
    const pg = proj.pages.find((p) => p.id === proj.activePageId) || proj.pages[0];
    if (pg) { setActivePageId(pg.id); setNodes(pg.nodes || []); setEdges(pg.edges || []); }
    historyRef.current = { past: [], future: [] }; setSelectedNode(null);
    setShowLoadModal(false); saveFlowProject(proj);
    toast.success(`Loaded "${proj.name}"`);
  };

  const handleDeleteProject = (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    deleteFlowProject(id);
    if (id === projectId) {
      const fresh = createDefaultProject(); setProject(fresh);
      const pg = fresh.pages[0]; setActivePageId(pg.id); setNodes(pg.nodes); setEdges(pg.edges);
    }
    toast.message(`"${name}" deleted`);
  };

  /* ---- Render ---- */
  return (
    <div className="manga-flow-root" data-testid="manga-flow-editor">
      {/* ===== TOP BAR ===== */}
      <div className="manga-flow-topbar">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#9333EA]/20 border border-[#9333EA]/40 flex items-center justify-center text-sm shrink-0">🎌</div>
          <div className="min-w-0">
            <p className="text-[13px] text-[#F5F5F7] font-semibold font-['Inter_Tight'] truncate">{projectName}</p>
            <p className="text-[10px] text-[#5A5A5E] font-mono uppercase tracking-wider">Manga Flow Studio</p>
          </div>
        </div>
        {!zenMode && (
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setShowAddMenu(true)} className="manga-flow-btn manga-flow-btn-primary" data-testid="manga-flow-add-btn"><Plus className="w-4 h-4" /> Add</button>
          <button onClick={() => setShowGeneration(true)} className="mfg-trigger-btn" data-testid="manga-flow-generate-page">
            <Wand2 className="w-4 h-4" />
            {nodes.filter((n) => n.type === "panel").length >= 2 ? "Comic Sheet" : "Generate"}
          </button>
          <button onClick={() => setShowAIWizard(true)} className="aiw-trigger-btn" data-testid="manga-flow-ai-wizard"><Sparkles className="w-4 h-4" /> Create with AI</button>
          <button onClick={autoArrange} className="manga-flow-btn" title="Auto Arrange"><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={generatePrompt} className="manga-flow-btn manga-flow-btn-prompt" title="Generate AI Prompt"><Wand2 className="w-4 h-4" /></button>
          <button onClick={() => setShowTemplates(true)} className="manga-flow-btn" title="Templates"><LayoutTemplate className="w-4 h-4" /></button>
          <button onClick={() => setShowSnapshots(true)} className="manga-flow-btn" title="Snapshots"><History className="w-4 h-4" /></button>
          <button onClick={() => setShowGlobalVars(true)} className="manga-flow-btn" title="Global Variables"><Variable className="w-4 h-4" /></button>
          <button onClick={() => setViewMode(viewMode === "canvas" ? "storyboard" : "canvas")} className={`manga-flow-btn ${viewMode === "storyboard" ? "manga-flow-btn--active" : ""}`} title="Storyboard view"><List className="w-4 h-4" /></button>
          <button onClick={handleSave} className="manga-flow-btn" title="Save (Ctrl+S)"><Save className="w-4 h-4" /></button>
          <button onClick={() => setShowLoadModal(true)} className="manga-flow-btn" title="Load"><FolderOpen className="w-4 h-4" /></button>
          <button onClick={handleNewProject} className="manga-flow-btn" title="New project"><FilePlus2 className="w-4 h-4" /></button>
          <button onClick={undo} className="manga-flow-btn" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} className="manga-flow-btn" title="Redo (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`manga-flow-btn ${snapToGrid ? "manga-flow-btn--active" : ""}`} title="Snap to grid"><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={exportProject} className="manga-flow-btn" title="Export JSON"><Download className="w-4 h-4" /></button>
          <button onClick={importProject} className="manga-flow-btn" title="Import JSON"><Upload className="w-4 h-4" /></button>
          <button onClick={() => setShowStats(true)} className="manga-flow-btn" title="Statistics"><BarChart3 className="w-4 h-4" /></button>
          <button onClick={() => setShowSearch(!showSearch)} className="manga-flow-btn" title="Search (Ctrl+F)"><Search className="w-4 h-4" /></button>
          <button onClick={toggleFullscreen} className="manga-flow-btn" title="Fullscreen">{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
          <button onClick={() => setZenMode(true)} className="manga-flow-btn" title="Zen mode"><Eye className="w-4 h-4" /></button>
          <button onClick={() => setShowTutorial(true)} className="manga-flow-btn manga-flow-btn-help" title="Help"><HelpCircle className="w-4 h-4" /></button>
        </div>
        )}
        {zenMode && (
          <button onClick={() => setZenMode(false)} className="manga-flow-btn" title="Exit Zen mode"><EyeOff className="w-4 h-4" /> Exit Zen</button>
        )}
      </div>

      {/* ===== PAGE BAR ===== */}
      {!zenMode && (
      <div className="manga-flow-pagebar">
        <div className="manga-flow-pagebar__nav" ref={pageDropRef}>
          <button onClick={() => setShowPageDropdown(!showPageDropdown)} className="manga-flow-pagebar__current" data-testid="page-selector">
            <FileText className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>{activePage?.name || "Page 1"}</span>
            <span className="manga-flow-pagebar__count">{activePageIndex + 1} / {pages.length}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPageDropdown ? "rotate-180" : ""}`} />
          </button>
          {showPageDropdown && (
            <div className="manga-flow-pagebar__dropdown" data-testid="page-dropdown">
              {pages.map((pg, i) => (
                <div key={pg.id} className={`manga-flow-pagebar__item ${pg.id === activePageId ? "manga-flow-pagebar__item--active" : ""}`}>
                  <button onClick={() => switchToPage(pg.id)} className="manga-flow-pagebar__item-main">
                    <span className="manga-flow-pagebar__item-num">{i + 1}</span>
                    <span className="manga-flow-pagebar__item-name">{pg.name}</span>
                    {pg.id === activePageId && <Check className="w-3 h-3 text-[#A855F7] shrink-0" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="manga-flow-pagebar__actions">
          <button onClick={addPage} className="manga-flow-pagebar__btn" title="New page" data-testid="page-add"><Plus className="w-3.5 h-3.5" /> New</button>
          <button onClick={() => renamePage(activePageId)} className="manga-flow-pagebar__btn" title="Rename"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={duplicatePage} className="manga-flow-pagebar__btn" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
          {pages.length > 1 && (
            <button onClick={() => deletePage(activePageId)} className="manga-flow-pagebar__btn manga-flow-pagebar__btn--danger" title="Delete page"><Trash2 className="w-3.5 h-3.5" /></button>
          )}
        </div>
      </div>
      )}

      {/* ===== SEARCH BAR ===== */}
      {showSearch && (
        <div className="mf-search-bar">
          <Search className="w-4 h-4 text-[#6B7280]" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cards by name..." className="mf-search-input" autoFocus />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="manga-flow-modal__close"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ===== CANVAS or STORYBOARD ===== */}
      {viewMode === "storyboard" ? (
        <div className="manga-flow-canvas-wrap">
          <StoryboardView nodes={nodes} edges={edges} onSelectNode={(id) => { setSelectedNode(id); setViewMode("canvas"); }} />
        </div>
      ) : (
      <div className="manga-flow-canvas-wrap">
        <div className="manga-flow-canvas" data-testid="manga-flow-canvas">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick}
            onPaneClick={onPaneClick} onNodeDragStop={onNodeDragStop}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes} defaultEdgeOptions={defaultEdgeOptions}
            fitView minZoom={0.2} maxZoom={2.5}
            snapToGrid={snapToGrid} snapGrid={[20, 20]}
            proOptions={{ hideAttribution: true }}
            connectionLineStyle={{ stroke: "#A855F7", strokeWidth: 2 }}
          >
            <Background color="#1a1a2e" gap={20} size={1} />
            <Controls className="manga-flow-controls" showInteractive={false} />
            <MiniMap nodeColor={(n) => NODE_COLORS[n.type]?.border || "#666"} maskColor="rgba(10,10,15,0.85)" className="manga-flow-minimap" />
            <Panel position="bottom-center" className="manga-flow-hint-panel">
              <p className="text-[11px] text-[#5A5A5E] font-mono">{activePage?.name} • {nodes.length} cards • {edges.length} links</p>
            </Panel>
          </ReactFlow>
        </div>
        {selectedNodeObj && (
          <NodeInspector node={selectedNodeObj} edges={connectedEdges} allNodes={nodes}
            onUpdate={(data) => updateNodeData(selectedNode, data)}
            onDelete={() => deleteNode(selectedNode)}
            onClose={() => setSelectedNode(null)} />
        )}
      </div>
      )}

      {/* ===== MODALS ===== */}
      {showAddMenu && <AddNodeMenu onAdd={addNode} onClose={() => setShowAddMenu(false)} />}
      {(pendingConnection || editingEdge) && (
        <ConnectionPromptModal
          source={editingEdge ? editingEdge._srcNode : nodes.find((n) => n.id === pendingConnection.source)}
          target={editingEdge ? editingEdge._tgtNode : nodes.find((n) => n.id === pendingConnection.target)}
          initialPrompt={editingEdge?.data?.prompt || ""}
          initialCondition={editingEdge?.data?.condition || null}
          initialRelationType={editingEdge?.data?.relationType || "talking_to"}
          isEditing={Boolean(editingEdge)}
          onConfirm={confirmConnection} onCancel={cancelConnectionModal} />
      )}
      {showTutorial && <TutorialOverlay onClose={() => { setShowTutorial(false); localStorage.setItem("manga_flow_tutorial_done", "1"); }} />}

      {/* Load modal */}
      {showLoadModal && (
        <div className="manga-flow-modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="manga-flow-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="manga-flow-modal__header">
              <FolderOpen className="w-5 h-5 text-[#A855F7]" />
              <h3 className="manga-flow-modal__title">Load Project</h3>
              <button onClick={() => setShowLoadModal(false)} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
            </div>
            <div style={{ padding: "12px 20px 20px", maxHeight: "50vh", overflowY: "auto" }}>
              {(() => {
                const projects = listFlowProjects();
                if (!projects.length) return <p style={{ color: "#5A5A5E", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No saved projects yet.</p>;
                return (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projects.map((p) => (
                    <div key={p.id} className={`manga-flow-load-item ${p.id === projectId ? "manga-flow-load-item--active" : ""}`}>
                      <button onClick={() => handleLoadProject(p.id)} className="manga-flow-load-item__main">
                        <span className="manga-flow-load-item__name">{p.name}</span>
                        <span className="manga-flow-load-item__meta">{p.pageCount} page{p.pageCount !== 1 ? "s" : ""} · {new Date(p.updatedAt).toLocaleDateString()}</span>
                      </button>
                      <button onClick={() => handleDeleteProject(p.id, p.name)} className="manga-flow-load-item__delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>);
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Prompt modal */}
      {showPromptModal && (
        <div className="manga-flow-modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="manga-flow-modal manga-flow-modal--prompt" onClick={(e) => e.stopPropagation()}>
            <div className="manga-flow-modal__header">
              <Wand2 className="w-5 h-5 text-[#A855F7]" />
              <h3 className="manga-flow-modal__title">AI Prompt Generated</h3>
              <button onClick={() => setShowPromptModal(false)} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
            </div>
            <div className="manga-flow-prompt-body">
              <pre className="manga-flow-prompt-text">{generatedPrompt}</pre>
            </div>
            <div className="manga-flow-modal__actions">
              <button onClick={() => setShowPromptModal(false)} className="manga-flow-btn">Close</button>
              <button onClick={copyPrompt} className="manga-flow-btn manga-flow-btn-primary"><Copy className="w-4 h-4" /> Copy to clipboard</button>
            </div>
          </div>
        </div>
      )}

      {/* Templates modal */}
      {showTemplates && <TemplatesModal onApply={applyTemplate} onClose={() => setShowTemplates(false)} />}

      {/* Snapshots modal */}
      {showSnapshots && <SnapshotsModal snapshots={snapshots} onSave={saveSnapshot} onRestore={restoreSnapshot} onDelete={deleteSnapshot} onClose={() => setShowSnapshots(false)} />}

      {/* Global Variables */}
      {showGlobalVars && <GlobalVarsModal vars={globalVars} onChange={updateGlobalVars} onClose={() => setShowGlobalVars(false)} />}

      {/* Statistics */}
      {showStats && <StatsPanel nodes={nodes} edges={edges} pages={pages.length} onClose={() => setShowStats(false)} />}

      {/* Generation Modal */}
      {showGeneration && (
        <GenerationModal
          nodes={nodes}
          edges={edges}
          pageContext={generationPageContext}
          onClose={() => setShowGeneration(false)}
        />
      )}

      {/* AI Wizard */}
      {showAIWizard && <AIWizardModal onGenerate={handleWizardResult} onClose={() => setShowAIWizard(false)} />}
    </div>
  );
}
