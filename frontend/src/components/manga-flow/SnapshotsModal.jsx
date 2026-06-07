import { useState } from "react";
import { X, History, Camera, Trash2, RotateCcw } from "lucide-react";

export default function SnapshotsModal({ snapshots, onSave, onRestore, onDelete, onClose }) {
  const [name, setName] = useState("");

  return (
    <div className="manga-flow-modal-overlay" onClick={onClose} data-testid="snapshots-modal">
      <div className="manga-flow-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="manga-flow-modal__header">
          <History className="w-5 h-5 text-[#A855F7]" />
          <h3 className="manga-flow-modal__title">Snapshots</h3>
          <button onClick={onClose} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
        </div>
        <div style={{ padding: "12px 20px" }}>
          <div className="flex gap-2 mb-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Snapshot name..." className="mfi-input flex-1" />
            <button onClick={() => { onSave(name || `Snapshot ${(snapshots?.length || 0) + 1}`); setName(""); }} className="manga-flow-btn manga-flow-btn-primary" style={{ whiteSpace: "nowrap" }}>
              <Camera className="w-4 h-4" /> Save
            </button>
          </div>
          <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
            {(!snapshots || !snapshots.length) ? (
              <p className="text-[#5A5A5E] text-[13px] text-center py-6">No snapshots yet. Save one to create a restore point.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {snapshots.map((snap, i) => (
                  <div key={i} className="mf-snap-item">
                    <div className="mf-snap-item__info">
                      <span className="mf-snap-item__name">{snap.name}</span>
                      <span className="mf-snap-item__meta">{snap.nodeCount} cards · {new Date(snap.timestamp).toLocaleString()}</span>
                    </div>
                    <button onClick={() => onRestore(i)} className="mf-snap-item__btn" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDelete(i)} className="mf-snap-item__btn mf-snap-item__btn--danger" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
