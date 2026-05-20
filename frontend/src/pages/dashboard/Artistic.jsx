import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, Loader2, Sparkles, Search, Shuffle, Upload, X, Palette } from "lucide-react";
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

const errMsg = (err) =>
  err?.code === "ECONNABORTED" ? "Tempo esgotado — tenta de novo." :
  err?.response?.status === 402 ? "Créditos insuficientes." :
  err?.response?.status === 429 ? "Demasiados pedidos. Espera 1 minuto." :
  err?.response?.data?.detail || err?.message || "Falhou.";

function PhotoBox({ photo, onChange, testId }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    let cancel = false;
    if (!photo) { setPreview(null); return; }
    fileToDataURL(photo).then((u) => { if (!cancel) setPreview(u); }).catch(() => {});
    return () => { cancel = true; };
  }, [photo]);

  const pick = async (file) => {
    if (!file) return;
    const isImg = file.type?.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name || "");
    if (!isImg) { toast.error("Ficheiro tem de ser uma imagem."); return; }
    try { onChange(await compressImage(file)); }
    catch (e) { toast.error(e.message || "Não consegui ler esta imagem."); }
  };

  return (
    <div className="w-full">
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
        className="relative aspect-[16/9] border-2 border-dashed border-[#2E2E30] hover:border-[#7C3AED]/60 bg-[#13131A]/50 rounded-md cursor-pointer transition-all flex items-center justify-center group overflow-hidden"
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
            <p className="text-[#5A5A5E] text-[10px]">ou clica para enviar</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export default function Artistic() {
  useTitle("Estilos Artísticos");
  const { refresh, user } = useAuth();
  const navigate = useNavigate();

  const [styles, setStyles] = useState([]);
  const [cats, setCats] = useState({});
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [aspect, setAspect] = useState("match");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = 13;

  useEffect(() => {
    if (!photo && aspect === "match") setAspect("1:1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  useEffect(() => {
    api.get("/public/artistic-styles").then((r) => {
      setStyles(r.data.styles || []);
      setCats(r.data.categories || {});
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = styles;
    if (tab !== "all") list = list.filter((s) => s.cat === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    return list;
  }, [styles, tab, query]);

  const surpriseMe = () => {
    if (!styles.length) return;
    const random = styles[Math.floor(Math.random() * styles.length)];
    setPicked(random.id);
    setTab(random.cat);
    toast.success(`Estilo surpresa: ${random.label}`);
  };

  const generate = async () => {
    if (!photo) { toast.error("Envia uma foto."); return; }
    if (!picked) { toast.error("Escolhe um estilo da grelha."); return; }
    if ((user?.credits ?? 0) < cost) {
      toast.error(`Precisas de ${cost} créditos.`); return;
    }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", await compressImage(photo));
      fd.append("style_id", picked);
      fd.append("aspect_ratio", aspect);
      fd.append("extra_prompt", extra);
      const { data } = await api.post("/generate/artistic", fd, { timeout: 180000 });
      setResult(data.creation);
      toast.success(`Estilo aplicado · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally { setBusy(false); }
  };

  const pickedStyle = styles.find((s) => s.id === picked);

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="artistic-page">
      <button onClick={() => navigate("/app/tools")} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#7C3AED]/15 flex items-center justify-center">
            <Palette className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
          </div>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em]">Estilos Artísticos · {styles.length}+ estilos</p>
        </div>
        <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.1] mb-3 font-['Inter_Tight']">
          Uma foto, <span className="italic">reimaginada</span>.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">Anime, óleo, aquarela, comic, fantasy, pixel art e muito mais. Escolhe um estilo e a foto é transformada em segundos.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          {/* Step 1 — Photo */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">1 · Foto</p>
            <div className="max-w-[560px]">
              <PhotoBox photo={photo} onChange={setPhoto} testId="artistic-photo" />
            </div>
          </section>

          {/* Step 2 — Style picker */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED]">2 · Estilo {pickedStyle && <span className="text-[#C4B5FD] normal-case font-sans text-[12px] tracking-normal ml-2">· {pickedStyle.label}</span>}</p>
              <button onClick={surpriseMe} className="flex items-center gap-1.5 text-[#8A8A8E] hover:text-[#C4B5FD] text-[11px] font-medium transition-colors" data-testid="surprise-me">
                <Shuffle className="w-3.5 h-3.5" /> Surpreende-me
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A5E]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar estilo... (ex: anime, oil, cyber)"
                className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[13px] placeholder:text-[#5A5A5E] pl-9 pr-4 py-2.5 rounded-md focus:outline-none transition-colors"
                data-testid="artistic-search"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 mb-5" data-testid="artistic-cats">
              <button onClick={() => setTab("all")} className={`px-3.5 py-1.5 text-[11px] font-medium rounded-full transition-all ${tab === "all" ? "bg-[#F4F1EA] text-[#0B0B0C]" : "bg-[#13131A] border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA]"}`}>Todos ({styles.length})</button>
              {Object.entries(cats).map(([id, label]) => {
                const n = styles.filter((s) => s.cat === id).length;
                return (
                  <button key={id} onClick={() => setTab(id)} className={`px-3.5 py-1.5 text-[11px] font-medium rounded-full transition-all ${tab === id ? "bg-[#F4F1EA] text-[#0B0B0C]" : "bg-[#13131A] border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA]"}`} data-testid={`cat-${id}`}>
                    {label} ({n})
                  </button>
                );
              })}
            </div>

            {/* Style grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[520px] overflow-y-auto pr-1" data-testid="artistic-styles-grid">
              {filtered.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.01, 0.3) }}
                  onClick={() => setPicked(s.id)}
                  className={`relative aspect-[4/3] rounded-md overflow-hidden border-2 transition-all text-left p-3 flex flex-col justify-end ${
                    picked === s.id
                      ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/40"
                      : "border-[#2E2E30] hover:border-[#7C3AED]/40"
                  }`}
                  data-testid={`style-${s.id}`}
                  style={{
                    background: `linear-gradient(135deg,
                      hsl(${(s.id.charCodeAt(0) * 7) % 360}, 35%, 22%) 0%,
                      #13131A 60%,
                      #0B0B0C 100%)`,
                  }}
                >
                  <p className="relative z-10 text-[#F4F1EA] text-[12px] font-medium leading-tight font-['Inter_Tight']">{s.label}</p>
                  <p className="relative z-10 text-[#C4B5FD]/60 text-[9px] font-mono uppercase tracking-wider mt-0.5">{cats[s.cat]?.split(" ")[0] || s.cat}</p>
                  {picked === s.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-[#5A5A5E] text-[13px] py-10 text-center">Nenhum estilo encontrado para "{query}"</p>
              )}
            </div>
          </section>

          {/* Step 3 — extra prompt */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">3 · Detalhes extra (opcional)</p>
            <input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder='Ex: "dramatic lighting, gold accents, moody atmosphere"'
              className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-md focus:outline-none transition-colors"
              data-testid="artistic-extra"
            />
          </section>

          {/* Step 4 — aspect ratio */}
          <section>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">4 · Formato</p>
            <AspectPicker value={aspect} onChange={setAspect} hasPhoto={!!photo} testIdPrefix="art-aspect" />
          </section>
        </div>

        {/* RIGHT */}
        <aside className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Resultado</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="A foto reimaginada aparece aqui." />
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
            data-testid="artistic-create"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A pintar...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Aplicar Estilo · {cost} créditos</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
