import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, ImagePlus, Wand2, Lightbulb } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import ResultPanel from "../../components/ResultPanel";
import { compressImage } from "../../lib/imageCompress";
import useTitle from "../../lib/useTitle";

const ASPECT_RATIOS = ["1:1", "4:5", "3:4", "9:16", "16:9", "21:9"];

const CAT_LABELS = {
  men: "Homens", women: "Mulheres", unisex: "Unissex",
  flyer: "Flyers", couple: "Casais", comic: "Comics",
  stories: "Stories", sensual: "Sensual",
};

const SUBJECTS = [
  { value: "the man", label: "Homem" },
  { value: "the woman", label: "Mulher" },
  { value: "the person", label: "Pessoa" },
];

export default function Generate() {
  const { t } = useI18n();
  useTitle(t("sidebar_generate"));
  const { refresh, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [photo, setPhoto] = useState(null);
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [improve, setImprove] = useState(false);
  const [aspect, setAspect] = useState("4:5");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Style picker (visible by default — Pollo-style)
  const [showStyles, setShowStyles] = useState(true);
  const [padrao, setPadrao] = useState([]);
  const [padraoCat, setPadraoCat] = useState("men");
  const [pickedStyle, setPickedStyle] = useState(null);
  const [subject, setSubject] = useState("the person");

  useEffect(() => {
    api.get("/public/padrao-styles").then((r) => setPadrao(r.data.styles || [])).catch(() => {});
  }, []);

  const padraoCats = useMemo(() => Array.from(new Set(padrao.map((s) => s.cat))), [padrao]);
  const padraoFiltered = padrao.filter((s) => s.cat === padraoCat);
  const picked = padrao.find((s) => s.id === pickedStyle);

  // Smart cost calculation — surface what will actually happen
  const { mode, cost, ctaLabel } = useMemo(() => {
    if (photo && pickedStyle) return { mode: "easy", cost: 11, ctaLabel: `Aplicar estilo · 11 créditos` };
    if (photo && !pickedStyle) return { mode: "edit", cost: 12, ctaLabel: `Editar com prompt · 12 créditos` };
    if (!photo && pickedStyle) return { mode: "blocked", cost: 0, ctaLabel: `Envia uma foto para usar este estilo` };
    return { mode: "text", cost: 10, ctaLabel: `Gerar do zero · 10 créditos` };
  }, [photo, pickedStyle]);

  const generate = async () => {
    // Validation
    if (mode === "blocked") { toast.error("Envia uma foto para aplicar um estilo, ou remove o estilo."); return; }
    if (mode === "text" && prompt.trim().length < 3) {
      toast.error("Escreve o que queres criar (mínimo 3 letras).");
      return;
    }
    if (mode === "edit" && prompt.trim().length < 3) {
      toast.error("Descreve a edição que queres fazer à foto.");
      return;
    }
    if ((user?.credits ?? 0) < cost) {
      toast.error(`Precisas de ${cost} créditos. Tens ${user?.credits ?? 0}.`);
      return;
    }

    setBusy(true); setResult(null);
    try {
      let data;
      if (mode === "easy") {
        const compressed = await compressImage(photo);
        const fd = new FormData();
        fd.append("photo", compressed);
        fd.append("style_id", pickedStyle);
        fd.append("subject", subject);
        fd.append("aspect_ratio", aspect);
        if (prompt.trim()) fd.append("extra_prompt", prompt.trim());
        ({ data } = await api.post("/generate/easy", fd, { timeout: 180000 }));
      } else if (mode === "edit") {
        const compressed = await compressImage(photo);
        const fd = new FormData();
        fd.append("photo", compressed);
        fd.append("prompt", prompt.trim());
        fd.append("aspect_ratio", aspect);
        ({ data } = await api.post("/generate/edit", fd, { timeout: 180000 }));
      } else {
        // text-to-image
        ({ data } = await api.post("/generate/image", {
          prompt: prompt.trim(),
          mode: "advanced",
          aspect_ratio: aspect,
          num_outputs: 1,
          improve_prompt: improve,
        }, { timeout: 180000 }));
      }
      setResult(data.creation);
      toast.success(`Gerado · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      let msg = "Falhou a geração.";
      if (err?.code === "ECONNABORTED" || /timeout/i.test(err?.message || "")) msg = "Tempo esgotado — tenta de novo.";
      else if (err?.response?.status === 402) msg = "Créditos insuficientes.";
      else if (err?.response?.status === 401) msg = "Sessão expirada.";
      else if (err?.response?.status === 429) msg = "Demasiados pedidos. Espera 1 minuto.";
      else if (err?.response?.data?.detail) msg = typeof err.response.data.detail === "string" ? err.response.data.detail : "Erro inesperado.";
      else if (err?.message) msg = `Erro de rede: ${err.message}`;
      toast.error(msg, { duration: 8000 });
      // eslint-disable-next-line no-console
      console.error("Generation error:", err);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="generate-page">
      <header className="mb-10">
        <p className="eyebrow mb-3">Estúdio</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px]">
          Cria, edita ou personaliza.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] mt-3 max-w-[560px]">
          Envia uma foto, descreve o que queres, ou escolhe um estilo pronto. Combina como quiseres — só prompt, só estilo, ou as duas coisas.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* ── LEFT: studio inputs ────────────────────────────── */}
        <div>
          {/* Step 1 — photo */}
          <div className="mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED]">1 · Foto (opcional)</p>
              {photo && (
                <button onClick={() => setPhoto(null)} className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#5A5A5E] hover:text-[#F4F1EA]">Remover</button>
              )}
            </div>
            <div className="max-w-[420px]">
              <PhotoUpload value={photo} onChange={setPhoto} testId="gen-photo" />
            </div>
          </div>

          {/* Step 2 — prompt */}
          <div className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">
              2 · {photo ? "O que queres mudar?" : "Descreve o que queres criar"}
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={800}
              placeholder={photo
                ? 'Ex: "muda o fundo para uma praia ao pôr do sol", "fato preto elegante"...'
                : 'Ex: "cidade futurista ao pôr do sol, neon azul e rosa"...'}
              className="w-full bg-transparent border border-[#2E2E30] text-[#F4F1EA] px-4 py-3 text-[15px] leading-relaxed placeholder:text-[#5A5A5E] focus:outline-none focus:border-[#7C3AED] transition-colors rounded-sm font-['Inter_Tight'] resize-none"
              data-testid="prompt-input"
            />
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={improve} onChange={(e) => setImprove(e.target.checked)} className="accent-[#7C3AED]" data-testid="improve-toggle" />
                <span className="text-[#8A8A8E] text-[12px]">Melhorar prompt com IA (+0 créditos)</span>
              </label>
              <span className="text-[#5A5A5E] text-[10px] font-mono">{prompt.length}/800</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => navigate("/app/wizard")} className="flex items-center gap-2 px-3 py-2 border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40 text-[11px] font-mono uppercase tracking-[0.12em] transition-colors" data-testid="open-wizard">
                <Wand2 className="w-3 h-3" /> Assistente
              </button>
              <button onClick={() => navigate("/app/suggest")} className="flex items-center gap-2 px-3 py-2 border border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA] hover:border-[#7C3AED]/40 text-[11px] font-mono uppercase tracking-[0.12em] transition-colors" data-testid="open-suggest">
                <Lightbulb className="w-3 h-3" /> Sugestões
              </button>
            </div>
          </div>

          {/* Step 3 — optional style */}
          <div className="mb-10">
            <button
              onClick={() => setShowStyles(!showStyles)}
              className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3 hover:text-[#9333EA]"
              data-testid="toggle-styles"
            >
              3 · Escolhe um Estilo <span className="text-[#5A5A5E]">(opcional)</span>
              <span className="text-[#5A5A5E]">{showStyles ? "▴" : "▾"}</span>
            </button>
            {pickedStyle && picked && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#7C3AED]/10 border border-[#7C3AED]/40 rounded-md">
                <span className="text-[#C4B5FD] text-[11px] font-medium">{picked.nome}</span>
                <button onClick={() => setPickedStyle(null)} className="text-[#8A8A8E] hover:text-[#F4F1EA] text-[14px] leading-none">×</button>
              </div>
            )}

            {showStyles && (
              <>
                <div className="flex flex-wrap gap-2 mb-4" data-testid="subject-bar">
                  {SUBJECTS.map((s) => (
                    <button key={s.value} onClick={() => setSubject(s.value)}
                      className={`px-3 py-1.5 border text-[10px] font-mono uppercase tracking-[0.1em] transition-colors ${subject === s.value ? "border-[#7C3AED] text-[#C4B5FD] bg-[#7C3AED]/10" : "border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA]"}`}
                      data-testid={`subj-${s.value.replace(/\s/g, "-")}`}>
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-4" data-testid="padrao-cats">
                  {padraoCats.map((c) => (
                    <button key={c} onClick={() => { setPadraoCat(c); setPickedStyle(null); }}
                      className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] border transition-colors ${padraoCat === c ? "border-[#7C3AED] text-[#C4B5FD]" : "border-[#2E2E30] text-[#8A8A8E] hover:text-[#F4F1EA]"}`}
                      data-testid={`pcat-${c}`}>
                      {CAT_LABELS[c] || c}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1" data-testid="padrao-grid">
                  {padraoFiltered.map((s) => (
                    <button key={s.id} onClick={() => setPickedStyle(pickedStyle === s.id ? null : s.id)}
                      className={`text-left p-3 border transition-all ${pickedStyle === s.id ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-[#2E2E30] hover:border-[#7C3AED]/40 bg-[#1A1A1C]"} ${s.locked ? "opacity-80" : ""}`}
                      data-testid={`pstyle-${s.id}`}>
                      <p className="text-[#F4F1EA] text-[13px] leading-snug mb-1 font-['Inter_Tight']">{s.nome}</p>
                      {s.locked && <p className="text-[#C7A77A] text-[9px] font-mono uppercase tracking-wider">Premium</p>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Step 4 — aspect ratio */}
          <div className="mb-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">4 · Formato</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" data-testid="aspect-ratios">
              {ASPECT_RATIOS.map((a) => {
                const map = { "1:1":[14,14],"3:4":[12,16],"4:5":[13,16],"9:16":[10,18],"16:9":[18,10],"21:9":[20,9] };
                const [w,h] = map[a] || [14,14];
                return (
                  <button key={a} onClick={() => setAspect(a)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 border-2 rounded-md text-[11px] font-medium transition-all ${aspect === a ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#C4B5FD] shadow-md shadow-[#7C3AED]/20" : "border-[#2E2E30] text-[#8A8A8E] hover:border-[#7C3AED]/40 hover:text-[#F4F1EA]"}`}
                    data-testid={`aspect-${a}`}>
                    <div className="border-[1.5px] border-current rounded-[1px]" style={{ width: w+"px", height: h+"px" }} />
                    <span className="font-mono">{a}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={generate}
            disabled={busy || mode === "blocked"}
            className="w-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:bg-[#1A1A1C] disabled:from-[#1A1A1C] disabled:to-[#1A1A1C] disabled:text-[#5A5A5E] text-white py-4 text-[12px] font-medium uppercase tracking-[0.18em] rounded-md shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            data-testid="generate-button"
          >
            {busy ? (
              <>
                <span className="relative flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="absolute inset-0 rounded-full bg-white/30 blur-md animate-pulse" />
                </span>
                A gerar... 30–90 seg
              </>
            ) : mode === "blocked" ? (
              <><ImagePlus className="w-4 h-4" /> {ctaLabel}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {ctaLabel}</>
            )}
          </button>
          <p className="text-[#5A5A5E] text-[11px] mt-3 text-center font-['Inter_Tight']">
            Saldo: <span className="text-[#C4B5FD]">{user?.credits ?? 0} créditos</span>
          </p>
        </div>

        {/* ── RIGHT: live result ─────────────────────────────── */}
        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">Último resultado</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="A tua próxima imagem aparece aqui." />
        </aside>
      </div>
    </div>
  );
}
