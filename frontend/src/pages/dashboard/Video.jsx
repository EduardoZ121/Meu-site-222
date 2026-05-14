import { useEffect, useState } from "react";
import { Film, Loader2, Sparkles, Wand2, Upload, X } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import { compressImage } from "../../lib/imageCompress";
import { fileToDataURL } from "../../lib/fileToDataURL";
import useTitle from "../../lib/useTitle";
import ResultPanel from "../../components/ResultPanel";

const ASPECTS = ["16:9", "9:16", "1:1", "4:5"];
const DURATIONS = [
  { v: 4, label: "4s", desc: "Loop curto" },
  { v: 6, label: "6s", desc: "Padrão" },
  { v: 8, label: "8s", desc: "Cinematic" },
];
const MOTIONS = [
  { id: "cinematic", label: "Cinematic", desc: "Movimento dramático e contínuo" },
  { id: "dynamic",   label: "Dinâmico",   desc: "Acção rápida, energia alta" },
  { id: "smooth",    label: "Suave",      desc: "Fluido e elegante" },
  { id: "static",    label: "Sutil",      desc: "Quase parado, mudanças subtis" },
];
const IDEAS = [
  "uma onda gigante a partir-se em câmara lenta ao pôr do sol",
  "drone a sobrevoar uma floresta no nevoeiro de manhã",
  "uma chávena de café com vapor a subir, foco macro",
  "neon-lit street, rain reflections, cyberpunk vibe",
];

export default function Video() {
  const { t } = useI18n();
  useTitle(t("sidebar_video"));
  const { refresh, user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState(6);
  const [motion, setMotion] = useState("cinematic");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = 20;
  const canGenerate = prompt.trim().length >= 3 && (user?.credits ?? 0) >= cost && !busy;

  useEffect(() => {
    let cancel = false;
    if (!photo) { setPhotoPreview(null); return; }
    fileToDataURL(photo).then((url) => { if (!cancel) setPhotoPreview(url); });
    return () => { cancel = true; };
  }, [photo]);

  const pickFile = async (file) => {
    if (!file) return;
    const isImg = file.type?.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
    if (!isImg) { toast.error("Envia uma imagem (JPEG/PNG)."); return; }
    try { setPhoto(await compressImage(file)); }
    catch (e) { toast.error(e.message || "Não consegui ler a imagem."); }
  };

  const generate = async () => {
    if (!canGenerate) {
      if (prompt.trim().length < 3) toast.error("Descreve o movimento que queres (mínimo 3 letras).");
      else if ((user?.credits ?? 0) < cost) toast.error(`Precisas de ${cost} créditos. Tens ${user?.credits ?? 0}.`);
      return;
    }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      // Compose a richer prompt with motion style + duration hint
      const composed = `${prompt.trim()} — motion style: ${motion}, duration: ${duration}s`;
      fd.append("prompt", composed);
      fd.append("aspect_ratio", aspect);
      if (photo) fd.append("photo", photo);
      const { data } = await api.post("/generate/video", fd, { timeout: 300000 });
      setResult(data.creation);
      toast.success(`Vídeo gerado · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Falhou a geração do vídeo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20" data-testid="video-page">
      {/* === Header === */}
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">Vídeo IA</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-3">
          Uma ideia, em <span className="italic text-[#C4B5FD]">movimento</span>.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[600px]">
          Transforma uma frase ou uma foto num clipe cinematográfico de 4 a 8 segundos.
          Modelo Grok Imagine Video — qualidade real, sem placeholders.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          {/* Step 1 — prompt */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED]">1 · O que queres ver?</p>
              <span className="text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/600</span>
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, 600))} rows={5}
              placeholder='Ex: "uma onda gigante a partir-se em câmara lenta ao pôr do sol, ondas douradas, cinematic 35mm"'
              className="w-full bg-[#0F0F12] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-5 py-4 rounded-xl focus:outline-none resize-none font-['Inter_Tight']"
              data-testid="video-prompt" />
            <div className="flex flex-wrap gap-2 mt-3">
              {IDEAS.map((idea) => (
                <button key={idea} onClick={() => setPrompt(idea)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#2E2E30] hover:border-[#7C3AED] text-[#8A8A8E] hover:text-[#C4B5FD] text-[11px] transition-colors"
                  data-testid="video-idea">
                  <Sparkles className="w-3 h-3" /> {idea.slice(0, 36)}{idea.length > 36 ? "…" : ""}
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 — start frame */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">2 · Frame Inicial (opcional)</p>
            <div className="max-w-[420px]">
              {!photo ? (
                <label htmlFor="video-photo-input"
                  className="block w-full aspect-video rounded-xl border border-dashed border-[#2E2E30] hover:border-[#7C3AED] bg-[#0F0F12] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  data-testid="video-photo-trigger">
                  <Upload className="w-5 h-5 text-[#5A5A5E] pointer-events-none" strokeWidth={1.5} />
                  <p className="text-[#8A8A8E] text-[12px] font-mono uppercase tracking-[0.14em] pointer-events-none">Arrasta ou clica para enviar</p>
                  <p className="text-[#5A5A5E] text-[10px] pointer-events-none">JPEG · PNG · até ~10MB</p>
                </label>
              ) : (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#2E2E30]">
                  {photoPreview && <img src={photoPreview} alt="Frame inicial" className="w-full h-full object-cover" />}
                  <button onClick={() => setPhoto(null)} className="absolute top-3 right-3 w-8 h-8 rounded-md bg-[#0B0B0C]/80 backdrop-blur-sm flex items-center justify-center text-[#F4F1EA] hover:bg-[#0B0B0C]" data-testid="video-photo-clear">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input id="video-photo-input" type="file" accept="image/*" className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])} data-testid="video-photo-input" />
            </div>
          </section>

          {/* Step 3 — format */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">3 · Formato</p>
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map((a) => (
                <button key={a} onClick={() => setAspect(a)} data-testid={`vid-ar-${a}`}
                  className={`px-5 py-2.5 rounded-md text-[11px] font-mono uppercase tracking-[0.14em] transition-all
                    ${aspect === a
                      ? "border border-[#7C3AED] bg-[#7C3AED]/15 text-[#F4F1EA] shadow-[0_0_24px_-8px_rgba(124,58,237,0.6)]"
                      : "border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#5A5A5E]"}`}>
                  {a}
                </button>
              ))}
            </div>
          </section>

          {/* Step 4 — duration */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">4 · Duração</p>
            <div className="grid grid-cols-3 gap-2.5 max-w-[480px]">
              {DURATIONS.map((d) => (
                <button key={d.v} onClick={() => setDuration(d.v)} data-testid={`vid-dur-${d.v}`}
                  className={`text-left px-4 py-3 rounded-lg border transition-all
                    ${duration === d.v
                      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
                      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"}`}>
                  <p className="text-[#F4F1EA] text-[18px] font-light">{d.label}</p>
                  <p className="text-[#8A8A8E] text-[11px]">{d.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Step 5 — motion */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">5 · Estilo de Movimento</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MOTIONS.map((m) => (
                <button key={m.id} onClick={() => setMotion(m.id)} data-testid={`vid-motion-${m.id}`}
                  className={`text-left px-4 py-3.5 rounded-lg border transition-all
                    ${motion === m.id
                      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
                      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"}`}>
                  <p className="text-[#F4F1EA] text-[14px] font-medium">{m.label}</p>
                  <p className="text-[#8A8A8E] text-[11px] mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div>
            <button onClick={generate} disabled={!canGenerate} data-testid="video-generate"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] text-white text-[13px] font-mono uppercase tracking-[0.18em] shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> A renderizar… 30–120 seg</>) : (<><Film className="w-4 h-4" /> Renderizar Vídeo · {cost} créditos</>)}
            </button>
            <p className="text-[#5A5A5E] text-[11px] mt-3 text-center font-mono uppercase tracking-[0.14em]">
              Saldo: <span className="text-[#C4B5FD]">{user?.credits ?? 0} créditos</span>
            </p>
          </div>
        </div>

        {/* === Right: preview / result === */}
        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">Último resultado</p>
          {result ? (
            <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="Aguarda — vídeo a render…" />
          ) : (
            <div className="rounded-xl border border-[#2E2E30] bg-gradient-to-br from-[#13131A] to-[#0B0B0C] aspect-video flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
              </div>
              <p className="text-[#F4F1EA] text-[14px] text-center max-w-[240px]">O teu vídeo cinematográfico aparece aqui.</p>
              <p className="text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.14em]">{aspect} · {duration}s · {motion}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
