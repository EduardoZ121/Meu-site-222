import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { GripVertical, Link2, MoreHorizontal, Plus } from "lucide-react";
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from "./types";
import { useFlowStore } from "./useFlowStore";
import { calcConsistencyScore } from "./buildFlowPrompt";

const TYPES = ["personagem", "cenario", "objeto", "acao", "dialogo", "efeito", "transicao"];

const COLOR_PRESETS = ["#F97316", "#3B82F6", "#8B5CF6", "#22C55E", "#EAB308", "#EC4899", "#6B7280", "#ef4444"];

function NodeBadges({ type, data }) {
  const badges = [];
  if (type === "personagem" && data.bodyType) badges.push(data.bodyType);
  if (type === "personagem" && data.consistencyScore != null) badges.push(`${data.consistencyScore}%`);
  if (type === "cenario" && data.timeOfDay) badges.push(data.timeOfDay);
  if (type === "cenario" && data.weather) badges.push(data.weather);
  if (type === "acao" && data.category) badges.push(data.category);
  if (type === "dialogo" && data.speechType) badges.push(data.speechType);
  if (type === "efeito" && data.effectType) badges.push(data.effectType?.replace("_", " "));
  if (type === "transicao" && data.transitionType) badges.push(data.transitionType);
  if (!badges.length) return null;
  return (
    <div className="mf-node-badges">
      {badges.slice(0, 3).map((b) => (
        <span key={b} className="mf-node-badge">
          {b}
        </span>
      ))}
    </div>
  );
}

function FlowNode({ id, data, selected }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const changeNodeType = useFlowStore((s) => s.changeNodeType);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const duplicateNode = useFlowStore((s) => s.duplicateNode);
  const addNode = useFlowStore((s) => s.addNode);
  const selectNode = useFlowStore((s) => s.selectNode);

  const type = data.flowType || "personagem";
  const color = data.customColor || NODE_COLORS[type] || "#8B5CF6";
  const name = data.name || data.label || NODE_LABELS[type];
  const thumb = data.avatarUrl || data.backgroundUrl || data.poseImageUrl || data.imageUrl;
  const score = type === "personagem" ? (data.consistencyScore ?? calcConsistencyScore(data)) : null;

  const addChild = (childType) => {
    const self = useFlowStore.getState().nodes.find((n) => n.id === id);
    const pos = self?.position || { x: 0, y: 0 };
    const newId = addNode(childType, { x: pos.x + 300, y: pos.y + (childOpen ? 80 : 0) });
    setChildOpen(false);
    selectNode(newId);
  };

  return (
    <div
      className={`mf-node ${selected ? "mf-node--selected" : ""}`}
      style={{ "--mf-node-color": color }}
    >
      <Handle type="target" position={Position.Left} id="in" className="mf-handle mf-handle--in" />
      <Handle type="source" position={Position.Right} id="out" className="mf-handle mf-handle--out" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out-bottom"
        className="mf-handle mf-handle--branch"
      />

      <div className="mf-node-color-bar" style={{ background: color }} />

      <div className="mf-node-head">
        <GripVertical className="w-4 h-4 mf-node-grip nodrag" />
        <input
          className="mf-node-name nodrag"
          value={name}
          onChange={(e) => updateNodeData(id, { name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="relative nodrag">
          <button
            type="button"
            className="mf-node-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="mf-dropdown mf-dropdown--node" onClick={(e) => e.stopPropagation()}>
              <p className="text-[0.7rem] text-[#8b5cf6] px-2 py-1">🔄 Mudar tipo</p>
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    changeNodeType(id, t);
                    setMenuOpen(false);
                  }}
                >
                  {NODE_ICONS[t]} {NODE_LABELS[t]}
                </button>
              ))}
              <hr className="border-[#2e2e30] my-1" />
              <p className="text-[0.65rem] text-[#9ca3af] px-2">🎨 Cor personalizada</p>
              <div className="mf-color-row px-2 pb-1">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="mf-color-swatch"
                    style={{ background: c }}
                    onClick={() => updateNodeData(id, { customColor: c })}
                  />
                ))}
                <input
                  type="color"
                  className="mf-color-input"
                  value={data.customColor || color}
                  onChange={(e) => updateNodeData(id, { customColor: e.target.value })}
                />
              </div>
              <hr className="border-[#2e2e30] my-1" />
              <button type="button" onClick={() => { duplicateNode(id); setMenuOpen(false); }}>
                📋 Duplicar caixa
              </button>
              <button type="button" onClick={() => { deleteNode(id); setMenuOpen(false); }}>
                🗑️ Excluir caixa
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mf-node-type">
        {NODE_ICONS[type]} {NODE_LABELS[type]}
        {score != null && <span className="mf-node-score"> · {score}%</span>}
      </p>

      <NodeBadges type={type} data={data} />

      {thumb ? (
        <img src={thumb} alt="" className="mf-node-thumb" />
      ) : (
        <div className="mf-node-thumb-placeholder">⬆️ Upload / IA</div>
      )}

      {data.text && <p className="mf-node-preview">"{data.text}"</p>}
      {data.description && type === "objeto" && (
        <p className="mf-node-preview">{data.description}</p>
      )}
      {data.location && type === "cenario" && (
        <p className="mf-node-preview">📍 {data.location}</p>
      )}

      <div className="mf-node-actions nodrag">
        <div className="relative flex-1">
          <button
            type="button"
            className="mf-node-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setChildOpen((v) => !v);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add child
          </button>
          {childOpen && (
            <div className="mf-dropdown mf-dropdown--up">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => addChild(t)}>
                  {NODE_ICONS[t]} {NODE_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="mf-node-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            selectNode(id);
          }}
          title="Arrasta do ● direito ou de baixo para ligar"
        >
          <Link2 className="w-3.5 h-3.5" />
          Connect
        </button>
      </div>
    </div>
  );
}

export default memo(FlowNode);
