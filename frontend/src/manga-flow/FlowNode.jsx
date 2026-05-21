import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from "./types";
import { useFlowStore } from "./useFlowStore";

const TYPES = ["personagem", "cenario", "objeto", "acao", "dialogo", "efeito", "transicao"];

function FlowNode({ id, data, selected }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const changeNodeType = useFlowStore((s) => s.changeNodeType);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const duplicateNode = useFlowStore((s) => s.duplicateNode);
  const addNode = useFlowStore((s) => s.addNode);

  const type = data.flowType || "personagem";
  const color = data.customColor || NODE_COLORS[type] || "#8B5CF6";
  const name = data.name || data.label || NODE_LABELS[type];

  return (
    <div
      className={`mf-node ${selected ? "mf-node--selected" : ""}`}
      style={{ "--mf-node-color": color }}
    >
      <Handle type="target" position={Position.Left} id="in" className="mf-handle" />
      <Handle type="source" position={Position.Right} id="out" className="mf-handle" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" className="mf-handle" />

      <div className="mf-node-head">
        <GripVertical className="w-4 h-4 mf-node-grip" />
        <input
          className="mf-node-name"
          value={name}
          onChange={(e) => updateNodeData(id, { name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="relative">
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
            <div className="mf-dropdown" onClick={(e) => e.stopPropagation()}>
              <p className="text-[0.7rem] text-[#8b5cf6] px-2 py-1">🔄 Mudar tipo</p>
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => { changeNodeType(id, t); setMenuOpen(false); }}>
                  {NODE_ICONS[t]} {NODE_LABELS[t]}
                </button>
              ))}
              <hr className="border-[#2e2e30] my-1" />
              <button type="button" onClick={() => { duplicateNode(id); setMenuOpen(false); }}>
                📋 Duplicar
              </button>
              <button type="button" onClick={() => { deleteNode(id); setMenuOpen(false); }}>
                🗑️ Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mf-node-type">
        {NODE_ICONS[type]} {NODE_LABELS[type]}
      </p>

      {data.avatarUrl || data.backgroundUrl || data.poseImageUrl ? (
        <img
          src={data.avatarUrl || data.backgroundUrl || data.poseImageUrl}
          alt=""
          className="w-full h-16 object-cover rounded-md mt-1"
        />
      ) : null}

      {data.text && <p className="mf-node-preview truncate">"{data.text}"</p>}

      <div className="mf-node-actions">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const self = useFlowStore.getState().nodes.find((n) => n.id === id);
            const pos = self?.position || { x: 0, y: 0 };
            addNode("dialogo", { x: pos.x + 280, y: pos.y + 40 });
          }}
        >
          + child
        </button>
        <button type="button" onClick={(e) => e.stopPropagation()}>
          🔗 Connect
        </button>
      </div>
    </div>
  );
}

export default memo(FlowNode);
