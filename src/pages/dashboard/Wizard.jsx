import { useEffect, useMemo, useState } from "react";
import { Loader2, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

// Numeric options (1..N) per wizard question, from bot.py
const OPTIONS = {
  q1: [
    "Flyer/Pôster profissional",
    "Logo/Identidade visual",
    "Arte Conceitual/Ilustração",
    "Personagem (anime, realista, cartoon)",
    "Paisagem/Cenário",
    "Produto/Mockup",
    "Retrato/Foto realista",
    "Outro",
  ],
  q2: [
    "Anime/Mangá japonês",
    "Realista/Fotográfico",
    "Artístico/Pintura digital",
    "3D Render (tipo Pixar)",
    "Sketch/Desenho à mão",
    "Minimalista/Flat design",
    "Cyberpunk/Futurista",
    "Vintage/Retrô",
  ],
  q3: [
    "Vertical (3:4) — Stories",
    "Quadrado (1:1) — Instagram",
    "Horizontal (16:9) — YouTube",
    "Story/TikTok (9:16)",
    "Instagram Post (4:5)",
  ],
};

const TITLES = {
  q1: "O que queres criar?",
  q2: "Que estilo visual prefere?",
  q3: "Qual formato?",
  q4: "Descreve em detalhe o que queres ver",
  q5: "Tens foto de referência?",
};

const ORDER = ["q1", "q2", "q3", "q4", "q5"];

export default function Wizard() {
  const { t } = useI18n();
  useTitle(t("sidebar_wizard"));
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [composed, setComposed] = useState(null);
  const [q4Text, setQ4Text] = useState("");
  const [q5Text, setQ5Text] = useState("");

  const id = ORDER[stepIdx];
  const opts = OPTIONS[id];

  const goNext = () => {
    if (stepIdx < ORDER.length - 1) setStepIdx(stepIdx + 1);
    else void submit();
  };

  const pickOption = (i) => {
    setAnswers((a) => ({ ...a, [id]: String(i + 1) }));
    setTimeout(goNext, 100);
  };

  const submit = async () => {
    const final = { ...answers };
    if (q4Text.trim()) final.q4 = q4Text.trim();
    if (q5Text.trim()) final.q5 = q5Text.trim();
    if (!final.q1 || !final.q2 || !final.q3) { toast.error("Responde às 3 primeiras perguntas."); return; }
    if (!final.q4) { toast.error("Descreve o que queres ver."); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/wizard/compose", { answers: final, lang: user?.lang || "pt" });
      setComposed(data.prompt);
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("failed"));
    } finally { setBusy(false); }
  };

  const progress = useMemo(() => ORDER.map((_, i) => i <= stepIdx), [stepIdx]);

  return (
    <div className="max-w-[760px] mx-auto" data-testid="wizard-page">
      <p className="eyebrow mb-3">{t("wiz_eyebrow")}</p>
      <h1 className="heading-xl mb-12">Cinco respostas. <span className="italic text-rp-lavender">Um prompt</span>.</h1>

      {!composed ? (
        <>
          <div className="flex items-center gap-2 mb-10" data-testid="wizard-progress">
            {progress.map((on, i) => (
              <div key={i} className={`flex-1 h-[2px] ${on ? "bg-rp-purple" : "bg-rp-border"}`} />
            ))}
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-4">
            Passo {stepIdx + 1} de {ORDER.length}
          </p>
          <p className="font-heading text-3xl text-rp-text mb-8 leading-tight" data-testid="wizard-question">
            {TITLES[id]}
          </p>

          {opts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8" data-testid="wizard-options">
              {opts.map((label, i) => {
                const value = String(i + 1);
                const sel = answers[id] === value;
                return (
                  <button key={i} onClick={() => pickOption(i)}
                    className={`text-left p-4 border transition-all ${sel ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`}
                    data-testid={`wiz-opt-${id}-${i + 1}`}>
                    <span className="text-[10px] font-mono text-rp-mute2 mr-2">{i + 1}</span>
                    <span className="text-rp-text">{label}</span>
                  </button>
                );
              })}
            </div>
          ) : id === "q4" ? (
            <textarea value={q4Text} onChange={(e) => setQ4Text(e.target.value)} rows={4}
              placeholder='Ex: "Uma cidade futurista ao pôr do sol, arranha-céus em neon azul e rosa"'
              className="field-input resize-none mb-8" data-testid="wiz-q4" autoFocus />
          ) : (
            <input value={q5Text} onChange={(e) => setQ5Text(e.target.value)}
              placeholder='Escreve "não" para saltar ou descreve a referência.'
              className="field-input mb-8" data-testid="wiz-q5" />
          )}

          <div className="flex gap-3">
            {stepIdx > 0 && (
              <button onClick={() => setStepIdx(stepIdx - 1)} className="btn-secondary" data-testid="wizard-back">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            )}
            <button onClick={goNext} disabled={busy} className="btn-primary disabled:opacity-50" data-testid="wizard-next">
              {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> A compor...</>) : (
                <>{stepIdx === ORDER.length - 1 ? "Compor" : "Próximo"} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="border border-rp-purple p-8 bg-rp-purple/5" data-testid="wizard-result">
          <p className="eyebrow mb-4">O teu prompt composto</p>
          <p className="font-heading text-2xl text-rp-text leading-relaxed mb-8">{composed}</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate(`/app/generate?prompt=${encodeURIComponent(composed)}`)}
              className="btn-primary" data-testid="wizard-use">
              <Sparkles className="w-4 h-4" /> Usar este prompt
            </button>
            <button onClick={() => { setComposed(null); setStepIdx(0); setAnswers({}); setQ4Text(""); setQ5Text(""); }}
              className="btn-secondary" data-testid="wizard-restart">Começar de novo</button>
          </div>
        </div>
      )}
    </div>
  );
}
