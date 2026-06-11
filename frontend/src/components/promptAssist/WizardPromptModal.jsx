import { useMemo, useState, useEffect } from "react";
import {
  Loader2, ArrowRight, Sparkles, ArrowLeft, Wand2, Copy, Check, X,
  Camera, Palette, Crop, FileText, Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import { wizardLocale, composeLocalPromptFromAnswers } from "../../lib/wizardData";

const STEP_ICONS = {
  image: ImageIcon,
  palette: Palette,
  crop: Crop,
  file: FileText,
  camera: Camera,
  light: Sparkles,
  spark: Sparkles,
};

const OPTION_STEPS = new Set(["q1", "q2", "q3", "q4", "q5", "q6", "q8"]);

export default function WizardPromptModal({ open, onOpenChange, onApply }) {
  const { t, lang } = useI18n();
  const locale = useMemo(() => wizardLocale(lang), [lang]);
  const { steps, q1, q2, q3, q4, q5, q6, q8, q7Examples } = locale;
  const { user } = useAuth();
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [q7Text, setQ7Text] = useState("");
  const [q9Text, setQ9Text] = useState("");
  const [busy, setBusy] = useState(false);
  const [composed, setComposed] = useState(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setStepIdx(0);
    setAnswers({});
    setQ7Text("");
    setQ9Text("");
    setComposed(null);
    setEditing(false);
    setBusy(false);
    setCopied(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const step = steps[stepIdx];
  const id = step?.id;
  const StepIcon = STEP_ICONS[step?.iconKey] || ImageIcon;
  const progress = useMemo(() => steps.map((_, i) => i <= stepIdx), [stepIdx, steps]);

  const optionsForStep = (stepId) => {
    if (stepId === "q1") return q1;
    if (stepId === "q2") return q2;
    if (stepId === "q3") return q3;
    if (stepId === "q4") return q4;
    if (stepId === "q5") return q5;
    if (stepId === "q6") return q6;
    if (stepId === "q8") return q8;
    return [];
  };

  const canAdvance = () => {
    if (OPTION_STEPS.has(id)) return !!answers[id];
    if (id === "q7") return q7Text.trim().length > 4;
    return true;
  };

  const submit = async () => {
    const final = { ...answers };
    if (q7Text.trim()) final.q7 = q7Text.trim();
    if (q9Text.trim()) final.q9 = q9Text.trim();
    if (!final.q1 || !final.q2 || !final.q3 || !final.q4 || !final.q5 || !final.q6 || !final.q7 || !final.q8) {
      toast.error(t("wiz_complete_required"));
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/wizard/compose", {
        answers: final,
        lang: user?.lang || lang || "en",
      });
      setComposed(data.prompt || composeLocalPromptFromAnswers(final, locale));
    } catch {
      setComposed(composeLocalPromptFromAnswers(final, locale));
      toast.info(t("wiz_compose_local"));
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    if (!canAdvance()) {
      toast.error(id === "q7" ? t("wiz_detail_more") : t("wiz_pick_option"));
      return;
    }
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
    else void submit();
  };

  const pickOption = (v) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setTimeout(() => {
      if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1);
    }, 120);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(composed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("common_copy_fail"));
    }
  };

  const applyAndClose = () => {
    if (!composed?.trim()) return;
    onApply(composed.trim());
    onOpenChange(false);
    toast.success(t("wiz_applied"));
  };

  if (!open) return null;

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      data-testid="wizard-prompt-modal"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label={t("close")}
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full sm:max-w-[900px] max-h-[92vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[rgba(147,51,234,0.35)] bg-[#111118] shadow-[0_0_40px_rgba(147,51,234,0.25)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(147,51,234,0.2)] shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#A855F7]" />
            <p className="text-white text-[13px] font-medium font-['Inter_Tight']">
              {composed ? t("wiz_result_eyebrow") : t("wiz_modal_title")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-white/5"
            data-testid="wizard-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {composed ? (
            <div>
              <p className="text-[#9CA3AF] text-[12px] mb-4">
                {t("wiz_modal_apply_hint")}
              </p>
              <div className="rounded-xl border border-[rgba(147,51,234,0.35)] bg-[#0A0A0F] p-4 mb-4">
                {editing ? (
                  <textarea
                    value={composed}
                    onChange={(e) => setComposed(e.target.value)}
                    rows={8}
                    className="w-full bg-transparent text-white text-[14px] leading-relaxed resize-none focus:outline-none"
                    data-testid="wizard-modal-edit"
                  />
                ) : (
                  <p className="text-white text-[14px] leading-relaxed" data-testid="wizard-modal-composed">
                    {composed}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="px-3 py-2 rounded-lg border border-[rgba(147,51,234,0.3)] text-[11px] text-[#C4B5FD] hover:bg-[#9333EA]/10"
                >
                  {editing ? t("wiz_edit_done") : t("wiz_edit_prompt")}
                </button>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="px-3 py-2 rounded-lg border border-[rgba(147,51,234,0.3)] text-[11px] text-[#C4B5FD] hover:bg-[#9333EA]/10 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? t("wiz_copied") : t("wiz_copy")}
                </button>
                <button
                  type="button"
                  onClick={() => { setComposed(null); setStepIdx(0); setAnswers({}); setQ7Text(""); setQ9Text(""); }}
                  className="px-3 py-2 rounded-lg border border-[rgba(147,51,234,0.3)] text-[11px] text-[#9CA3AF] hover:text-white"
                >
                  {t("wiz_restart")}
                </button>
                <button
                  type="button"
                  onClick={applyAndClose}
                  className="ml-auto px-5 py-2.5 rounded-lg bg-[#9333EA] hover:bg-[#A855F7] text-white text-[12px] font-medium flex items-center gap-2"
                  data-testid="wizard-modal-apply"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {t("wiz_modal_apply")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mb-6">
                {progress.map((on, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-[3px] rounded-full ${on ? "bg-[#9333EA]" : "bg-[#2E2E30]"}`}
                  />
                ))}
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] mb-2">
                {t("wiz_step", { a: stepIdx + 1, b: steps.length })}
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-white text-[20px] font-light mb-1 flex items-center gap-2 font-['Inter_Tight']">
                    <StepIcon className="w-5 h-5 text-[#A855F7]" strokeWidth={1.5} />
                    {step.title}
                  </h3>
                  <p className="text-[#9CA3AF] text-[13px] mb-5">{step.subtitle}</p>

                  {OPTION_STEPS.has(id) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {optionsForStep(id).map((opt) => (
                        <OptionCard
                          key={opt.v}
                          active={answers[id] === opt.v}
                          onClick={() => pickOption(opt.v)}
                          label={opt.label}
                          hint={opt.hint}
                          emoji={opt.emoji}
                        />
                      ))}
                    </div>
                  )}
                  {id === "q7" && (
                    <div>
                      <textarea
                        value={q7Text}
                        onChange={(e) => setQ7Text(e.target.value)}
                        rows={5}
                        maxLength={800}
                        placeholder={t("wiz_q4_ph")}
                        className="w-full bg-[#0A0A0F] border border-[rgba(147,51,234,0.25)] focus:border-[#9333EA] rounded-xl text-white text-[14px] px-3 py-3 resize-none focus:outline-none"
                        data-testid="wizard-modal-q7"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        {q7Examples.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setQ7Text(s)}
                            className="text-[#A855F7] text-[11px] underline decoration-dashed underline-offset-2 text-left"
                          >
                            {s.slice(0, 48)}…
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {id === "q9" && (
                    <input
                      value={q9Text}
                      onChange={(e) => setQ9Text(e.target.value)}
                      placeholder={t("wiz_q5_ph")}
                      className="w-full bg-[#0A0A0F] border border-[rgba(147,51,234,0.25)] focus:border-[#9333EA] rounded-xl text-white text-[14px] px-3 py-3 focus:outline-none"
                      data-testid="wizard-modal-q9"
                      autoFocus
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-3 mt-8">
                {stepIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIdx(stepIdx - 1)}
                    className="px-4 py-2.5 rounded-lg border border-[rgba(147,51,234,0.3)] text-[#9CA3AF] hover:text-white text-[12px] flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> {t("wiz_back")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={busy}
                  className="ml-auto px-6 py-2.5 rounded-lg bg-[#9333EA] hover:bg-[#A855F7] disabled:opacity-50 text-white text-[12px] font-medium flex items-center gap-2"
                  data-testid="wizard-modal-next"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t("wiz_composing")}
                    </>
                  ) : (
                    <>
                      {stepIdx === steps.length - 1 ? t("wiz_compose_btn") : t("wiz_next")}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionCard({ active, onClick, label, hint, emoji }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-xl border transition-all ${
        active
          ? "border-[#9333EA] bg-[#9333EA]/15"
          : "border-[rgba(147,51,234,0.2)] bg-[#0A0A0F] hover:border-[#9333EA]/40"
      }`}
    >
      <div className="flex items-start gap-2">
        {emoji && <span className="text-[14px]">{emoji}</span>}
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-medium ${active ? "text-white" : "text-[#D1D5DB]"}`}>{label}</p>
          {hint && <p className="text-[#6B7280] text-[10px] mt-0.5">{hint}</p>}
        </div>
        {active && <Check className="w-4 h-4 text-[#A855F7] shrink-0" />}
      </div>
    </button>
  );
}
