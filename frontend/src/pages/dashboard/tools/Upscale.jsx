import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import ToolFrame from "../../../components/ToolFrame";

const errMsg = (err) => {
  if (err?.code === "ECONNABORTED") return "Tempo esgotado — tenta de novo.";
  if (err?.response?.status === 402) return "Créditos insuficientes.";
  if (err?.response?.data?.detail) return typeof err.response.data.detail === "string" ? err.response.data.detail : "Erro inesperado.";
  return err?.message || "Falhou.";
};

export default function Upscale() {
  const { refresh } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = 8;

  const run = async () => {
    if (!photo) { toast.error("Envia uma imagem."); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("scale", String(scale));
      const { data } = await api.post("/tools/upscale", fd, { timeout: 180000 });
      setResult(data.creation);
      toast.success(`Upscaled ${scale}× · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) { toast.error(errMsg(err), { duration: 8000 }); }
    finally { setBusy(false); }
  };

  return (
    <ToolFrame
      testId="upscale"
      title="AI Image Upscaler"
      subtitle="Aumenta a resolução até 4× preservando detalhes finos."
      photo={photo} onPhotoChange={setPhoto}
      promptLabel={null}
      aspectRatios={null}
      cost={cost}
      busy={busy} result={result} onResultChange={setResult}
      onCreate={run}
      extraFields={
        <section>
          <label className="block text-[#F4F1EA] text-[14px] font-medium mb-3 font-['Inter_Tight']">Scale Factor</label>
          <div className="grid grid-cols-2 gap-2 max-w-[280px]">
            {[2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`py-3 border-2 rounded-md text-[14px] font-medium transition-all ${
                  scale === s ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#C4B5FD]" : "border-[#2E2E30] text-[#8A8A8E] hover:border-[#7C3AED]/40 hover:text-[#F4F1EA]"
                }`}
                data-testid={`upscale-scale-${s}`}
              >
                {s}× Resolution
              </button>
            ))}
          </div>
        </section>
      }
    />
  );
}
