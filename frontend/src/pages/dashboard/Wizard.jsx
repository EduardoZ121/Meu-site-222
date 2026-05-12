import { useEffect, useState } from "react";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

export default function Wizard() {
  const { t } = useI18n();
  useTitle(t("sidebar_wizard"));
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [composed, setComposed] = useState(null);

  useEffect(() => {
    api.get("/public/wizard-steps").then((r) => setSteps(r.data.steps || []));
  }, []);

  const onNext = async () => {
    if (text.trim().length < 1) { toast.error(t("wiz_type_answer")); return; }
    const updated = { ...answers, [steps[step].id]: text };
    setAnswers(updated); setText("");
    if (step < steps.length - 1) { setStep(step + 1); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/wizard/compose", { answers: updated });
      setComposed(data.prompt);
    } catch (err) { toast.error(err?.response?.data?.detail || t("failed")); }
    finally { setBusy(false); }
  };

  if (!steps.length) return null;

  // Translate the question text via mapping by step id
  const questionFor = (id) => t(`wiz_q_${id}`) || steps.find((s) => s.id === id)?.prompt;

  return (
    <div className="max-w-[760px] mx-auto" data-testid="wizard-page">
      <p className="eyebrow mb-3">{t("wiz_eyebrow")}</p>
      <h1 className="heading-xl mb-12">{t("wiz_title_a")} <span className="italic text-rp-lavender">{t("wiz_title_b")}</span>{t("wiz_title_dot")}</h1>

      {!composed ? (
        <>
          <div className="flex items-center gap-2 mb-10" data-testid="wizard-progress">
            {steps.map((_, i) => (
              <div key={i} className={`flex-1 h-[2px] ${i <= step ? "bg-rp-purple" : "bg-rp-border"}`} />
            ))}
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-4">{t("wiz_step", { a: step + 1, b: steps.length })}</p>
          <p className="font-heading text-3xl text-rp-text mb-8 leading-tight" data-testid="wizard-question">{questionFor(steps[step].id)}</p>

          <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && onNext()} rows={3} placeholder={t("wiz_placeholder")} className="field-input resize-none mb-6" data-testid="wizard-answer" autoFocus />
          <button onClick={onNext} disabled={busy} className="btn-primary disabled:opacity-50" data-testid="wizard-next">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t("wiz_composing")}</>) : (<>{t("wiz_next")} <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </>
      ) : (
        <div className="border border-rp-purple p-8 bg-rp-purple/5" data-testid="wizard-result">
          <p className="eyebrow mb-4">{t("wiz_result_label")}</p>
          <p className="font-heading text-2xl text-rp-text leading-relaxed mb-8">{composed}</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate(`/app/generate?prompt=${encodeURIComponent(composed)}`)} className="btn-primary" data-testid="wizard-use">
              <Sparkles className="w-4 h-4" /> {t("wiz_use")}
            </button>
            <button onClick={() => { setComposed(null); setStep(0); setAnswers({}); }} className="btn-secondary" data-testid="wizard-restart">{t("wiz_restart")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
