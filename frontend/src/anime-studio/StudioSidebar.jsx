import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TOOL_CATEGORIES, toolDragPayload, toolLabel } from "./animeStudioCatalog";
import { useFlowStore } from "./useFlowStore";
import { NODE_COLORS } from "./types";

export default function StudioSidebar() {
  const [openCats, setOpenCats] = useState(() =>
    Object.fromEntries(TOOL_CATEGORIES.map((c) => [c.id, true])),
  );
  const addNode = useFlowStore((s) => s.addNode);
  const nodes = useFlowStore((s) => s.nodes);

  const onDragStart = (e, tool) => {
    e.dataTransfer.setData("application/anime-studio", toolDragPayload(tool));
    e.dataTransfer.effectAllowed = "move";
  };

  const addAtCenter = (tool) => {
    const offset = nodes.length * 32;
    addNode(tool.type, { x: 180 + offset, y: 140 + offset }, tool);
  };

  return (
    <aside className="as-sidebar" data-testid="anime-studio-sidebar">
      <div className="as-sidebar-head">
        <h2>Ferramentas</h2>
        <p>Arrasta para o canvas ou clica para adicionar</p>
      </div>
      <div className="as-sidebar-scroll">
        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat.id} className="as-sidebar-cat">
            <button
              type="button"
              className="as-sidebar-cat-btn"
              onClick={() => setOpenCats((o) => ({ ...o, [cat.id]: !o[cat.id] }))}
            >
              <span>{cat.label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openCats[cat.id] ? "rotate-180" : ""}`} />
            </button>
            {openCats[cat.id] && (
              <div className="as-sidebar-tools">
                {cat.tools.map((tool) => (
                  <button
                    key={`${tool.type}-${tool.preset}`}
                    type="button"
                    draggable
                    onDragStart={(e) => onDragStart(e, tool)}
                    onClick={() => addAtCenter(tool)}
                    className="as-tool-chip"
                    style={{ borderColor: `${NODE_COLORS[tool.type]}55` }}
                  >
                    <span className="as-tool-icon">{tool.icon || "◆"}</span>
                    <span className="as-tool-label">{toolLabel(tool)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
