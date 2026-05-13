import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import ToolFrame from "../../../components/ToolFrame";

const errMsg = (err) => {
  if (err?.code === "ECONNABORTED") return "Tempo esgotado — tenta de novo.";
  if (err?.response?.status === 402) return "Créditos insuficientes.";
  if (err?.response?.status === 429) return "Demasiados pedidos. Espera 1 minuto.";
  if (err?.response?.data?.detail) return typeof err.response.data.detail === "string" ? err.response.data.detail : "Erro inesperado.";
  return err?.message || "Falhou.";
};

export default function BgRemove() {
  const { refresh } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = 5;

  const run = async () => {
    if (!photo) { toast.error("Envia uma imagem."); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      const { data } = await api.post("/tools/bg-remove", fd, { timeout: 180000 });
      setResult(data.creation);
      toast.success(`Fundo removido · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) { toast.error(errMsg(err), { duration: 8000 }); }
    finally { setBusy(false); }
  };

  return (
    <ToolFrame
      testId="bg-remove"
      title="AI Background Remover"
      subtitle="Recorta o sujeito da imagem com precisão. Resultado em PNG transparente."
      photo={photo} onPhotoChange={setPhoto}
      promptLabel={null}
      aspectRatios={null}
      cost={cost}
      busy={busy} result={result} onResultChange={setResult}
      onCreate={run}
    />
  );
}
