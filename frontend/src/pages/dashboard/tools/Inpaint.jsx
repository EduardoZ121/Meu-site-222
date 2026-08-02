import { useRef, useState } from "react";
import { Brush, Eraser } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { uploadPost } from "../../../lib/api";
import { useStudioI18n } from "../../../lib/useStudioI18n";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import CompactImagePicker from "../../../components/studio/CompactImagePicker";
import GenerationBubble from "../../../components/studio/GenerationBubble";
import StudioCompactShell from "../../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../../components/studio/StudioInlineHeader";
import StudioGenerateBar from "../../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../../components/StudioGenerateCostMeta";
import StudioHelpTip from "../../../components/studio/StudioHelpTip";
import { useStudioGenerateGate } from "../../../lib/useStudioGenerateGate";
import { primaryStudioPhoto } from "../../../lib/studioFormData";
import { useStudioSessionBack } from "../../../lib/useStudioSessionBack";
import { useStudioMediaPreview } from "../../../hooks/useStudioMediaPreview";
import { PROMPT_MAX_LENGTH } from "../../../lib/promptLimits";
import { useI18n } from "../../../lib/i18n";
import { useLocalizedTools } from "../../../lib/useLocalizedTools";
import useTitle from "../../../lib/useTitle";

const PROMPT_IDEAS = ["background", "blue sky", "wooden floor", "natural grass", "remove object"];

export default function Inpaint() {
  const { t } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  const tools = useLocalizedTools();
  const tool = tools.find((x) => x.id === "inpaint");
  const navigate = useNavigate();
  useTitle(tool?.name || t("tool_inpaint_name"));
  const { refresh, user } = useAuth();
  const { costs } = usePricing();

  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const { previewUrl: photoUrl } = useStudioMediaPreview(photo);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [brushSize, setBrushSize] = useState(40);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const cost = costs.inpaint;

  useStudioSessionBack("/app/tools");

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    requirePrompt: true,
    prompt,
  });

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
    if (!photo) { toast.error(t("pro_upload_photo")); return; }
    const finalPrompt = prompt.trim();
    if (finalPrompt.length < 3) { toast.error(t("tool_prompt_ph")); return; }
    const c = canvasRef.current;
    if (!c) { toast.error(t("inpaint_paint_first")); return; }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const maxSide = 640;
      const w = c.width;
      const h = c.height;
      const scale = Math.max(w, h) > maxSide ? maxSide / Math.max(w, h) : 1;
      const tc = document.createElement("canvas");
      tc.width = Math.max(1, Math.round(w * scale));
      tc.height = Math.max(1, Math.round(h * scale));
      const tctx = tc.getContext("2d");
      tctx.imageSmoothingEnabled = true;
      tctx.drawImage(c, 0, 0, tc.width, tc.height);
      const maskBlob = await new Promise((res) => tc.toBlob(res, "image/png"));
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("mask", new File([maskBlob], "mask.png", { type: "image/png" }));
      fd.append("prompt", finalPrompt);
      const { data } = await uploadPost("/tools/inpaint", fd, { timeout: 240000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("pro_no_result"));
      setResult(creation);
      toast.success(t("studio_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  };

  const onPhotosChange = (next) => {
    setPhotos(next);
    setResult(null);
  };

  return (
    <StudioCompactShell testId="inpaint" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        title={tool?.name || t("tool_inpaint_name")}
        description={tool?.desc || t("tool_inpaint_desc")}
        testId="inpaint-header"
        helpKey="help_tool_inpaint"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("tool_inpaint_desc")}
          </p>
          <CompactImagePicker value={photos} onChange={onPhotosChange} maxFiles={1} testId="inpaint-photo" />
        </div>

        {photoUrl && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
            <label className="flex items-center gap-2 text-[#F4F1EA] text-[13px] font-medium mb-3 font-display">
              {t("inpaint_paint_zone")}
              <StudioHelpTip helpKey="help_sec_inpaint_mask" testId="inpaint-mask-help" />
            </label>
            <div className="relative bg-[#13131A] rounded-xl overflow-hidden border border-[#2E2E30]" data-testid="inpaint-canvas-wrapper">
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
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-[12px] text-[#8A8A8E] min-w-0 flex-1">
                <Brush className="w-3.5 h-3.5 shrink-0" />
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={brushSize}
                  onChange={(e) => setBrushSize(+e.target.value)}
                  className="flex-1 accent-[#7C3AED] min-w-[120px]"
                  data-testid="inpaint-brush-range"
                />
                <span className="font-mono tabular-nums shrink-0">{brushSize}px</span>
              </div>
              <button
                type="button"
                onClick={clearMask}
                className="inline-flex items-center gap-1.5 text-[#8A8A8E] hover:text-[#F4F1EA] text-[12px] px-3 py-2 rounded-lg border border-[#2E2E30]"
                data-testid="inpaint-clear-mask"
              >
                <Eraser className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <label className="block text-[#9CA3AF] text-[12px] mb-2">{t("inpaint_prompt_label")}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            maxLength={PROMPT_MAX_LENGTH}
            placeholder={t("tool_prompt_ph")}
            className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px] w-full"
            data-testid="inpaint-prompt"
          />
          <div className="flex flex-wrap gap-2 mt-2.5">
            {PROMPT_IDEAS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setPrompt(s)}
                className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={run}
              label={`${t("tool_inpaint_name").split("/")[0].trim()} · ${cost} ${t("label_credits")}`}
              busyLabel={t("common_processing")}
              hint={hint}
              cost={cost}
              testId="inpaint-create-btn"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
