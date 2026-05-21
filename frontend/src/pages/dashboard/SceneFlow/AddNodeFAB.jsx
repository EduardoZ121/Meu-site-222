import { Plus, User, MapPin, Package, Sparkles, Camera, MessageSquare, Layers } from "lucide-react";
import { useState } from "react";
import { useSceneFlowStore } from "./store";

const NODE_TYPES = [
  { type: "personagem", label: "Personagem", icon: User,          color: "#7C3AED" },
  { type: "cenario",    label: "Cenário",    icon: MapPin,        color: "#06B6D4" },
  { type: "objeto",     label: "Objeto",     icon: Package,       color: "#F59E0B" },
  { type: "efeito",     label: "Efeito",     icon: Sparkles,      color: "#EC4899" },
  { type: "camera",     label: "Câmera",     icon: Camera,        color: "#10B981" },
  { type: "texto",      label: "Balão",      icon: MessageSquare, color: "#3B82F6" },
  { type: "grupo",      label: "Grupo",      icon: Layers,        color: "#A855F7" },
];

export default function AddNodeFAB() {
  const [open, setOpen] = useState(false);
  const addNode = useSceneFlowStore((s) => s.addNode);

  const handleAdd = (type) => {
    addNode(type, {
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
    });
    setOpen(false);
  };

  return (
    <div className="absolute bottom-6 left-6 z-10" data-testid="add-node-fab-wrapper">
      {open && (
        <div className="mb-3 bg-[#16161A] border border-[#2E2E30] rounded-2xl p-2 shadow-2xl grid grid-cols-1 gap-1 w-[200px]">
          {NODE_TYPES.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => handleAdd(type)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[#1F1F23] transition-colors group"
              data-testid={`add-${type}`}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-sm text-white font-medium">{label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] shadow-2xl shadow-[#7C3AED]/40 flex items-center justify-center transition-all hover:scale-105"
        style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}
        data-testid="add-node-fab"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
