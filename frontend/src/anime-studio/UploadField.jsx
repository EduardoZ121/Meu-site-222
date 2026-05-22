import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function UploadField({ label, hint, onFile, aiHint, onAiGenerate }) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const runAi = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Descreve a imagem para gerar");
      return;
    }
    if (onAiGenerate) {
      setAiBusy(true);
      try {
        const url = await onAiGenerate(aiPrompt.trim());
        if (url) onFile?.({ url });
      } catch (e) {
        toast.error(e?.message || "Falha ao gerar imagem");
      } finally {
        setAiBusy(false);
      }
      return;
    }
    toast.info("Gera a imagem no painel principal com o prompt composto — ou faz upload manual.");
  };

  return (
    <div className="mf-upload">
      {label && <p className="text-[0.8rem] text-[#c4b5fd] mb-1">{label}</p>}
      <label className="mf-upload-zone">
        ⬆️ Arraste ou clique para upload
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 5 * 1024 * 1024) {
              toast.error("Máximo 5MB");
              return;
            }
            const url = await readImageFile(f);
            onFile?.({ url, file: f });
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-[0.65rem] text-[#5a5a5e] mt-1">
        {hint || "PNG/JPG · Máx 5MB · Fundo transparente preferido"}
      </p>

      <div className="mf-upload-ai">
        <p className="text-[0.75rem] text-[#c4b5fd] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
        </p>
        <input
          className="mf-field"
          placeholder={aiHint || "Descreve a imagem…"}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button type="button" className="mf-btn mf-btn--primary w-full mt-1" disabled={aiBusy} onClick={runAi}>
          {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          GERAR
        </button>
      </div>
    </div>
  );
}
