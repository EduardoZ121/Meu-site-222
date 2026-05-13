import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Upload, History, Download, X, Sparkles,
  Check, Move, RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { compressImage } from "../../../lib/imageCompress";
import { fileToDataURL } from "../../../lib/fileToDataURL";

const errMsg = (err) => {
  if (err?.code === "ECONNABORTED") return "Tempo esgotado — tenta de novo.";
  if (err?.response?.status === 402) return "Créditos insuficientes.";
  if (err?.response?.status === 429) return "Demasiados pedidos. Espera 1 minuto.";
  if (err?.response?.data?.detail)
    return typeof err.response.data.detail === "string"
      ? err.response.data.detail
      : "Erro inesperado.";
  return err?.message || "Falhou.";
};

const LEVELS = [
  { key: "leve",     label: "Leve",     hint: "Toque subtil · preserva grão original" },
  { key: "medio",    label: "Médio",    hint: "Equilíbrio profissional · uso geral" },
  { key: "profundo", label: "Profundo", hint: "Restauro completo · fotos muito danificadas" },
];

const PROMPT_IDEAS = [
  "restaurar foto antiga de 1970, melhorar rosto da criança",
  "remover dobras e manchas amareladas",
  "preservar a expressão da minha avó",
  "foto de casamento dos anos 60 com cores naturais",
];

export default function Restore() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const fileRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [level, setLevel] = useState("medio");
  const [enhanceFaces, setEnhanceFaces] = useState(true);
  const [recoverColors, setRecoverColors] = useState(true);
  const [removeNoise, setRemoveNoise] = useState(true);
  const [sharpen, setSharpen] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = 8;

  useEffect(() => {
    let cancelled = false;
    if (!photo) { setPhotoPreview(null); return; }
    fileToDataURL(photo).then((u) => { if (!cancelled) setPhotoPreview(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, [photo]);

  const handlePick = async (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    setResult(null);
    const compressed = await compressImage(file);
    setPhoto(compressed);
  };

  const reset = () => { setPhoto(null); setPhotoPreview(null); setResult(null); };

  const run = async () => {
    if (!photo) { toast.error("Envia a foto antiga primeiro."); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("level", level);
      fd.append("enhance_faces", enhanceFaces ? "true" : "false");
      fd.append("recover_colors", recoverColors ? "true" : "false");
      fd.append("remove_noise", removeNoise ? "true" : "false");
      fd.append("sharpen", sharpen ? "true" : "false");
      fd.append("custom_prompt", customPrompt);
      const { data } = await api.post("/tools/restore", fd, { timeout: 240000 });
      const url = data.creation?.result_urls?.[0];
      if (!url) throw new Error("Sem resultado");
      setResult({ url, id: data.creation.id, level });
      toast.success(`Foto restaurada · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="restore-frame">
      <button
        onClick={() => navigate("/app/tools")}
        className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium transition-colors"
        data-testid="restore-back"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      {/* Hero header */}
      <div className="mb-12 flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
          <History className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.05] mb-2 font-['Inter_Tight']">
            Photo Restoration
          </h1>
          <p className="text-[#8A8A8E] text-[15px] max-w-[640px] leading-relaxed">
            Recupera fotos antigas, rostos nítidos, cores naturais. Ideal para retratos de família,
            álbuns dos avós e impressões danificadas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-10">
        <div className="space-y-10">
          {/* 1) UPLOAD */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <label className="text-[#F4F1EA] text-[13px] font-medium uppercase tracking-[0.16em] font-['Inter_Tight']">
                01 · Foto Original
              </label>
              {photo && (
                <button
                  onClick={reset}
                  className="text-[#5A5A5E] hover:text-[#7C3AED] text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  data-testid="restore-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Trocar foto
                </button>
              )}
            </div>
            <div
              onClick={() => !photoPreview && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handlePick(e.dataTransfer.files?.[0]); }}
              className={`relative ${photoPreview ? "aspect-[16/10]" : "aspect-[2/1]"} rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                photoPreview
                  ? "border-[#2E2E30] bg-[#0E0E12]"
                  : "border-[#2E2E30] hover:border-[#7C3AED]/70 bg-gradient-to-br from-[#13131A] via-[#0E0E12] to-[#0B0B0C] cursor-pointer group"
              }`}
              data-testid="restore-upload-area"
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-contain p-4" />
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute top-4 right-4 w-9 h-9 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black z-10"
                    data-testid="restore-clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.10),transparent_60%)] pointer-events-none" />
                  <div className="relative w-20 h-20 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 flex items-center justify-center group-hover:bg-[#7C3AED]/20 group-hover:border-[#7C3AED]/50 transition-all">
                    <Upload className="w-8 h-8 text-[#C4B5FD]" strokeWidth={1.5} />
                  </div>
                  <p className="relative text-[#F4F1EA] text-[20px] font-light tracking-[-0.01em] font-['Inter_Tight']">
                    Click to upload an image
                  </p>
                  <p className="relative text-[#8A8A8E] text-[13px]">
                    Envia o scan ou foto digitalizada do retrato antigo
                  </p>
                  <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.18em]">
                    JPEG · PNG · WEBP · até 15 MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePick(e.target.files?.[0])}
              data-testid="restore-upload-input"
            />
          </section>

          {/* 2) LEVEL */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              02 · Nível de Restauração
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="restore-levels">
              {LEVELS.map(({ key, label, hint }) => (
                <button
                  key={key}
                  onClick={() => setLevel(key)}
                  data-testid={`restore-level-${key}`}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                    level === key
                      ? "border-[#7C3AED] bg-[#7C3AED]/10"
                      : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
                  }`}
                >
                  {level === key && (
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
                  )}
                  <div className="relative flex items-start justify-between mb-2">
                    <IntensityBars active={level === key} index={LEVELS.findIndex(l => l.key === key)} />
                    {level === key && (
                      <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className={`relative text-[16px] font-light tracking-[-0.01em] mb-1 font-['Inter_Tight'] ${
                    level === key ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
                  }`}>{label}</p>
                  <p className="relative text-[#8A8A8E] text-[11.5px] leading-snug">{hint}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 3) TOGGLES */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-4 uppercase tracking-[0.16em] font-['Inter_Tight']">
              03 · Opções Avançadas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Toggle
                active={enhanceFaces}
                onClick={() => setEnhanceFaces(!enhanceFaces)}
                label="Melhorar rostos e pele"
                hint="Define olhos, lábios, sobrancelhas e textura natural da pele."
                testId="restore-toggle-faces"
              />
              <Toggle
                active={recoverColors}
                onClick={() => setRecoverColors(!recoverColors)}
                label="Recuperar cores originais"
                hint="Reanima tons desbotados. Se for P&B, faz colorização realista."
                testId="restore-toggle-colors"
              />
              <Toggle
                active={removeNoise}
                onClick={() => setRemoveNoise(!removeNoise)}
                label="Reduzir riscos, manchas e ruídos"
                hint="Apaga arranhões, poeira, dobras e manchas amareladas."
                testId="restore-toggle-noise"
              />
              <Toggle
                active={sharpen}
                onClick={() => setSharpen(!sharpen)}
                label="Aumentar nitidez"
                hint="Realça micro-detalhes em cabelo, tecidos e texturas finas."
                testId="restore-toggle-sharpen"
              />
            </div>
          </section>

          {/* 4) OPTIONAL PROMPT */}
          <section>
            <label className="block text-[#F4F1EA] text-[13px] font-medium mb-3 uppercase tracking-[0.16em] font-['Inter_Tight']">
              04 · Instrução Adicional <span className="text-[#5A5A5E] normal-case tracking-normal text-[11px] font-normal">(opcional)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="ex: restaurar foto antiga de 1970, melhorar rosto da criança"
              className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
              data-testid="restore-custom-prompt"
            />
            <div className="flex flex-wrap gap-2 mt-2.5">
              {PROMPT_IDEAS.map((s) => (
                <button
                  key={s}
                  onClick={() => setCustomPrompt(s)}
                  className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Output</p>
          <ResultArea busy={busy} result={result} originalPreview={photoPreview} level={level} />
        </aside>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4"
        data-testid="restore-cta-bar"
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[12px]">
            <span className="text-[#8A8A8E]">Custo:</span>
            <span className="text-[#C4B5FD] font-medium text-[16px]">
              {cost} <span className="text-[10px] font-mono uppercase tracking-wider">Créditos</span>
            </span>
            <span className="text-[#5A5A5E] mx-2">·</span>
            <span className="text-[#8A8A8E]">Saldo:</span>
            <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
          </div>
          <button
            onClick={run}
            disabled={busy || !photo}
            className="flex-1 sm:flex-initial sm:min-w-[260px] bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white py-3.5 rounded-lg text-[13px] font-medium tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25"
            data-testid="restore-create-btn"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A restaurar…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Restaurar Foto · {cost} créditos</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function IntensityBars({ active, index }) {
  // Show 1, 2, or 3 bars indicating leve/medio/profundo intensity
  const filled = index + 1;
  return (
    <div className="flex items-end gap-1 h-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm transition-all ${
            i <= filled
              ? active ? "bg-[#C4B5FD]" : "bg-[#7C3AED]/60"
              : "bg-[#2E2E30]"
          }`}
          style={{ height: `${i * 7 + 5}px` }}
        />
      ))}
    </div>
  );
}

function Toggle({ active, onClick, label, hint, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`w-full flex items-start gap-4 p-3.5 rounded-xl border transition-all text-left ${
        active
          ? "border-[#7C3AED]/60 bg-[#7C3AED]/8"
          : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
      }`}
    >
      <div className={`shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors relative ${active ? "bg-[#7C3AED]" : "bg-[#2E2E30]"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
          active ? "translate-x-[18px]" : "translate-x-0.5"
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight']">{label}</p>
        <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5">{hint}</p>
      </div>
    </button>
  );
}

function ResultArea({ busy, result, originalPreview, level }) {
  if (busy) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden" data-testid="restore-loading">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_65%)] animate-pulse pointer-events-none" />
        <div className="relative w-14 h-14 rounded-full border-2 border-[#7C3AED]/30 border-t-[#C4B5FD] animate-spin mb-5" />
        <p className="relative text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">A restaurar a foto…</p>
        <p className="relative text-[#5A5A5E] text-[11px] font-mono uppercase mt-2 tracking-[0.18em]">
          30–90 seg · nível {level}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl bg-[#0E0E12] border border-dashed border-[#2E2E30] aspect-square flex flex-col items-center justify-center p-10" data-testid="restore-empty">
        <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4">
          <History className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <p className="text-[#8A8A8E] text-[13px] text-center">A tua foto restaurada aparece aqui.</p>
        <p className="text-[#5A5A5E] text-[11px] text-center mt-1.5">Toca em "Restaurar Foto" para começar.</p>
      </div>
    );
  }

  return <ResultViewer result={result} originalPreview={originalPreview} />;
}

function ResultViewer({ result, originalPreview }) {
  const [showCompare, setShowCompare] = useState(false);

  const handleDownload = async () => {
    try {
      const r = await fetch(result.url);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remakepix-restored-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao preparar download.");
    }
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-[#2E2E30] overflow-hidden" data-testid="restore-result">
      <div className="relative aspect-square bg-black">
        <img
          src={result.url}
          alt="Restaurada"
          className="absolute inset-0 w-full h-full object-contain"
          data-testid="restore-result-image"
          crossOrigin="anonymous"
        />
        {showCompare && originalPreview && (
          <div className="absolute inset-0">
            <img src={originalPreview} alt="" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white bg-black/70 px-2 py-1 rounded">
              Original
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 text-[11px] font-mono uppercase tracking-[0.18em] bg-[#7C3AED] text-white px-2.5 py-1 rounded">
          Restaurado · {result.level}
        </div>
        {originalPreview && (
          <button
            onMouseDown={() => setShowCompare(true)}
            onMouseUp={() => setShowCompare(false)}
            onMouseLeave={() => setShowCompare(false)}
            onTouchStart={() => setShowCompare(true)}
            onTouchEnd={() => setShowCompare(false)}
            className="absolute bottom-3 right-3 z-10 bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-black/85 transition-colors select-none"
            data-testid="restore-compare"
          >
            <Move className="w-3.5 h-3.5" />
            Segurar para ver o original
          </button>
        )}
      </div>
      <div className="p-3 flex gap-2 border-t border-[#2E2E30] bg-[#0B0B0C]/60">
        <button
          onClick={handleDownload}
          className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white py-3 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="restore-download"
        >
          <Download className="w-4 h-4" />
          Baixar Restaurada
        </button>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors flex items-center"
          data-testid="restore-open"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}
