import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from "./types";
import { useFlowStore } from "./useFlowStore";

const NODE_TYPES = [
  "personagem",
  "cenario",
  "objeto",
  "acao",
  "dialogo",
  "efeito",
  "transicao",
];

export default function FlowPalette({ onAddType }) {
  const nodes = useFlowStore((s) => s.nodes);

  const onDragStart = (e, type) => {
    e.dataTransfer.setData("application/mangaflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="mf-flow-palette">
      <div className="mf-flow-palette-head">
        <h3>Caixas</h3>
        <span className="mf-flow-palette-count">{nodes.length}</span>
      </div>
      <p className="mf-flow-palette-hint">Arrasta para o canvas ou clica para adicionar</p>
      <div className="mf-flow-palette-list">
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className="mf-palette-item"
            style={{ "--palette-color": NODE_COLORS[type] }}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            onClick={() => onAddType(type)}
          >
            <span className="mf-palette-icon">{NODE_ICONS[type]}</span>
            <span className="mf-palette-label">{NODE_LABELS[type]}</span>
            <span className="mf-palette-drag">⋮⋮</span>
          </button>
        ))}
      </div>
      <div className="mf-flow-palette-tip">
        <p>🔗 Ligações</p>
        <p className="text-[0.7rem] text-[#9ca3af]">
          Arrasta do port ● (direita ou baixo) até o port de entrada (esquerda).
        </p>
      </div>
    </aside>
  );
}
