import { useState } from "react";
import { X, Variable, Plus, Trash2 } from "lucide-react";

export default function GlobalVarsModal({ vars, onChange, onClose }) {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const entries = Object.entries(vars || {});

  const addVar = () => {
    if (!newKey.trim()) return;
    onChange({ ...vars, [newKey.trim()]: newVal });
    setNewKey(""); setNewVal("");
  };
  const removeVar = (key) => {
    const next = { ...vars };
    delete next[key];
    onChange(next);
  };
  const updateVar = (key, value) => {
    onChange({ ...vars, [key]: value });
  };

  return (
    <div className="manga-flow-modal-overlay" onClick={onClose}>
      <div className="manga-flow-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="manga-flow-modal__header">
          <Variable className="w-5 h-5 text-[#FACC15]" />
          <h3 className="manga-flow-modal__title">Global Variables</h3>
          <button onClick={onClose} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
        </div>
        <div style={{ padding: "12px 20px 20px" }}>
          <p className="text-[11px] text-[#5A5A5E] mb-3">Variables shared across all cards. Use in prompts as {"{variable_name}"}.</p>
          <div className="flex gap-2 mb-4">
            <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="name..." className="mfi-input flex-1" />
            <input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder="value..." className="mfi-input flex-1" />
            <button onClick={addVar} className="manga-flow-btn manga-flow-btn-primary" style={{ whiteSpace: "nowrap" }}><Plus className="w-4 h-4" /></button>
          </div>
          <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
            {!entries.length ? (
              <p className="text-[#5A5A5E] text-[13px] text-center py-4">No variables yet.</p>
            ) : entries.map(([key, val]) => (
              <div key={key} className="mf-var-row">
                <span className="mf-var-row__key">{key}</span>
                <span className="mf-var-row__eq">=</span>
                <input value={val} onChange={(e) => updateVar(key, e.target.value)} className="mf-var-row__val" />
                <button onClick={() => removeVar(key)} className="mf-var-row__del"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
