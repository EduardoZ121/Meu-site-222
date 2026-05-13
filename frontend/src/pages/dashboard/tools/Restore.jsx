import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import ToolFrame from "../../../components/ToolFrame";

const errMsg = (err) =>
  err?.code === "ECONNABORTED" ? "Tempo esgotado — tenta de novo." :
  err?.response?.status === 402 ? "Créditos insuficientes." :
  err?.response?.data?.detail || err?.message || "Falhou.";

export default function Restore() {
  const { refresh } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = 8;

  const run = async () => {
    if (!photo) { toast.error("Envia uma foto antiga."); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      const { data } = await api.post("/tools/restore", fd, { timeout: 180000 });
      setResult(data.creation);
      toast.success(`Restaurado · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) { toast.error(errMsg(err), { duration: 8000 }); }
    finally { setBusy(false); }
  };

  return (
    <ToolFrame
      testId="restore"
      title="Photo Restoration"
      subtitle="Recupera fotos antigas, rostos nítidos, cores naturais. Ideal para retratos de família."
      photo={photo} onPhotoChange={setPhoto}
      promptLabel={null}
      aspectRatios={null}
      cost={cost}
      busy={busy} result={result} onResultChange={setResult}
      onCreate={run}
    />
  );
}
