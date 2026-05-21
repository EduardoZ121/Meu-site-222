import { useState } from "react";
import { HelpCircle } from "lucide-react";

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function Card({ title, hint, children }) {
  return (
    <section className="ms-card">
      {title && <h2>{title}</h2>}
      {hint && <p className="ms-hint">{hint}</p>}
      {children}
    </section>
  );
}

export function Btn({ children, onClick, variant, disabled, className = "" }) {
  const v = variant === "primary" ? "ms-btn--primary" : variant === "warn" ? "ms-btn--warn" : "";
  return (
    <button type="button" className={`ms-btn ${v} ${className}`.trim()} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Chips({ options, value, onChange, tile }) {
  return (
    <div className="ms-chips">
      {options.map((opt) => {
        const id = opt.id ?? opt;
        const label = opt.label ?? opt;
        const emoji = opt.emoji;
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            className={`ms-chip ${tile ? "ms-chip--tile" : ""} ${on ? "ms-chip--on" : ""}`.trim()}
            onClick={() => onChange(id)}
          >
            {emoji && <span>{emoji}</span>}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, value, onChange, as = "input", options }) {
  if (as === "select") {
    return (
      <>
        {label && <span className="ms-label">{label}</span>}
        <select className="ms-field" value={value || ""} onChange={(e) => onChange(e.target.value)}>
          {options}
        </select>
      </>
    );
  }
  return (
    <>
      {label && <span className="ms-label">{label}</span>}
      <input className="ms-field" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </>
  );
}

export function TextArea({ label, value, onChange, placeholder }) {
  return (
    <>
      {label && <span className="ms-label">{label}</span>}
      <textarea
        className="ms-field ms-textarea"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}

export function Upload({ label, hint, onFile }) {
  return (
    <div className="ms-upload">
      {label && <p className="text-[0.8rem] text-[#c4b5fd] mb-1">{label}</p>}
      <label>
        ⬆️ Upload PNG / JPG
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f || f.size > 5 * 1024 * 1024) return;
            const url = await readImageFile(f);
            onFile?.({ url, file: f });
            e.target.value = "";
          }}
        />
      </label>
      <small>{hint || "Máx. 5MB · fundo transparente preferido"}</small>
    </div>
  );
}

export function Section({ id, title, open, onToggle, children }) {
  return (
    <div className="ms-section">
      <button type="button" className="ms-section-head" onClick={() => onToggle(id)}>
        <span>{open ? "▼" : "▶"} {title}</span>
      </button>
      {open && <div className="ms-section-body">{children}</div>}
    </div>
  );
}

export function HelpTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="ms-help"
        aria-label="Ajuda"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      {show && (
        <span
          role="tooltip"
          className="absolute z-20 left-0 top-full mt-1 w-64 p-3 text-[0.75rem] leading-snug rounded-lg border border-[#8b5cf6] bg-[#1a1a2e] text-[#e2e8f0] shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
