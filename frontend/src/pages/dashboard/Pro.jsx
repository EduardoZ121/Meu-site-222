import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, Loader2, Sparkles, Camera, Upload, X, Sliders } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import AspectPicker from "../../components/AspectPicker";
import { compressImage } from "../../lib/imageCompress";
import { fileToDataURL } from "../../lib/fileToDataURL";
import useTitle from "../../lib/useTitle";

const ASPECT_RATIOS = ["1:1", "4:5", "3:4", "9:16", "16:9", "21:9"];

const CAT_LABELS = {
  realism: "Realism Presets",
  mood:    "Mood & Style",
  enhance: "Enhancements",
};

const CAT_DESC = {
  realism: "Estética fotográfica — cinema, iPhone, studio, ultra-real",
  mood:    "Atmosfera e emoção — sedutor, intenso, romântico, divertido",
  enhance: "Refinamentos cirúrgicos — iluminação, pele, olhos, roupa, cor",
};

const errMsg = (err) =>
  err?.code === "ECONNABORTED" ? "Tempo esgotado — tenta de novo." :
  err?.response?.status === 402 ? "Créditos insuficientes." :
  err?.response?.status === 429 ? "Demasiados pedidos. Espera 1 minuto." :
  err?.response?.data?.detail || err?.message || "Falhou.";

function PhotoBox({ photo, onChange, testId }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    let c = false;
    if (!photo) { setPreview(null); return; }
    fileToDataURL(photo).then((u) => { if (!c) setPreview(u); }).catch(() => {});
    return () => { c = true; };
  }, [photo]);

  const pick = async (file) => {
    if (!file?.type?.startsWith("image/")) return;
    onChange(await compressImage(file));
  };

  return (
    <div className="w-full">
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
        className="relative aspect-[16/10] border-2 border-dashed border-[#2E2E30] hover:border-[#7C3AED]/60 bg-[#13131A]/50 rounded-md cursor-pointer transition-all flex items-center justify-center group overflow-hidden"
        data-testid={testId}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-contain p-2" />
            <button onClick={(e) => { e.stopPropagation(); onChange(null); }} className="absolute top-2 right-2 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-3">
            <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center group-hover:bg-[#7C3AED]/20 transition-colors">
              <Upload className="w-4 h-4 text-[#7C3AED]" strokeWidth={1.5} />
            </div>
            <p className="text-[#F4F1EA] text-[12px] font-medium">Drop a photo</p>
            <p className="text-[#5A5A5E] text-[10px]">JPEG, PNG ou WEBP</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export default function Pro() {
  useTitle("Pro Mode · Retoque");
  const { refresh, user } = useAuth();
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [category, setCategory] = useState("realism");
  const [preset, setPreset] = useState("ultra_real");
  const [aspect, setAspect] = useState("match");
  const [photo, setPhoto] = useState(null);
  const [intensity, setIntensity] = useState(70);
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = 18;

  // Snap back to a real ratio if photo is removed
  useEffect(() => {
    if (!photo && aspect === "match") setAspect("4:5");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  useEffect(() => {
    api.get("/public/pro-presets").then((r) => setPresets(r.data.presets || []));
  }, []);

  const cats = ["realism", "mood", "enhance"];
  const filtered = useMemo(() => presets.filter((p) => p.category === category), [presets, category]);
  const pickedPreset = presets.find((p) => p.id === preset);

  const intensityLabel = intensity < 34 ? "Subtil" : intensity > 66 ? "Intenso" : "Balanceado";

  const generate = async () => {
    if (!photo) { toast.error("Envia uma foto."); return; }
    if (!preset) { toast.error("Escolhe um preset."); return; }
    setBusy(true); setResult(null);
    try {
      const compressed = await compressImage(photo);
      const fd = new FormData();
      fd.append("photo", compressed);
      fd.append("preset_id", preset);
      fd.append("aspect_ratio", aspect);
      fd.append("extra_prompt", customPrompt.trim());
      fd.append("intensity", String(intensity));
      const { data } = await api.post("/generate/pro", fd, { timeout: 180000 });
      setResult(data.creation);
      toast.success(`Retoque aplicado · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="pro-page">
      <button onClick={() => navigate("/app/tools")} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#7C3AED]/15 flex items-center justify-center">
            <Camera className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
          </div>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em]">Pro Mode · Retoque Profissional</p>
        </div>
        <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.1] mb-3 font-['Inter_Tight']">
          Estúdio fotográfico, <span className="italic">no telemóvel</span>.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">20 presets profissionais agrupados em 3 famílias. Controla a intensidade do retoque e adiciona instruções específicas.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          {/* Step 1 — Photo */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">1 · Foto</p>
            <div className="max-w-[560px]">
              <PhotoBox photo={photo} onChange={setPhoto} testId="pro-photo" />
            </div>
          </section>

          {/* Step 2 — Category */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">2 · Família de Preset</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" data-testid="pro-cats">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`text-left p-4 border-2 rounded-md transition-all ${
                    category === c
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 shadow-md shadow-[#7C3AED]/20"
                      : "border-[#2E2E30] hover:border-[#7C3AED]/40 bg-[#13131A]"
                  }`}
                  data-testid={`procat-${c}`}
                >
                  <p className={`text-[13px] font-medium font-['Inter_Tight'] mb-1 ${category === c ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>{CAT_LABELS[c]}</p>
                  <p className="text-[#8A8A8E] text-[11px] leading-snug">{CAT_DESC[c]}</p>
                  <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-wider mt-2">{presets.filter((p) => p.category === c).length} presets</p>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 — Preset picker */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">3 · Escolhe um Preset {pickedPreset && <span className="text-[#C4B5FD] normal-case font-sans text-[12px] tracking-normal ml-2">· {pickedPreset.nome}</span>}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="pro-presets">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`relative text-left p-4 border-2 rounded-md transition-all min-h-[80px] flex flex-col justify-end ${
                    preset === p.id
                      ? "border-[#7C3AED] bg-[#7C3AED]/10"
                      : "border-[#2E2E30] hover:border-[#7C3AED]/40 bg-[#13131A]"
                  }`}
                  data-testid={`preset-${p.id}`}
                  style={{
                    background: preset === p.id
                      ? "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, #13131A 80%)"
                      : `linear-gradient(135deg, hsl(${(p.id.charCodeAt(0)*9)%360}, 30%, 18%) 0%, #13131A 70%)`,
                  }}
                >
                  <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight'] leading-tight">{p.nome}</p>
                  {preset === p.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Step 4 — Intensity slider */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED]">4 · Intensidade do Retoque</p>
              <span className="text-[#C4B5FD] text-[12px] font-medium">{intensityLabel} · {intensity}%</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-[#13131A] border border-[#2E2E30] rounded-md">
              <Sliders className="w-3.5 h-3.5 text-[#5A5A5E]" />
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(+e.target.value)}
                className="flex-1 accent-[#7C3AED] h-1"
                data-testid="pro-intensity"
              />
              <span className="text-[#5A5A5E] text-[11px] font-mono w-10 text-right">{intensity}%</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#5A5A5E] mt-1.5 px-1 font-mono">
              <span>Subtil</span>
              <span>Balanceado</span>
              <span>Intenso</span>
            </div>
          </section>

          {/* Step 5 — Custom prompt */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">5 · Instruções Extra (opcional)</p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder='Ex: "smoother skin, brighter eyes, change background to studio gray"'
              className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-md focus:outline-none resize-none transition-colors"
              data-testid="pro-custom"
            />
          </section>

          {/* Step 6 — Aspect ratio */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">6 · Formato</p>
            <AspectPicker value={aspect} onChange={setAspect} hasPhoto={!!photo} testIdPrefix="pro-aspect" />
          </section>
        </div>

        {/* RIGHT */}
        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Resultado</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="A versão Pro aparece aqui." />
        </aside>
      </div>

      {/* Sticky CTA */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[12px]">
            <span className="text-[#8A8A8E]">Credits required:</span>
            <span className="text-[#C4B5FD] font-medium text-[16px]">{cost}</span>
            <span className="text-[#5A5A5E] mx-2">·</span>
            <span className="text-[#8A8A8E]">Saldo:</span>
            <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
          </div>
          <button
            onClick={generate}
            disabled={busy}
            className="flex-1 sm:flex-initial sm:min-w-[280px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:from-[#1A1A1C] disabled:to-[#1A1A1C] disabled:text-[#5A5A5E] text-white py-3.5 rounded-md text-[13px] font-medium tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50"
            data-testid="pro-create"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A retocar...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Aplicar Retoque · {cost} créditos</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
