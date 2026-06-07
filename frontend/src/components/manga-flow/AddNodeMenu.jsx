import { User, Users, MapPin, Box, MessageCircle, Sparkles, Camera, Square, X } from "lucide-react";

const NODE_TYPES = [
  { type: "person", icon: User, label: "Personagem principal", desc: "Personagem principal: nome, pose, emoção, foto de referência (slot 1).", color: "#9333EA", emoji: "👤" },
  { type: "support", icon: Users, label: "Suporte (secundário)", desc: "Personagem secundário com identidade própria (slot 2). Evita conflitos entre duas caixas Person.", color: "#D946EF", emoji: "🧑‍🤝‍🧑" },
  { type: "scenario", icon: MapPin, label: "Cenário / Local", desc: "Local com hora, clima, humor, iluminação.", color: "#14B8A6", emoji: "🌆" },
  { type: "object", icon: Box, label: "Objeto / Item", desc: "Item com descrição, tamanho, estado.", color: "#FACC15", emoji: "📦" },
  { type: "speech", icon: MessageCircle, label: "Balão / Diálogo", desc: "Texto, tipo de balão, estilo, direção da cauda.", color: "#60A5FA", emoji: "💬" },
  { type: "effect", icon: Sparkles, label: "Efeito / SFX", desc: "Linhas de movimento, explosão, brilhos, impacto.", color: "#FB923C", emoji: "✨" },
  { type: "camera", icon: Camera, label: "Câmara", desc: "Ângulo, enquadramento, alvo do foco.", color: "#F472B6", emoji: "📷" },
  { type: "panel", icon: Square, label: "Painel / Quadradinho", desc: "Define um painel da página: tamanho, formato, bordas.", color: "#A3A3A3", emoji: "▢" },
];

export default function AddNodeMenu({ onAdd, onClose }) {
  return (
    <div className="manga-flow-modal-overlay" onClick={onClose} data-testid="add-node-menu">
      <div className="manga-flow-modal manga-flow-modal--add" onClick={(e) => e.stopPropagation()}>
        <div className="manga-flow-modal__header">
          <h3 className="manga-flow-modal__title">Add a card</h3>
          <button onClick={onClose} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
        </div>
        <div className="manga-flow-add-grid">
          {NODE_TYPES.map(({ type, icon: Icon, label, desc, color, emoji }) => (
            <button key={type} onClick={() => onAdd(type)} className="manga-flow-add-card" style={{ borderColor: `${color}40` }} data-testid={`add-node-${type}`}>
              <div className="manga-flow-add-card__icon" style={{ background: `${color}20`, borderColor: `${color}50` }}>
                <span className="text-xl">{emoji}</span>
              </div>
              <div className="manga-flow-add-card__text">
                <p className="manga-flow-add-card__label">{label}</p>
                <p className="manga-flow-add-card__desc">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
