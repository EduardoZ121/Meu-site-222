import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function SettingModal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="rp-modal-backdrop" onClick={onClose} role="presentation" data-testid="setting-modal">
      <div
        className="rp-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="rp-modal-head">
          <span className="text-[13px] font-semibold text-[#F4F1EA]">{title}</span>
          <button type="button" onClick={onClose} className="rp-modal-x" aria-label="Fechar" data-testid="setting-modal-close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="rp-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
