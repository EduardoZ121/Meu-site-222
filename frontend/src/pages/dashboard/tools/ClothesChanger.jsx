import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, Sparkles, Upload, X, Shirt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { compressImage } from "../../../lib/imageCompress";
import { fileToDataURL } from "../../../lib/fileToDataURL";
import ResultPanel from "../../../components/ResultPanel";
import useTitle from "../../../lib/useTitle";

const STYLE_PRESETS = [
  { id: "casual",      label: "Casual",      desc: "white t-shirt, blue jeans, sneakers" },
  { id: "formal",      label: "Formal",      desc: "elegant black suit, white shirt, leather shoes" },
  { id: "streetwear",  label: "Streetwear",  desc: "oversized hoodie, baggy cargo pants, high-top sneakers" },
  { id: "luxury",      label: "Luxury",      desc: "designer outfit, silk shirt, gold accessories, premium look" },
  { id: "sport",       label: "Sport",       desc: "athletic gym wear, performance fabric, sportswear" },
  { id: "evening",     label: "Evening",     desc: "elegant evening dress, satin fabric, sophisticated styling" },
  { id: "vintage",     label: "Vintage",     desc: "70s vintage fashion, retro pattern, classic tailoring" },
  { id: "business",    label: "Business",    desc: "navy blazer, crisp shirt, tailored trousers" },
];

const CHANGE_TYPES = [
  { id: "full",  label: "Trocar roupa toda",     hint: "Substitui o outfit completo" },
  { id: "piece", label: "Adicionar peça",         hint: "Jaqueta, calças, sapatos, acessório" },
  { id: "color", label: "Mudar cor/estilo",       hint: "Mantém a roupa, muda só cor ou padrão" },
];

const errMsg = (err) =>
  err?.code === "ECONNABORTED" ? "Tempo esgotado — tenta de novo." :
  err?.response?.status === 402 ? "Créditos insuficientes." :
  err?.response?.status === 429 ? "Demasiados pedidos. Espera 1 minuto." :
  err?.response?.data?.detail || err?.message || "Falhou.";

function PhotoBox({ photo, onChange, label, helper, testId }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancel = false;
    if (!photo) { setPreview(null); return; }
    fileToDataURL(photo).then((u) => { if (!cancel) setPreview(u); }).catch(() => {});
    return () => { cancel = true; };
  }, [photo]);

  const pick = async (file) => {
    if (!file?.type?.startsWith("image/")) return;
    onChange(await compressImage(file));
  };

  return (
    <div className="w-full">
      <label className="block text-[#F4F1EA] text-[13px] font-medium mb-2 font-['Inter_Tight']">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
        className="relative aspect-square border-2 border-dashed border-[#2E2E30] hover:border-[#7C3AED]/60 bg-[#13131A]/50 rounded-md cursor-pointer transition-all flex items-center justify-center group overflow-hidden"
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
            <p className="text-[#F4F1EA] text-[12px] font-medium">Clique para enviar</p>
            <p className="text-[#5A5A5E] text-[10px]">{helper}</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export default function ClothesChanger() {
  useTitle("AI Clothes Changer");
  const { refresh, user } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [garment, setGarment] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [changeType, setChangeType] = useState("full");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = 12;

  const applyPreset = (preset) => {
    setPrompt(preset.desc);
  };

  // Auto-switch is no longer needed — backend automatically uses Grok side-by-side
  // composition when a garment is uploaded, regardless of change_type.

  const run = async () => {
    if (!photo) { toast.error("Envia uma foto da pessoa."); return; }
    if (!garment && prompt.trim().length < 3) {
      toast.error("Envia uma foto da roupa OU descreve a roupa nova no campo de texto.");
      return;
    }
    if ((user?.credits ?? 0) < cost) {
      toast.error(`Precisas de ${cost} créditos. Tens ${user?.credits ?? 0}.`);
      return;
    }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      if (garment) fd.append("garment", garment);
      fd.append("prompt", prompt.trim());
      fd.append("change_type", changeType);
      const { data } = await api.post("/tools/clothes", fd, { timeout: 240000 });
      setResult(data.creation);
      toast.success(`Nova roupa pronta · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="clothes-page">
      <button onClick={() => navigate("/app/tools")} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#7C3AED]/15 flex items-center justify-center">
            <Shirt className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
          </div>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em]">AI Clothes Changer</p>
        </div>
        <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.1] mb-3 font-['Inter_Tight']">
          Troca a roupa de qualquer foto.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">Envia foto da pessoa. Envia foto da roupa OU descreve em palavras. O modelo preserva o rosto e a pose.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          {/* Step 1 — photos */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">1 · Fotos</p>
            <div className="grid grid-cols-2 gap-3 max-w-[600px]">
              <PhotoBox photo={photo} onChange={setPhoto} label="Pessoa *" helper="Foto frontal nítida" testId="clothes-photo" />
              <PhotoBox photo={garment} onChange={setGarment} label="Roupa de referência (opcional)" helper="Foto da peça para vestir" testId="clothes-garment" />
            </div>
          </section>

          {/* Step 2 — change type */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">2 · Tipo de mudança</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="change-types">
              {CHANGE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setChangeType(t.id)}
                  className={`text-left p-4 border-2 rounded-md transition-all ${
                    changeType === t.id
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 shadow-md shadow-[#7C3AED]/20"
                      : "border-[#2E2E30] hover:border-[#7C3AED]/40 bg-[#13131A]"
                  }`}
                  data-testid={`change-type-${t.id}`}
                >
                  <p className={`text-[14px] font-medium font-['Inter_Tight'] mb-1 ${changeType === t.id ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>{t.label}</p>
                  <p className="text-[#8A8A8E] text-[11px]">{t.hint}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 — quick presets */}
          {!garment && (
            <section>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">3 · Inspirações rápidas</p>
              <div className="flex flex-wrap gap-2" data-testid="presets">
                {STYLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="px-4 py-2 border border-[#2E2E30] hover:border-[#7C3AED] text-[#8A8A8E] hover:text-[#C4B5FD] hover:bg-[#7C3AED]/5 text-[12px] font-medium rounded-full transition-all"
                    data-testid={`preset-${p.id}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Step 4 — prompt */}
          {!garment && (
            <section>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">{garment ? "3" : "4"} · Descreve a roupa</p>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder='Ex: "elegant red silk dress with thin straps, evening event style"'
                  className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-3.5 rounded-md focus:outline-none resize-none transition-colors"
                  data-testid="clothes-prompt"
                />
                <span className="absolute bottom-3 right-3 text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/500</span>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT */}
        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Resultado</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="A nova roupa aparece aqui." />
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
            onClick={run}
            disabled={busy}
            className="flex-1 sm:flex-initial sm:min-w-[260px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:from-[#1A1A1C] disabled:to-[#1A1A1C] disabled:text-[#5A5A5E] text-white py-3.5 rounded-md text-[13px] font-medium tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50"
            data-testid="clothes-create"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A vestir...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Gerar Nova Roupa · {cost} créditos</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
