import { useMemo, useState, useEffect } from "react";
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
import { useI18n } from "../../lib/i18n";
import { useStudioI18n } from "../../lib/useStudioI18n";
import { optionLabel, wizardLocale } from "../../lib/wizardData";
import { stashWizardPrompt } from "../../lib/wizardPromptTransfer";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioGenerateBar from "../../components/StudioGenerateBar";

const STEP_ICONS = {
  image: ImageIcon,
  palette: Palette,
  crop: Crop,
  file: FileText,
  camera: Camera,
};

function composeLocalPrompt(answers, locale) {
  const { q1, q2, q3, compose } = locale;
  const type = optionLabel(q1, answers.q1);
  const style = optionLabel(q2, answers.q2);
  const format = optionLabel(q3, answers.q3);
  const subject = answers.q4;
  const reference = answers.q5
    ? compose.reference.replace("{ref}", answers.q5)
    : "";
  return [
    compose.create.replace("{type}", type).replace("{style}", style),
    compose.format.replace("{format}", format),
    compose.subject.replace("{subject}", subject),
    compose.footer,
    reference,
  ].join(" ").trim();
}

export default function Wizard() {
  const { t, lang } = useI18n();
  const { errToast } = useStudioI18n();
  const locale = useMemo(() => wizardLocale(lang), [lang]);
  const { steps, q1, q2, q3, q4Examples, compose } = locale;

  useTitle(t("wiz_page_title"));
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
  const [mobileTab, setMobileTab] = useState("create");

  useEffect(() => {
    if (composed) {
      setMobileTab("result");
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent("rp:scroll-to-result"));
      });
    }
  }, [composed]);

  const goToStudio = () => {
    if (!composed?.trim()) return;
    stashWizardPrompt(composed.trim());
    navigate("/app/generate?from=wizard");
  };

  const step = steps[stepIdx];
  const id = step.id;
  const StepIcon = STEP_ICONS[step.iconKey] || ImageIcon;
  const progress = useMemo(() => steps.map((_, i) => i <= stepIdx), [stepIdx, steps]);

  const canAdvance = () => {
    if (id === "q1" || id === "q2" || id === "q3") return !!answers[id];
    if (id === "q4") return q4Text.trim().length > 4;
    return true;
  };

  const goNext = () => {
    if (!canAdvance()) {
      toast.error(id === "q4" ? t("wiz_detail_more") : t("wiz_pick_option"));
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

  const submit = async () => {
    const final = { ...answers };
    if (q4Text.trim()) final.q4 = q4Text.trim();
    if (q5Text.trim()) final.q5 = q5Text.trim();
    if (!final.q1 || !final.q2 || !final.q3 || !final.q4) {
      toast.error(t("wiz_complete_first4"));
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/wizard/compose", {
        answers: final,
        lang: user?.lang || lang || "en",
      });
      setComposed(data.prompt || composeLocalPrompt(final, { q1, q2, q3, compose }));
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 401 || status === 403) {
        toast.error(detail || t("wiz_login_required"));
      } else if (status === 503) {
        toast.error(detail || t("wiz_server_account"));
      } else {
        errToast(err);
      }
      setComposed(composeLocalPrompt(final, { q1, q2, q3, compose }));
      if (status !== 401 && status !== 403) {
        toast.info(t("wiz_compose_local"));
      }
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setComposed(null);
    setStepIdx(0);
    setAnswers({});
    setQ4Text("");
    setQ5Text("");
    setEditing(false);
    setMobileTab("create");
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

  if (composed) {
    const panelVisibility = (tab) => (mobileTab !== tab ? "hidden md:block" : "");
    return (
      <motion.div className="max-w-[860px] mx-auto pb-28" data-testid="wizard-result-page">
        <div
          className="md:hidden flex gap-2 mb-5 p-1 rounded-xl border border-white/[0.08] bg-white/[0.03]"
          role="tablist"
          data-testid="wizard-mobile-tabs"
        >
          {[
            { id: "create", labelKey: "studio_tab_create", icon: Wand2 },
            { id: "result", labelKey: "studio_tab_result", icon: Sparkles },
          ].map(({ id, labelKey, icon: Icon }) => {
            const active = mobileTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileTab(id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                    : "text-rp-mute2 hover:text-rp-mute"
                }`}
                data-testid={`wizard-tab-${id}`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2 : 1.75} />
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        <div className={panelVisibility("create")}>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-3">
            {t("wiz_result_eyebrow")}
          </p>
          <h1 className="text-[#F4F1EA] text-[36px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.05] mb-4 font-['Inter_Tight']">
            {t("wiz_result_title")}
          </h1>
          <motion.div className="flex flex-wrap gap-2 mb-6">
            <button type="button" onClick={() => setEditing(!editing)} className="px-4 py-2.5 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] flex items-center gap-2 transition-colors" data-testid="wizard-edit-toggle">
              {editing ? <><Check className="w-3.5 h-3.5" /> {t("wiz_edit_done")}</> : <>✎ {t("wiz_edit_prompt")}</>}
            </button>
            <button type="button" onClick={copyPrompt} className="px-4 py-2.5 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] flex items-center gap-2 transition-colors" data-testid="wizard-copy">
              {copied ? <><Check className="w-3.5 h-3.5 text-[#22C55E]" /> {t("wiz_copied")}</> : <><Copy className="w-3.5 h-3.5" /> {t("wiz_copy")}</>}
            </button>
            <button type="button" onClick={restart} className="px-4 py-2.5 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] transition-colors" data-testid="wizard-restart">
              {t("wiz_restart")}
            </button>
          </motion.div>
        </div>

        <StudioResultAnchor busy={false} ready className={`${panelVisibility("result")} mb-6`}>
          <motion.div
            className="rounded-2xl border border-[#7C3AED]/40 bg-gradient-to-br from-[#13131A] to-[#0B0B0C] p-7 relative overflow-hidden"
            data-testid="wizard-result"
          >
            <motion.div className="absolute -top-16 -right-16 w-48 h-48 bg-[#7C3AED]/15 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-5 relative">
              <Wand2 className="w-4 h-4 text-[#C4B5FD]" />
              <p className="text-[#C4B5FD] text-[11px] font-mono uppercase tracking-[0.2em]">
                {t("wiz_words", { n: composed.split(/\s+/).length })}
              </p>
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
          </motion.div>
        </StudioResultAnchor>

        <div className="hidden md:block">
          <button
            type="button"
            onClick={goToStudio}
            className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#9333EA] text-white px-8 py-4 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25"
            data-testid="wizard-use"
          >
            <Sparkles className="w-4 h-4" /> {t("wiz_use_studio")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <StudioGenerateBar
          ready
          busy={false}
          onClick={goToStudio}
          label={t("wiz_use_studio")}
          hint={t("wiz_result_hint")}
          testId="wizard-use-bar"
          icon={Sparkles}
          className="md:hidden"
        />
      </motion.div>
    );
  }

  return (
    <motion.div className="max-w-[900px] mx-auto pb-24" data-testid="wizard-page">
      <motion.div className="mb-8 md:mb-10 flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
          <Wand2 className="w-7 h-7 text-[#C4B5FD]" strokeWidth={1.5} />
        </div>
        <motion.div>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-2">
            {t("wiz_eyebrow")}
          </p>
          <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.02] mb-2 font-['Inter_Tight']">
            {t("wiz_title_a")}{" "}
            <span className="italic text-[#C4B5FD]">{t("wiz_title_strong")}</span>
          </h1>
          <p className="text-[#8A8A8E] text-[14px] max-w-[640px]">{t("wiz_desc")}</p>
        </motion.div>
      </motion.div>

      <motion.div className="flex items-center gap-1.5 mb-8" data-testid="wizard-progress">
        {progress.map((on, i) => (
          <div
            key={i}
            className={`flex-1 h-[3px] rounded-full transition-colors ${on ? "bg-[#7C3AED]" : "bg-[#2E2E30]"}`}
          />
        ))}
      </motion.div>

      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#5A5A5E] mb-3">
        {t("wiz_step", { a: stepIdx + 1, b: steps.length })}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2
            className="text-[#F4F1EA] text-[26px] md:text-[34px] font-light tracking-[-0.02em] mb-2 font-['Inter_Tight']"
            data-testid="wizard-question"
          >
            <StepIcon className="inline-block w-7 h-7 text-[#C4B5FD] mr-3 -mt-1" strokeWidth={1.5} />
            {step.title}
          </h2>
          <p className="text-[#8A8A8E] text-[14px] mb-8 max-w-[640px]">{step.subtitle}</p>

          {id === "q1" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" data-testid="wizard-options-q1">
              {q1.map((opt) => (
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
              {q2.map((opt) => (
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
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" data-testid="wizard-options-q3">
              {q3.map((opt) => (
                <OptionCard
                  key={opt.v}
                  active={answers.q3 === opt.v}
                  onClick={() => pickOption(opt.v)}
                  label={opt.label}
                  hint={opt.hint}
                  testId={`wiz-opt-q3-${opt.v}`}
                />
              ))}
            </motion.div>
          )}

          {id === "q4" && (
            <motion.div>
              <textarea
                value={q4Text}
                onChange={(e) => setQ4Text(e.target.value)}
                rows={6}
                maxLength={500}
                placeholder={t("wiz_q4_ph")}
                className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-4 rounded-lg focus:outline-none resize-none font-['Inter_Tight'] transition-colors"
                data-testid="wiz-q4"
                autoFocus
              />
              <p className="text-[#5A5A5E] text-[11px] text-right mt-1.5 font-mono">
                {q4Text.length} / 500
              </p>
              <p className="text-[#8A8A8E] text-[11.5px] mb-2 mt-3">{t("wiz_inspire")}</p>
              <div className="flex flex-wrap gap-2">
                {q4Examples.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQ4Text(s)}
                    className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11.5px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors text-left"
                    data-testid={`wiz-q4-example-${s.slice(0, 10)}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {id === "q5" && (
            <motion.div>
              <input
                value={q5Text}
                onChange={(e) => setQ5Text(e.target.value)}
                placeholder={t("wiz_q5_ph")}
                className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-4 rounded-lg focus:outline-none font-['Inter_Tight'] transition-colors"
                data-testid="wiz-q5"
                autoFocus
              />
              <p className="text-[#8A8A8E] text-[11.5px] mt-3">{t("wiz_q5_hint")}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="hidden md:flex gap-3 mt-10">
        {stepIdx > 0 && (
          <button
            type="button"
            onClick={() => setStepIdx(stepIdx - 1)}
            className="px-5 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] flex items-center gap-2 transition-colors"
            data-testid="wizard-back"
          >
            <ArrowLeft className="w-4 h-4" /> {t("wiz_back")}
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={busy}
          className="ml-auto bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white px-7 py-3 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2 shadow-lg shadow-[#7C3AED]/25"
          data-testid="wizard-next"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {t("wiz_composing")}
            </>
          ) : (
            <>
              {stepIdx === steps.length - 1 ? t("wiz_compose_btn") : t("wiz_next")}{" "}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {stepIdx > 0 && (
        <button
          type="button"
          onClick={() => setStepIdx(stepIdx - 1)}
          className="md:hidden mt-8 mb-2 px-5 py-3 border border-[#2E2E30] hover:border-[#7C3AED]/50 text-[#8A8A8E] hover:text-[#F4F1EA] rounded-lg text-[12.5px] flex items-center gap-2 transition-colors w-fit"
          data-testid="wizard-back-mobile"
        >
          <ArrowLeft className="w-4 h-4" /> {t("wiz_back")}
        </button>
      )}

      <StudioGenerateBar
        ready={canAdvance()}
        busy={busy}
        onClick={goNext}
        label={stepIdx === steps.length - 1 ? t("wiz_compose_btn") : t("wiz_next")}
        busyLabel={t("wiz_composing")}
        hint={!canAdvance() ? (id === "q4" ? t("wiz_detail_more") : t("wiz_pick_option")) : null}
        testId="wizard-next-bar"
        icon={ArrowRight}
        className="md:hidden"
      />
    </motion.div>
  );
}

function OptionCard({ active, onClick, label, hint, emoji, testId }) {
  return (
    <button
      type="button"
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
          <p
            className={`text-[13.5px] font-medium font-['Inter_Tight'] ${active ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"}`}
          >
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
