import { User, MapPin, Box, X } from "lucide-react";

const NODE_TYPES = [
  {
    type: "person",
    icon: User,
    label: "Person / Character",
    desc: "A character with pose, emotion, speech bubbles, clothing, and reference photo.",
    color: "#9333EA",
  },
  {
    type: "scenario",
    icon: MapPin,
    label: "Scenario / Place",
    desc: "A location with time of day, weather, mood, and reference image.",
    color: "#14B8A6",
  },
  {
    type: "object",
    icon: Box,
    label: "Object / Item",
    desc: "An item like a weapon, letter, phone — with description and size.",
    color: "#FACC15",
  },
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
          {NODE_TYPES.map(({ type, icon: Icon, label, desc, color }) => (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="manga-flow-add-card"
              style={{ borderColor: `${color}40` }}
              data-testid={`add-node-${type}`}
            >
              <div className="manga-flow-add-card__icon" style={{ background: `${color}20`, borderColor: `${color}50` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <p className="manga-flow-add-card__label">{label}</p>
              <p className="manga-flow-add-card__desc">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
