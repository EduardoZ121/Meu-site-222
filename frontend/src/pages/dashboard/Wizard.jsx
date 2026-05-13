import { useMemo, useState } from "react";
import {
  Loader2, ArrowRight, Sparkles, ArrowLeft, Wand2, Copy, Check,
  Camera, Palette, Crop, FileText, Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

/* ------------------------------------------------------------------ */
/*  Question definitions                                               */
/* ------------------------------------------------------------------ */

const Q1_OPTIONS = [
  { v: "1",  label: "Flyer / Pôster Profissional",   emoji: "🎟" },
  { v: "2",  label: "Logo / Identidade Visual",       emoji: "✦" },
  { v: "3",  label: "Arte Conceitual / Ilustração",   emoji: "✎" },
  { v: "4",  label: "Personagem (anime, realista, cartoon)", emoji: "⌬" },
  { v: "5",  label: "Paisagem / Cenário",             emoji: "⛰" },
  { v: "6",  label: "Produto / Mockup Comercial",     emoji: "▣" },
  { v: "7",  label: "Retrato / Foto Profissional",    emoji: "◉" },
  { v: "8",  label: "Post Instagram / TikTok",        emoji: "▤" },
  { v: "9",  label: "Capa de Álbum Musical",          emoji: "♪" },
  { v: "10", label: "Capa de Livro",                  emoji: "▭" },
  { v: "11", label: "Editorial de Moda",              emoji: "✣" },
  { v: "12", label: "Foto de Comida / Restaurante",   emoji: "✺" },
  { v: "13", label: "Render de Interiores / Arquitetura", emoji: "▥" },
  { v: "14", label: "Campanha Publicitária",          emoji: "✸" },
  { v: "15", label: "Key Art de Filme / Série",       emoji: "▻" },
  { v: "16", label: "Cena Fantasia / Sci-Fi",         emoji: "✺" },
  { v: "17", label: "Retrato de Animal / Pet",        emoji: "✿" },
  { v: "18", label: "Carro / Automóvel",              emoji: "◈" },
  { v: "19", label: "Arte Abstrata / Conceitual",     emoji: "▦" },
  { v: "20", label: "Outro",                          emoji: "✦" },
];

const Q2_OPTIONS = [
  { v: "1",  label: "Anime / Mangá Japonês" },
  { v: "2",  label: "Realista / Fotográfico" },
  { v: "3",  label: "Artístico / Pintura Digital" },
  { v: "4",  label: "3D Render (Pixar / Disney)" },
  { v: "5",  label: "Sketch / Desenho à Mão" },
  { v: "6",  label: "Minimalista / Flat Design" },
  { v: "7",  label: "Cyberpunk / Futurista Neon" },
  { v: "8",  label: "Vintage / Retrô 70s–80s" },
  { v: "9",  label: "Aquarela" },
  { v: "10", label: "Óleo / Pintura Clássica" },
  { v: "11", label: "Comic / Banda Desenhada" },
  { v: "12", label: "Low-poly / Geométrico" },
  { v: "13", label: "Vaporwave / Y2K" },
  { v: "14", label: "Brutalist Editorial" },
  { v: "15", label: "Luxo / Alta Moda" },
  { v: "16", label: "Documentário / Film Still" },
];

const Q3_OPTIONS = [
  { v: "1", label: "Vertical 3:4", hint: "Print / Stories" },
  { v: "2", label: "Quadrado 1:1", hint: "Instagram feed" },
  { v: "3", label: "Horizontal 16:9", hint: "YouTube / Banner" },
  { v: "4", label: "Story 9:16", hint: "Stories / TikTok" },
  { v: "5", label: "Feed Tall 4:5", hint: "Instagram post" },
  { v: "6", label: "Ultra Wide 21:9", hint: "Cinemático" },
];

const Q4_EXAMPLES = [
  "Mulher de 30 anos com cabelo curto, olhos cor de mel, em rooftop ao pôr do sol em Lisboa",
  "Cidade futurista com arranha-céus em neon azul e rosa, vista de cima",
  "Mesa de café aconchegante com latte arte, livro aberto, luz quente da manhã",
  "Tigre branco majestoso saindo de uma floresta enevoada ao amanhecer",
  "Pôster minimalista para concerto de jazz, tipografia bold",
];

const STEPS = [
  { id: "q1", title: "O que queres criar?", subtitle: "Escolhe a base do teu projeto.", icon: ImageIcon },
  { id: "q2", title: "Que estilo visual?",   subtitle: "Define a estética geral.",          icon: Palette },
  { id: "q3", title: "Qual formato?",         subtitle: "Onde vais usar a imagem?",          icon: Crop },
  { id: "q4", title: "Descreve em detalhe",   subtitle: "Sujeito, ambiente, sentimento — o mais detalhado possível.", icon: FileText },
  { id: "q5", title: "Foto de referência?",   subtitle: "Tens uma imagem ou pessoa específica em mente? (opcional)", icon: Camera },
];

export default function Wizard() {
  useTitle("Assistente");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [q4Text, setQ4Text] = useState("");
  const [q5Text, setQ5Text] = useState("");
  const [busy, setBusy] = useState(false);
  const [composed, setComposed] = useState(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const step = STEPS[stepIdx];
  const id = step.id;
  const progress = useMemo(() => STEPS.map((_, i) => i <= stepIdx), [stepIdx]);

  const canAdvance = () => {
    if (id === "q1" || id === "q2" || id === "q3") return !!answers[id];
    if (id === "q4") return q4Text.trim().length > 4;
    return true; // q5 is optional
  };

  const goNext = () => {
    if (!canAdvance()) {
      toast.error(id === "q4" ? "Descreve com mais detalhe." : "Escolhe uma opção.");
      return;
    }
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else void submit();
  };

  const pickOption = (v) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setTimeout(() => {
      if (stepIdx < STEPS.length - 1) setStepIdx((i) => i + 1);
    }, 120);
  };

  const submit = async () => {
    const final = { ...answers };
    if (q4Text.trim()) final.q4 = q4Text.trim();
    if (q5Text.trim()) final.q5 = q5Text.trim();
    if (!final.q1 || !final.q2 || !final.q3 || !final.q4) {
      toast.error("Completa as 4 primeiras perguntas.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/wizard/compose", { answers: final, lang: user?.lang || "pt" });
      setComposed(data.prompt);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Falhou.");
    } finally { setBusy(false); }
  };

  const restart = () => {
    setComposed(null); setStepIdx(0); setAnswers({});
    setQ4Text(""); setQ5Text(""); setEditing(false);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(composed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error("Falha ao copiar."); }
  };

  /* =============================== */
  /*  RESULT VIEW                    */
  /* =============================== */
  if (composed) {
    return (
      <div className="max-w-[860px] mx-auto" data-testid="wizard-result-page">
        <button onClick={() => navigate("/app/tools")} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
        </button>

        <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-3">Prompt composto</p>
        <h1 className="text-[#F4F1EA] text-[36px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.05] mb-8 font-['Inter_Tight']">
          O teu prompt está pronto.
        </h1>

        <div className="rounded-2xl border border-[#7C3AED]/40 bg-gradient-to-br from-[#13131A] to-[#0B0B0C] p-7 mb-6 relative overflow-hidden" data-testid="wizard-result">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#7C3AED]/15 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-5 relative">
            <Wand2 className="w-4 h-4 text-[#C4B5FD]" />
            <p className="text-[#C4B5FD] text-[11px] font-mono uppercase tracking-[0.2em]">Prompt final · {composed.split(/\s+/).length} palavras</p>
          </div>
          {editing ? (
            <textarea
              value={composed}
              onChange={(e) => setComposed(e.target.value)}
              rows={8}
              className="relative w-full bg-[#0B0B0C] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] leading-relaxed px-4 py-3 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
              data-testid="wizard-edit-textarea"
            />
          ) : (
            <p className="relative text-[#F4F1EA] text-[17px] md:text-[18px] leading-[1.55] font-light font-['Inter_Tight']" data-testid="wizard-composed-text">
              {composed}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2.5 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] flex items-center gap-2 transition-colors"
            data-testid="wizard-edit-toggle"
          >
            {editing ? <><Check className="w-3.5 h-3.5" /> Concluído</> : <>✎ Editar prompt</>}
          </button>
          <button
            onClick={copyPrompt}
            className="px-4 py-2.5 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] flex items-center gap-2 transition-colors"
            data-testid="wizard-copy"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-[#22C55E]" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
          </button>
          <button
            onClick={restart}
            className="px-4 py-2.5 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors"
            data-testid="wizard-restart"
          >
            Recomeçar
          </button>
        </div>

        <button
          onClick={() => navigate(`/app/generate?prompt=${encodeURIComponent(composed)}`)}
          className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#9333EA] text-white px-8 py-4 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25"
          data-testid="wizard-use"
        >
          <Sparkles className="w-4 h-4" /> Usar este prompt no Estúdio
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* =============================== */
  /*  QUESTION VIEW                  */
  /* =============================== */
  const Icon = step.icon;
  return (
    <div className="max-w-[900px] mx-auto pb-24" data-testid="wizard-page">
      <button onClick={() => navigate("/app/tools")} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <div className="mb-10 flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
          <Wand2 className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-2">Assistente</p>
          <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.02] mb-2 font-['Inter_Tight']">
            Cinco respostas. <span className="italic text-[#C4B5FD]">Um prompt forte.</span>
          </h1>
          <p className="text-[#8A8A8E] text-[14px] max-w-[640px]">
            Não sabes como descrever a tua ideia? Em 5 passos guio-te até um prompt profissional pronto para gerar.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-8" data-testid="wizard-progress">
        {progress.map((on, i) => (
          <div key={i} className={`flex-1 h-[3px] rounded-full transition-colors ${on ? "bg-[#7C3AED]" : "bg-[#2E2E30]"}`} />
        ))}
      </div>

      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#5A5A5E] mb-3">
        Passo {stepIdx + 1} de {STEPS.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-[#F4F1EA] text-[26px] md:text-[34px] font-light tracking-[-0.02em] mb-2 font-['Inter_Tight']" data-testid="wizard-question">
            <Icon className="inline-block w-7 h-7 text-[#C4B5FD] mr-3 -mt-1" strokeWidth={1.5} />
            {step.title}
          </h2>
          <p className="text-[#8A8A8E] text-[14px] mb-8 max-w-[640px]">{step.subtitle}</p>

          {id === "q1" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" data-testid="wizard-options-q1">
              {Q1_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.v}
                  active={answers.q1 === opt.v}
                  onClick={() => pickOption(opt.v)}
                  label={opt.label}
                  emoji={opt.emoji}
                  testId={`wiz-opt-q1-${opt.v}`}
                />
              ))}
            </div>
          )}

          {id === "q2" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" data-testid="wizard-options-q2">
              {Q2_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.v}
                  active={answers.q2 === opt.v}
                  onClick={() => pickOption(opt.v)}
                  label={opt.label}
                  testId={`wiz-opt-q2-${opt.v}`}
                />
              ))}
            </div>
          )}

          {id === "q3" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" data-testid="wizard-options-q3">
              {Q3_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.v}
                  active={answers.q3 === opt.v}
                  onClick={() => pickOption(opt.v)}
                  label={opt.label}
                  hint={opt.hint}
                  testId={`wiz-opt-q3-${opt.v}`}
                />
              ))}
            </div>
          )}

          {id === "q4" && (
            <div>
              <textarea
                value={q4Text}
                onChange={(e) => setQ4Text(e.target.value)}
                rows={6}
                maxLength={500}
                placeholder='Ex: "Mulher de 30 anos com cabelo curto, em rooftop ao pôr do sol em Lisboa, luz dourada quente"'
                className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-4 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
                data-testid="wiz-q4"
                autoFocus
              />
              <p className="text-[#5A5A5E] text-[11px] text-right mt-1.5 font-mono">{q4Text.length} / 500</p>
              <p className="text-[#8A8A8E] text-[11.5px] mb-2 mt-3">Inspira-te:</p>
              <div className="flex flex-wrap gap-2">
                {Q4_EXAMPLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ4Text(s)}
                    className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11.5px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors text-left"
                    data-testid={`wiz-q4-example-${s.slice(0, 10)}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {id === "q5" && (
            <div>
              <input
                value={q5Text}
                onChange={(e) => setQ5Text(e.target.value)}
                placeholder='Escreve "não" para saltar, ou descreve quem/o que serve de referência'
                className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-4 rounded-lg focus:outline-none font-['Inter_Tight'] transition-colors"
                data-testid="wiz-q5"
                autoFocus
              />
              <p className="text-[#8A8A8E] text-[11.5px] mt-3">
                Ex: "rosto da Ana Carolina, fotos do iPhone na pasta", "uma cadeira Eames", "ou deixa em branco".
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-10">
        {stepIdx > 0 && (
          <button
            onClick={() => setStepIdx(stepIdx - 1)}
            className="px-5 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] flex items-center gap-2 transition-colors"
            data-testid="wizard-back"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        )}
        <button
          onClick={goNext}
          disabled={busy}
          className="ml-auto bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white px-7 py-3 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2 shadow-lg shadow-[#7C3AED]/25"
          data-testid="wizard-next"
        >
          {busy ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> A compor…</>
          ) : (
            <>{stepIdx === STEPS.length - 1 ? "Compor prompt" : "Próximo"} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}

function OptionCard({ active, onClick, label, hint, emoji, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`relative text-left p-4 rounded-xl border-2 transition-all overflow-hidden group ${
        active
          ? "border-[#7C3AED] bg-[#7C3AED]/10"
          : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40 hover:bg-[#13131A]"
      }`}
    >
      {active && (
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
      )}
      <div className="relative flex items-start gap-3">
        {emoji && <span className="text-[#C4B5FD] text-[16px] mt-0.5">{emoji}</span>}
        <div className="flex-1 min-w-0">
          <p className={`text-[13.5px] font-medium font-['Inter_Tight'] ${active ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"}`}>
            {label}
          </p>
          {hint && <p className="text-[#8A8A8E] text-[11px] mt-0.5">{hint}</p>}
        </div>
        {active && (
          <div className="shrink-0 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}
