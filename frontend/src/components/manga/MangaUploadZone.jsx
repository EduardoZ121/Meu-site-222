import { useRef, useState } from "react";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Zona de upload padrão — PNG/JPG até 5MB.
 */
export default function MangaUploadZone({
  label,
  hint,
  compact = false,
  onFile,
  onGenerateAi,
  aiPlaceholder,
  className,
}) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");

  const pick = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return;
    }
    try {
      const url = await readFileAsDataUrl(file);
      onFile?.({ url, file });
    } catch {
      /* ignore */
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) pick(f);
  };

  const runAi = async () => {
    if (!onGenerateAi || !aiText.trim()) return;
    setBusy(true);
    try {
      await onGenerateAi(aiText.trim());
      setAiText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "manga-upload-zone",
        compact && "manga-upload-zone--compact",
        drag && "manga-upload-zone--drag",
        className,
      )}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      {label && <p className="manga-upload-zone-label">{label}</p>}
      <button
        type="button"
        className="manga-upload-zone-btn"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-4 h-4 shrink-0" />
        <span>Upload PNG / JPG</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <p className="manga-upload-zone-meta">
        {hint || "Máx. 5MB · PNG com fundo transparente preferido"}
      </p>
      {onGenerateAi && (
        <div className="manga-upload-zone-ai">
          <p className="text-[11px] text-[#9CA3AF] mb-1.5">ou</p>
          <button type="button" className="manga-chip-btn w-full justify-center min-h-[44px]" onClick={() => {}}>
            <Sparkles className="w-3.5 h-3.5" />
            Gerar com IA
          </button>
          <input
            type="text"
            className="field-input w-full text-[14px] mt-2 min-h-[44px]"
            placeholder={aiPlaceholder || "Descreva o que quer gerar…"}
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !aiText.trim()}
            className="manga-pill manga-pill--active w-full mt-2 min-h-[44px] justify-center"
            onClick={runAi}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "GERAR"}
          </button>
        </div>
      )}
    </div>
  );
}

export { readFileAsDataUrl };
