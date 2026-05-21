import { useSceneFlowStore } from "./store";
import { X } from "lucide-react";

const RELATIONS = [
  { value: "segurando",   label: "Segurando",     color: "#A855F7" },
  { value: "olhando_para", label: "Olhando para",  color: "#06B6D4" },
  { value: "falando_com", label: "Falando com",   color: "#3B82F6" },
  { value: "abracando",   label: "Abraçando",     color: "#EC4899" },
  { value: "dentro_de",   label: "Dentro de",     color: "#7C3AED" },
  { value: "afetando",    label: "Afetando",      color: "#F59E0B" },
  { value: "pertence_a",  label: "Pertence a",    color: "#10B981" },
];

export default function EdgePanel() {
  const selectedEdgeId = useSceneFlowStore((s) => s.selectedEdgeId);
  const edge = useSceneFlowStore((s) => s.edges.find((e) => e.id === selectedEdgeId));
  const updateEdgeData = useSceneFlowStore((s) => s.updateEdgeData);
  const setSelectedEdge = useSceneFlowStore((s) => s.setSelectedEdge);

  if (!edge) return null;
  const upd = (patch) => {
    updateEdgeData(edge.id, patch);
    if (patch.relation) {
      const rel = RELATIONS.find((r) => r.value === patch.relation);
      if (rel) edge.style = { ...edge.style, stroke: rel.color };
    }
  };

  return (
    <aside
      className="fixed sm:absolute right-0 top-0 bottom-0 w-full sm:w-[320px] bg-[#0F0F11] border-l border-[#2E2E30] z-20 flex flex-col"
      data-testid="edge-panel"
    >
      <header className="px-4 py-3 border-b border-[#2E2E30] flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white">Conexão</span>
        <button onClick={() => setSelectedEdge(null)} className="p-1 text-[#9CA3AF] hover:text-white" data-testid="edge-close-btn">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">Relação</label>
          <div className="grid grid-cols-2 gap-2">
            {RELATIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => upd({ relation: r.value })}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  edge.data?.relation === r.value
                    ? "text-white"
                    : "text-[#9CA3AF] border-[#2E2E30] hover:border-[#5A5A5E]"
                }`}
                style={edge.data?.relation === r.value ? { borderColor: r.color, background: `${r.color}22` } : {}}
                data-testid={`relation-${r.value}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">
            Intensidade ({edge.data?.intensity || 0}%)
          </label>
          <input
            type="range" min="0" max="100" value={edge.data?.intensity || 0}
            onChange={(e) => upd({ intensity: parseInt(e.target.value) })}
            className="w-full"
            data-testid="edge-intensity"
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">Prompt adicional</label>
          <textarea
            rows={3}
            value={edge.data?.prompt || ""}
            onChange={(e) => upd({ prompt: e.target.value })}
            placeholder="Detalhes da relação…"
            className="w-full bg-[#0B0B0C] border border-[#2E2E30] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#5A5A5E] focus:outline-none focus:border-[#7C3AED]"
            data-testid="edge-prompt"
          />
        </div>
      </div>
    </aside>
  );
}
