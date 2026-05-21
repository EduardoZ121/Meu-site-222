import { Trash2 } from "lucide-react";
import { useFlowStore } from "./useFlowStore";
import { NODE_ICONS, NODE_LABELS } from "./types";
import { buildFlowPrompt } from "./buildFlowPrompt";

export default function EdgeInspector() {
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const deleteEdge = useFlowStore((s) => s.deleteEdge);
  const selectEdge = useFlowStore((s) => s.selectEdge);

  const edge = edges.find((e) => e.id === selectedEdgeId);
  if (!edge) {
    return (
      <div className="mf-inspector-empty">
        <p className="text-[#9ca3af] text-[0.85rem]">
          Seleciona uma ligação no canvas para editar o prompt entre caixas.
        </p>
      </div>
    );
  }

  const source = nodes.find((n) => n.id === edge.source);
  const target = nodes.find((n) => n.id === edge.target);
  const srcName = source?.data?.name || NODE_LABELS[source?.data?.flowType] || "?";
  const tgtName = target?.data?.name || NODE_LABELS[target?.data?.flowType] || "?";

  const preview = buildFlowPrompt(
    source && target ? [source, target] : [],
    [edge],
    globalSettings,
  );

  const patch = (p) => updateEdgeData(edge.id, p);

  return (
    <div className="mf-inspector">
      <div className="mf-slide-handle lg:hidden" />
      <h3 className="mf-inspector-title">
        🔗 {srcName} → {tgtName}
      </h3>
      <p className="text-[0.75rem] text-[#9ca3af] mb-2">
        {NODE_ICONS[source?.data?.flowType]} {NODE_LABELS[source?.data?.flowType]} →{" "}
        {NODE_ICONS[target?.data?.flowType]} {NODE_LABELS[target?.data?.flowType]}
      </p>

      <label className="text-[0.75rem] text-[#c4b5fd]">Relação entre caixas</label>
      <textarea
        className="mf-field min-h-[100px]"
        value={edge.data?.promptEnhancement || ""}
        onChange={(e) => patch({ promptEnhancement: e.target.value })}
        placeholder="Ex: Ana corre em direção ao inimigo com espada na mão…"
      />

      <label className="flex items-center gap-2 min-h-[44px] text-[0.85rem] mt-2">
        <input
          type="checkbox"
          checked={edge.data?.autoEnhance !== false}
          onChange={(e) => patch({ autoEnhance: e.target.checked })}
        />
        Enhancement automático (movimento + roupa)
      </label>
      <label className="flex items-center gap-2 min-h-[44px] text-[0.85rem]">
        <input
          type="checkbox"
          checked={!!edge.data?.useStoryInjection}
          onChange={(e) => patch({ useStoryInjection: e.target.checked })}
        />
        Story injection (painel anterior como ref)
      </label>

      <div className="mf-prompt-preview-box mt-2">
        <p className="text-[0.7rem] text-[#8b5cf6] mb-1">Preview do prompt</p>
        <pre>{preview || edge.data?.promptEnhancement || "—"}</pre>
      </div>

      <div className="flex gap-2 mt-3">
        <button type="button" className="mf-btn flex-1" onClick={() => selectEdge(null)}>
          Fechar
        </button>
        <button
          type="button"
          className="mf-btn flex-1"
          onClick={() => {
            deleteEdge(edge.id);
            selectEdge(null);
          }}
        >
          <Trash2 className="w-4 h-4" />
          Apagar ligação
        </button>
      </div>
    </div>
  );
}
