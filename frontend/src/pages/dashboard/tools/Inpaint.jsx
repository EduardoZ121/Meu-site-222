import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import ToolFrame from "../../../components/ToolFrame";
import { Brush, Eraser } from "lucide-react";
import { compressImage } from "../../../lib/imageCompress";
import { fileToDataURL } from "../../../lib/fileToDataURL";

const errMsg = (err) =>
  err?.code === "ECONNABORTED" ? "Tempo esgotado — tenta de novo." :
  err?.response?.status === 402 ? "Créditos insuficientes." :
  err?.response?.data?.detail || err?.message || "Falhou.";

/**
 * Inpaint tool — user uploads photo, paints over the region they want changed,
 * then provides a prompt describing the replacement.
 */
export default function Inpaint() {
  const { refresh } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [brushSize, setBrushSize] = useState(40);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const cost = 12;

  useEffect(() => {
    let cancelled = false;
    if (!photo) { setPhotoUrl(null); return; }
    fileToDataURL(photo).then((u) => { if (!cancelled) setPhotoUrl(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, [photo]);

  const initCanvas = () => {
    const img = imgRef.current;
    const c = canvasRef.current;
    if (!img || !c) return;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);
  };

  const draw = (e) => {
    if (!drawing) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * (c.width / rect.width);
    const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) * (c.height / rect.height);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearMask = () => initCanvas();

  const run = async () => {
    if (!photo) { toast.error("Envia uma imagem."); return; }
    if (prompt.trim().length < 3) { toast.error("Descreve o que queres pôr na zona pintada."); return; }
    const c = canvasRef.current;
    if (!c) { toast.error("Pinta primeiro a zona a alterar."); return; }
    setBusy(true); setResult(null);
    try {
      const maskBlob = await new Promise((res) => c.toBlob(res, "image/png"));
      const photoCompressed = await compressImage(photo);
      const fd = new FormData();
      fd.append("photo", photoCompressed);
      fd.append("mask", new File([maskBlob], "mask.png", { type: "image/png" }));
      fd.append("prompt", prompt.trim());
      const { data } = await api.post("/tools/inpaint", fd, { timeout: 240000 });
      setResult(data.creation);
      toast.success(`Editado · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) { toast.error(errMsg(err), { duration: 8000 }); }
    finally { setBusy(false); }
  };

  return (
    <ToolFrame
      testId="inpaint"
      title="Inpaint / Remover Objeto"
      subtitle="Pinta a zona que queres alterar e escreve o que pôr no lugar. Para apagar objetos, escreve apenas 'background'."
      photo={photo} onPhotoChange={setPhoto}
      prompt={prompt} onPromptChange={setPrompt}
      promptLabel="O que pôr na zona pintada"
      ideas={["background", "blue sky", "wooden floor", "natural grass", "remove object"]}
      aspectRatios={null}
      aspect={aspect} onAspectChange={setAspect}
      cost={cost}
      busy={busy} result={result} onResultChange={setResult}
      onCreate={run}
      extraFields={
        photoUrl && (
          <section>
            <label className="block text-[#F4F1EA] text-[14px] font-medium mb-3 font-['Inter_Tight']">Pinta a zona a alterar</label>
            <div className="relative bg-[#13131A] rounded-md overflow-hidden border border-[#2E2E30]" data-testid="inpaint-canvas-wrapper">
              <img ref={imgRef} src={photoUrl} alt="" className="w-full block" onLoad={initCanvas} />
              <canvas
                ref={canvasRef}
                onMouseDown={() => setDrawing(true)}
                onMouseUp={() => setDrawing(false)}
                onMouseLeave={() => setDrawing(false)}
                onMouseMove={draw}
                onTouchStart={(e) => { setDrawing(true); draw(e); }}
                onTouchEnd={() => setDrawing(false)}
                onTouchMove={(e) => { e.preventDefault(); draw(e); }}
                className="absolute inset-0 w-full h-full opacity-60 cursor-crosshair touch-none mix-blend-screen"
              />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-[12px] text-[#8A8A8E]">
                <Brush className="w-3.5 h-3.5" /> Pincel:
                <input type="range" min="10" max="80" value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} className="accent-[#7C3AED]" />
                <span className="font-mono">{brushSize}px</span>
              </div>
              <button onClick={clearMask} className="flex items-center gap-1.5 text-[#8A8A8E] hover:text-[#F4F1EA] text-[12px]">
                <Eraser className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>
          </section>
        )
      }
    />
  );
}
