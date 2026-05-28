import { X, LayoutTemplate } from "lucide-react";
import { uid } from "./mangaFlowData";
import { NODE_DEFAULTS, NODE_COLORS } from "./nodeDefaults";

function makeNode(type, x, y, overrides = {}) {
  return { id: uid(type.slice(0, 4)), type, position: { x, y }, data: { ...NODE_DEFAULTS[type], _color: NODE_COLORS[type], ...overrides } };
}

const TEMPLATES = [
  {
    id: "4panel", name: "4 Panels Classic", desc: "Standard 2×2 manga page layout.",
    build: () => ({
      nodes: [
        makeNode("panel", 40, 30, { panelSize: "medium", format: "rectangle", name: "Panel 1" }),
        makeNode("panel", 340, 30, { panelSize: "medium", format: "rectangle", name: "Panel 2" }),
        makeNode("panel", 40, 310, { panelSize: "medium", format: "rectangle", name: "Panel 3" }),
        makeNode("panel", 340, 310, { panelSize: "medium", format: "rectangle", name: "Panel 4" }),
        makeNode("scenario", 680, 60, { name: "Background" }),
        makeNode("person", 680, 300, { name: "Character" }),
      ], edges: [],
    }),
  },
  {
    id: "3strip", name: "3 Horizontal Strips", desc: "Three wide panels stacked vertically.",
    build: () => ({
      nodes: [
        makeNode("panel", 40, 30, { panelSize: "large", format: "wide", name: "Top Strip" }),
        makeNode("panel", 40, 220, { panelSize: "large", format: "wide", name: "Middle Strip" }),
        makeNode("panel", 40, 410, { panelSize: "large", format: "wide", name: "Bottom Strip" }),
        makeNode("person", 500, 120, { name: "Character A" }),
        makeNode("person", 500, 340, { name: "Character B" }),
      ], edges: [],
    }),
  },
  {
    id: "splash", name: "Splash Page", desc: "One big panel with character focus.",
    build: () => ({
      nodes: [
        makeNode("panel", 40, 30, { panelSize: "full_page", format: "rectangle", name: "Splash Panel" }),
        makeNode("scenario", 40, 320, { name: "Epic Background" }),
        makeNode("person", 360, 120, { name: "Hero" }),
        makeNode("camera", 360, 340, { shotType: "wide", angle: "low_angle" }),
        makeNode("effect", 600, 200, { effectType: "speed_lines", intensity: "strong" }),
      ], edges: [],
    }),
  },
  {
    id: "dialogue", name: "Dialogue Scene", desc: "Two characters talking with speech bubbles.",
    build: () => ({
      nodes: [
        makeNode("panel", 40, 30, { panelSize: "large", format: "wide", name: "Conversation" }),
        makeNode("scenario", 40, 280, { name: "Location", mood: "neutral" }),
        makeNode("person", 360, 40, { name: "Speaker A", pose: "standing", emotion: "normal" }),
        makeNode("person", 360, 280, { name: "Speaker B", pose: "standing", emotion: "normal" }),
        makeNode("speech", 600, 40, { text: "Hello!", bubbleType: "speech" }),
        makeNode("speech", 600, 220, { text: "Hey there!", bubbleType: "speech" }),
      ], edges: [],
    }),
  },
  {
    id: "action", name: "Action Sequence", desc: "Dynamic fight or chase with effects.",
    build: () => ({
      nodes: [
        makeNode("panel", 40, 30, { panelSize: "medium", format: "dynamic", name: "Impact" }),
        makeNode("panel", 340, 30, { panelSize: "small", format: "diagonal", name: "Reaction" }),
        makeNode("panel", 40, 280, { panelSize: "large", format: "wide", name: "Aftermath" }),
        makeNode("person", 600, 30, { name: "Fighter A", pose: "fighting", emotion: "angry" }),
        makeNode("person", 600, 230, { name: "Fighter B", pose: "jumping", emotion: "determined" }),
        makeNode("effect", 600, 420, { effectType: "impact", intensity: "extreme" }),
        makeNode("camera", 800, 130, { shotType: "close_up", angle: "dutch_angle" }),
      ], edges: [],
    }),
  },
  {
    id: "double", name: "Double Spread", desc: "Two-page panoramic layout.",
    build: () => ({
      nodes: [
        makeNode("panel", 40, 30, { panelSize: "double_spread", format: "wide", name: "Panoramic" }),
        makeNode("scenario", 40, 320, { name: "Epic Landscape", mood: "epic", lighting: "dramatic" }),
        makeNode("person", 450, 120, { name: "Protagonist" }),
        makeNode("camera", 450, 340, { shotType: "panoramic", angle: "eye_level" }),
      ], edges: [],
    }),
  },
];

export default function TemplatesModal({ onApply, onClose }) {
  return (
    <div className="manga-flow-modal-overlay" onClick={onClose} data-testid="templates-modal">
      <div className="manga-flow-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="manga-flow-modal__header">
          <LayoutTemplate className="w-5 h-5 text-[#A855F7]" />
          <h3 className="manga-flow-modal__title">Page Templates</h3>
          <button onClick={onClose} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
        </div>
        <div style={{ padding: "12px 20px 20px", maxHeight: "55vh", overflowY: "auto" }}>
          <p className="text-[11px] text-[#5A5A5E] mb-3">Choose a template to start with. This replaces the current page content.</p>
          <div className="mf-tpl-grid">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.id} onClick={() => { onApply(tpl.build()); onClose(); }} className="mf-tpl-card" data-testid={`template-${tpl.id}`}>
                <p className="mf-tpl-card__name">{tpl.name}</p>
                <p className="mf-tpl-card__desc">{tpl.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
