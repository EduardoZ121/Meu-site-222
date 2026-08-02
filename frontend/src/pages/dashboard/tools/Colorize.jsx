import { useMemo, useState } from "react";
import { Palette, Sliders, MessageSquare, Check } from "lucide-react";
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
import { COLORIZE_STYLE_KEYS } from "../../../lib/toolPagesLocales";
import useTitle from "../../../lib/useTitle";

const COLORIZE_SWATCHES = {
  natural: ["#D9C2A8", "#A8C8E5", "#7BA17F", "#C97F5E"],
  cinematic: ["#1F4E5F", "#E8845C", "#0E2A35", "#F4B989"],
  vibrant: ["#EF4444", "#22C55E", "#3B82F6", "#FACC15"],
  historic: ["#A78A5C", "#6B5B47", "#C7A87C", "#3E3528"],
};

const COLORIZE_PROMPT_KEYS = [1, 2, 3, 4];

const VIBE_OPTIONS = [
  { value: "moderno", labelKey: "colorize_vibe_modern" },
  { value: "vintage", labelKey: "colorize_vibe_vintage" },
];

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

export default function Colorize() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat } = useI18n();
  const navigate = useNavigate();
  useTitle(tCat("tool_colorize_name"));
  const { user, refresh } = useAuth();
  const { costs } = usePricing();

  const styles = useMemo(
    () => COLORIZE_STYLE_KEYS.map((key) => ({
      key,
      label: t(`colorize_style_${key}_label`),
      hint: t(`colorize_style_${key}_hint`),
      swatch: COLORIZE_SWATCHES[key],
    })),
    [t],
  );

  const promptIdeas = useMemo(
    () => COLORIZE_PROMPT_KEYS.map((n) => t(`colorize_prompt_${n}`)),
    [t],
  );

  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [style, setStyle] = useState("natural");
  const [preserveSkin, setPreserveSkin] = useState(true);
  const [enhanceDetails, setEnhanceDetails] = useState(true);
  const [vibe, setVibe] = useState("moderno");
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const cost = costs.colorize;

  useStudioSessionBack("/app/tools");

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
  });

  const styleLabel = t(`colorize_style_${style}_label`);
  const tuningCount = (preserveSkin ? 1 : 0) + (enhanceDetails ? 1 : 0);
  const tuningLabel = `${tuningCount}/2 · ${t(vibe === "moderno" ? "colorize_vibe_modern" : "colorize_vibe_vintage")}`;
  const extraLabel = customPrompt.trim()
    ? `${customPrompt.trim().slice(0, 36)}${customPrompt.trim().length > 36 ? "…" : ""}`
    : (t("studio_styles_optional"));

  const run = async () => {
    if (!photo) { toast.error(t("colorize_err_upload")); return; }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("style", style);
      fd.append("preserve_skin", preserveSkin ? "true" : "false");
      fd.append("enhance_details", enhanceDetails ? "true" : "false");
      fd.append("vibe", vibe);
      fd.append("custom_prompt", customPrompt);
      const { data } = await uploadPost("/tools/colorize", fd, { timeout: 240000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("colorize_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  };

  const modalTitle = {
    style: t("colorize_section_style"),
    tuning: t("colorize_section_tuning"),
    extra: t("colorize_section_hint"),
  }[openKey] || "";

  const onPhotosChange = (next) => {
    setPhotos(next);
    setResult(null);
  };

  return (
    <StudioCompactShell testId="colorize-frame" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        title={tCat("tool_colorize_name")}
        description={t("colorize_desc_long")}
        testId="colorize-header"
        helpKey="help_tool_colorize"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("colorize_section_photo")}
          </p>
          <CompactImagePicker value={photos} onChange={onPhotosChange} maxFiles={1} testId="colorize-photo" />
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Palette}
            label={t("colorize_section_style")}
            value={styleLabel}
            onOpen={() => openModal("style")}
            testId="colorize-card-style"
            helpKey="help_sec_colorize_options"
          />
          <SettingCard
            icon={Sliders}
            label={t("colorize_section_tuning")}
            value={tuningLabel}
            onOpen={() => openModal("tuning")}
            testId="colorize-card-tuning"
            helpKey="help_sec_colorize_options"
          />
        </div>
        <SettingCard
          icon={MessageSquare}
          label={t("colorize_section_hint")}
          value={extraLabel}
          onOpen={() => openModal("extra")}
          testId="colorize-card-extra"
          helpKey="help_sec_prompt"
        />

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={run}
              label={t("colorize_btn", { n: cost })}
              busyLabel={t("colorize_processing")}
              hint={hint}
              cost={cost}
              testId="colorize-create-btn"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "style"} title={modalTitle} onClose={closeModal}>
        <div className="grid grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto overscroll-contain pr-0.5" data-testid="colorize-styles">
          {styles.map(({ key, label, hint: styleHint, swatch }) => (
            <button
              type="button"
              key={key}
              onClick={() => { setStyle(key); closeModal(); }}
              data-testid={`colorize-style-${key}`}
              className={`relative text-left p-3.5 rounded-2xl border-2 transition-all overflow-hidden group ${
                style === key
                  ? "border-[#7C3AED] bg-[#7C3AED]/10"
                  : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
              }`}
            >
              <div className="relative flex items-center gap-1 mb-2">
                {swatch.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-black/20" style={{ background: c }} />
                ))}
                {style === key && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className={`relative text-[14px] font-light tracking-[-0.01em] mb-1 font-display ${
                style === key ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
              }`}>{label}</p>
              <p className="relative text-[#8A8A8E] text-[10.5px] leading-snug">{styleHint}</p>
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="colorize-style-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "tuning"} title={modalTitle} onClose={closeModal}>
        <div className="space-y-3">
          <Toggle active={preserveSkin} onClick={() => setPreserveSkin(!preserveSkin)} label={t("colorize_toggle_skin")} hint={t("colorize_toggle_skin_hint")} testId="colorize-toggle-skin" />
          <Toggle active={enhanceDetails} onClick={() => setEnhanceDetails(!enhanceDetails)} label={t("colorize_toggle_details")} hint={t("colorize_toggle_details_hint")} testId="colorize-toggle-details" />
          <div className="rounded-xl border border-[#2E2E30] bg-[#13131A]/50 p-3.5" data-testid="colorize-vibe">
            <p className="text-[#F4F1EA] text-[13px] font-medium font-display">{t("colorize_finish_label")}</p>
            <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5 mb-3">{t("colorize_feel")}</p>
            <div className="inline-flex rounded-lg border border-[#2E2E30] p-0.5 bg-[#0B0B0C]">
              {VIBE_OPTIONS.map(({ value, labelKey }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setVibe(value)}
                  data-testid={`colorize-vibe-${value}`}
                  className={`px-4 py-1.5 text-[12px] rounded-md transition-all font-display ${
                    vibe === value
                      ? "bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30"
                      : "text-[#8A8A8E] hover:text-[#F4F1EA]"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="colorize-tuning-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "extra"} title={modalTitle} onClose={closeModal}>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={4}
          maxLength={PROMPT_MAX_LENGTH}
          placeholder={t("colorize_prompt_ph")}
          className="rp-editor-textarea rp-editor-textarea--compact min-h-[100px] w-full"
          data-testid="colorize-custom-prompt"
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
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="colorize-extra-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
