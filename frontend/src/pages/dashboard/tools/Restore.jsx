import { useMemo, useState } from "react";
import { History, Sliders, MessageSquare, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import CompactImagePicker from "../../../components/studio/CompactImagePicker";
import GenerationBubble from "../../../components/studio/GenerationBubble";
import SettingCard from "../../../components/studio/SettingCard";
import SettingModal from "../../../components/studio/SettingModal";
import StudioCompactShell from "../../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../../components/studio/StudioInlineHeader";
import StudioGenerateBar from "../../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../../lib/useStudioGenerateGate";
import { primaryStudioPhoto } from "../../../lib/studioFormData";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";
import { PROMPT_MAX_LENGTH } from "../../../lib/promptLimits";
import { useStudioSessionBack } from "../../../lib/useStudioSessionBack";
import { RESTORE_LEVEL_KEYS } from "../../../lib/toolPagesLocales";
import { restoreCostForLevel } from "../../../lib/creditPricing";
import useTitle from "../../../lib/useTitle";

const RESTORE_PROMPT_KEYS = [1, 2, 3, 4];

function IntensityBars({ active, index }) {
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
      type="button"
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
        <p className="text-[#F4F1EA] text-[13px] font-medium font-display">{label}</p>
        <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5">{hint}</p>
      </div>
    </button>
  );
}

export default function Restore() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat } = useI18n();
  const navigate = useNavigate();
  useTitle(tCat("tool_restore_name"));
  const { user, refresh } = useAuth();
  const { costs } = usePricing();

  const levels = useMemo(
    () => RESTORE_LEVEL_KEYS.map((key) => ({
      key,
      label: t(`restore_level_${key}_label`),
      hint: t(`restore_level_${key}_hint`),
    })),
    [t],
  );

  const promptIdeas = useMemo(
    () => RESTORE_PROMPT_KEYS.map((n) => t(`restore_prompt_${n}`)),
    [t],
  );

  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [level, setLevel] = useState("medio");
  const [enhanceFaces, setEnhanceFaces] = useState(true);
  const [recoverColors, setRecoverColors] = useState(true);
  const [removeNoise, setRemoveNoise] = useState(true);
  const [sharpen, setSharpen] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const cost = useMemo(() => restoreCostForLevel(costs, level), [costs, level]);

  useStudioSessionBack("/app/tools");

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
  });

  const optionsCount = [enhanceFaces, recoverColors, removeNoise, sharpen].filter(Boolean).length;
  const levelLabel = t(`restore_level_${level}_label`);
  const extraLabel = customPrompt.trim()
    ? `${customPrompt.trim().slice(0, 36)}${customPrompt.trim().length > 36 ? "…" : ""}`
    : (t("studio_styles_optional"));

  const run = async () => {
    if (!photo) { toast.error(t("restore_err_upload")); return; }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("level", level);
      fd.append("enhance_faces", enhanceFaces ? "true" : "false");
      fd.append("recover_colors", recoverColors ? "true" : "false");
      fd.append("remove_noise", removeNoise ? "true" : "false");
      fd.append("sharpen", sharpen ? "true" : "false");
      fd.append("custom_prompt", customPrompt);
      const { data } = await uploadPost("/tools/restore", fd, { timeout: 240000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("restore_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  };

  const modalTitle = {
    level: t("restore_section_level"),
    options: t("restore_section_advanced"),
    extra: t("restore_section_extra"),
  }[openKey] || "";

  const onPhotosChange = (next) => {
    setPhotos(next);
    setResult(null);
  };

  return (
    <StudioCompactShell testId="restore-frame" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        title={tCat("tool_restore_name")}
        description={t("restore_desc_long")}
        testId="restore-header"
        helpKey="help_tool_restore"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("common_upload_hint_drag")}
          </p>
          <CompactImagePicker value={photos} onChange={onPhotosChange} maxFiles={1} testId="restore-photo" />
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={History}
            label={t("restore_section_level")}
            value={levelLabel}
            onOpen={() => openModal("level")}
            testId="restore-card-level"
            helpKey="help_sec_restore_level"
          />
          <SettingCard
            icon={Sliders}
            label={t("restore_section_advanced")}
            value={`${optionsCount}/4`}
            onOpen={() => openModal("options")}
            testId="restore-card-options"
            helpKey="help_sec_restore_level"
          />
        </div>
        <SettingCard
          icon={MessageSquare}
          label={t("restore_section_extra")}
          value={extraLabel}
          onOpen={() => openModal("extra")}
          testId="restore-card-extra"
          helpKey="help_sec_prompt"
        />

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={run}
              label={t("restore_btn", { n: cost })}
              busyLabel={t("restore_processing")}
              hint={hint}
              cost={cost}
              testId="restore-create-btn"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "level"} title={modalTitle} onClose={closeModal}>
        <div className="grid grid-cols-1 gap-3" data-testid="restore-levels">
          {levels.map(({ key, label, hint: levelHint }, index) => (
            <button
              type="button"
              key={key}
              onClick={() => { setLevel(key); closeModal(); }}
              data-testid={`restore-level-${key}`}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                level === key
                  ? "border-[#7C3AED] bg-[#7C3AED]/10"
                  : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
              }`}
            >
              <div className="relative flex items-start justify-between mb-2">
                <IntensityBars active={level === key} index={index} />
                {level === key && (
                  <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className={`relative text-[16px] font-light tracking-[-0.01em] mb-1 font-display ${
                level === key ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
              }`}>{label}</p>
              <p className="relative text-[#8A8A8E] text-[11.5px] leading-snug">{levelHint}</p>
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="restore-level-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "options"} title={modalTitle} onClose={closeModal}>
        <div className="space-y-2.5">
          <Toggle active={enhanceFaces} onClick={() => setEnhanceFaces(!enhanceFaces)} label={t("restore_toggle_faces")} hint={t("restore_toggle_faces_hint")} testId="restore-toggle-faces" />
          <Toggle active={recoverColors} onClick={() => setRecoverColors(!recoverColors)} label={t("restore_toggle_colors")} hint={t("restore_toggle_colors_hint")} testId="restore-toggle-colors" />
          <Toggle active={removeNoise} onClick={() => setRemoveNoise(!removeNoise)} label={t("restore_toggle_noise")} hint={t("restore_toggle_noise_hint")} testId="restore-toggle-noise" />
          <Toggle active={sharpen} onClick={() => setSharpen(!sharpen)} label={t("restore_toggle_sharpen")} hint={t("restore_toggle_sharpen_hint")} testId="restore-toggle-sharpen" />
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="restore-options-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "extra"} title={modalTitle} onClose={closeModal}>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={4}
          maxLength={PROMPT_MAX_LENGTH}
          placeholder={t("restore_prompt_ph")}
          className="rp-editor-textarea rp-editor-textarea--compact min-h-[100px] w-full"
          data-testid="restore-custom-prompt"
        />
        <div className="flex flex-wrap gap-2 mt-2.5">
          {promptIdeas.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setCustomPrompt(s)}
              className="text-[#C4B5FD] hover:text-[#F4F1EA] text-[11px] underline decoration-[#5A5A5E] decoration-dashed underline-offset-4 hover:decoration-[#7C3AED] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="restore-extra-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
