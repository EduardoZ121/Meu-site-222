import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Eraser,
  History,
  ImageIcon,
  Loader2,
  Type,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../lib/i18n";
import StudioGenerateBar from "../StudioGenerateBar";
import { hasStudioCredits, useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import ImageUploadZone from "../ImageUploadZone";
import AspectPicker from "../AspectPicker";
import PromptAssistBar from "../promptAssist/PromptAssistBar";
import WizardPromptModal from "../promptAssist/WizardPromptModal";
import SuggestPromptModal from "../promptAssist/SuggestPromptModal";
import {
  pushArtisticPromptHistory,
  readArtisticPromptHistory,
} from "../../lib/artisticPromptHistory";

const QUICK_KEYS = [
  "art_quick_1",
  "art_quick_2",
  "art_quick_3",
  "art_quick_4",
  "art_quick_5",
  "art_quick_6",
];

export default function ArtisticPromptStudio({
  inputMode,
  setInputMode,
  isLabStyle,
  photo,
  setPhoto,
  prompt,
  setPrompt,
  aspect,
  setAspect,
  improve,
  setImprove,
  busy,
  cost,
  user,
  styleId,
  onGenerate,
  onImprovePrompt,
  improving,
}) {
  const { t } = useI18n();

  const needsPhoto = inputMode === "image" || isLabStyle;
  const generateReady = useMemo(() => {
    if (cost > 0 && !hasStudioCredits(user, cost)) return false;
    if (needsPhoto && !photo) return false;
    if (!styleId && prompt.trim().length < 3) return false;
    return true;
  }, [cost, user, needsPhoto, photo, styleId, prompt]);

  const generateHint = useMemo(() => {
    if (cost > 0 && !hasStudioCredits(user, cost)) {
      return t("studio_gen_hint_credits", { need: cost, have: user?.credits ?? 0 });
    }
    if (needsPhoto && !photo) {
      return isLabStyle ? t("art_lab_need_photo") : t("studio_gen_hint_photo");
    }
    if (!styleId && prompt.trim().length < 3) return t("art_empty");
    return null;
  }, [cost, user, needsPhoto, photo, isLabStyle, styleId, prompt, t]);

  const { ready, hint } = useStudioGenerateGate({
    busy,
    readyOverride: generateReady,
    hintOverride: generateHint,
  });
  const [wizardOpen, setWizardOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [history, setHistory] = useState(() => readArtisticPromptHistory());

  useEffect(() => {
    setHistory(readArtisticPromptHistory());
  }, []);

  const quickPrompts = useMemo(() => QUICK_KEYS.map((k) => t(k)), [t]);

  const copyPrompt = useCallback(async () => {
    if (!prompt.trim()) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(t("art_prompt_copied"));
    } catch {
      toast.error(t("common_copy_fail"));
    }
  }, [prompt, t]);

  const clearPrompt = () => {
    setPrompt("");
    toast.message(t("art_prompt_cleared"));
  };

  const applyFromHistory = (text) => {
    setPrompt(text.slice(0, 800));
  };

  const handleGenerate = () => {
    if (prompt.trim().length >= 3) {
      setHistory(pushArtisticPromptHistory(prompt));
    }
    onGenerate();
  };

  return (
    <div className="art-studio-prompt" data-testid="artistic-prompt-studio">
      <div className="art-studio-mode-toggle">
        <button
          type="button"
          disabled={isLabStyle}
          onClick={() => {
            if (isLabStyle) {
              toast.message(t("art_lab_image_hint"));
              return;
            }
            setInputMode("text");
          }}
          className={`art-studio-mode-btn ${inputMode === "text" ? "art-studio-mode-btn--active" : ""} ${
            isLabStyle ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          <Type className="w-4 h-4" /> {t("art_input_text")}
        </button>
        <button
          type="button"
          onClick={() => setInputMode("image")}
          className={`art-studio-mode-btn ${inputMode === "image" ? "art-studio-mode-btn--active" : ""}`}
        >
          <ImageIcon className="w-4 h-4" /> {t("art_input_image")}
        </button>
      </div>

      {inputMode === "image" && (
        <div className="mb-5">
          <ImageUploadZone
            value={photo}
            onChange={setPhoto}
            layout="wide"
            testId="artistic-studio-photo"
            emptyLabel={t("art_upload_label")}
            emptyHint={t("art_upload_hint")}
          />
        </div>
      )}

      <div className="art-studio-prompt__toolbar">
        <label className="art-studio-label">
          {inputMode === "image" ? t("art_prompt_label_image") : t("art_prompt_label")}
        </label>
        <div className="flex items-center gap-1.5">
          <span className="art-studio-char-count tabular-nums">
            {prompt.length}/800
          </span>
          <button
            type="button"
            onClick={copyPrompt}
            className="art-studio-icon-btn"
            title={t("art_prompt_copy")}
            data-testid="artistic-prompt-copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clearPrompt}
            className="art-studio-icon-btn"
            title={t("art_prompt_clear")}
            data-testid="artistic-prompt-clear"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onImprovePrompt}
            disabled={busy || improving || prompt.trim().length < 3}
            className="art-studio-icon-btn art-studio-icon-btn--accent"
            title={t("art_prompt_improve_btn")}
            data-testid="artistic-prompt-improve"
          >
            {improving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
        rows={inputMode === "text" ? 7 : 5}
        maxLength={800}
        placeholder={
          inputMode === "text" ? t("art_prompt_ph_text") : t("art_prompt_ph_image")
        }
        className="art-studio-textarea"
        data-testid="artistic-studio-prompt"
      />

      <p className="art-studio-sublabel mt-4 mb-2">{t("art_prompt_quick")}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {quickPrompts.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => setPrompt(idea.slice(0, 800))}
            className="art-studio-quick-chip"
            data-testid="artistic-quick-prompt"
          >
            {idea.length > 42 ? `${idea.slice(0, 42)}…` : idea}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <p className="art-studio-sublabel mb-2 flex items-center gap-1.5">
            <History className="w-3 h-3" /> {t("art_prompt_history")}
          </p>
          <div className="flex flex-wrap gap-2 mb-4 max-h-24 overflow-y-auto">
            {history.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => applyFromHistory(h)}
                className="art-studio-history-chip"
                data-testid="artistic-history-prompt"
              >
                {h.length > 48 ? `${h.slice(0, 48)}…` : h}
              </button>
            ))}
          </div>
        </>
      )}

      <PromptAssistBar
        improve={improve}
        onImproveChange={setImprove}
        onOpenWizard={() => setWizardOpen(true)}
        onOpenSuggest={() => setSuggestOpen(true)}
        promptLength={prompt.length}
        maxLength={800}
        testIdPrefix="artistic-prompt-assist"
      />

      <WizardPromptModal open={wizardOpen} onOpenChange={setWizardOpen} onApply={setPrompt} />
      <SuggestPromptModal open={suggestOpen} onOpenChange={setSuggestOpen} onApply={setPrompt} />

      <p className="art-studio-sublabel mt-5 mb-3">{t("art_format_label")}</p>
      <AspectPicker
        value={aspect}
        onChange={setAspect}
        hasPhoto={inputMode === "image" && !!photo}
        options={["1:1", "3:4", "4:5", "9:16", "16:9"]}
        testIdPrefix="art-studio-aspect"
      />

      <StudioGenerateBar
        layout="inline"
        className="mt-6"
        ready={ready}
        busy={busy}
        onClick={handleGenerate}
        label={t("art_generate_credits", { n: cost })}
        busyLabel={t("art_generating")}
        hint={hint}
        alignHint="start"
        testId="artistic-studio-generate"
        buttonClassName="!w-full"
      />
    </div>
  );
}
