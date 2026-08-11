import { useMemo, useState } from "react";
import { Scissors, Sliders, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { uploadPost, pollPrediction, trackPendingPrediction } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";
import { BG_SCENE_KEYS } from "../../../lib/toolPagesLocales";
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
import { useStudioSessionBack } from "../../../lib/useStudioSessionBack";
import useTitle from "../../../lib/useTitle";

const BG_PROMPT_CHIP_KEYS = [1, 2, 3, 4];

const SCENE_SWATCHES = {
  white: "linear-gradient(135deg,#FFFFFF,#E5E5E5)",
  studio: "linear-gradient(135deg,#3A3A3F,#1A1A1C)",
  black: "linear-gradient(135deg,#1A1A1C,#000000)",
  gradient: "linear-gradient(135deg,#C4B5FD,#FBCFE8)",
  beach: "linear-gradient(135deg,#FDE68A,#7DD3FC)",
  neon: "linear-gradient(135deg,#EC4899,#06B6D4)",
  outdoor: "linear-gradient(135deg,#86EFAC,#22C55E)",
  minimal: "linear-gradient(135deg,#F5E6D3,#E5D4BD)",
};

const SOLID_COLORS = [
  "#FFFFFF", "#000000", "#7C3AED", "#EC4899",
  "#06B6D4", "#22C55E", "#F59E0B", "#EF4444",
  "#F4F1EA", "#1A1A1C", "#C4B5FD", "#FBCFE8",
];

function ModeTab({ active, onClick, label, hint, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`relative text-left p-3.5 rounded-xl border-2 transition-all ${
        active
          ? "border-[#7C3AED] bg-[#7C3AED]/10"
          : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
      }`}
    >
      <p className={`text-[13px] font-medium mb-1 font-display ${active ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"}`}>
        {label}
      </p>
      <p className="text-[#8A8A8E] text-[11px] leading-snug">{hint}</p>
      {active && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function Toggle({ active, onClick, label, hint, disabled, disabledHint, testId }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-testid={testId}
      className={`w-full flex items-start gap-4 p-3.5 rounded-xl border transition-all text-left ${
        disabled
          ? "border-[#1F1F22] bg-[#0E0E12]/40 opacity-50 cursor-not-allowed"
          : active
            ? "border-[#7C3AED]/60 bg-[#7C3AED]/8"
            : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40"
      }`}
    >
      <div className={`shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors relative ${active ? "bg-[#7C3AED]" : "bg-[#2E2E30]"}`}>
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
            active ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F4F1EA] text-[13px] font-medium font-display">{label}</p>
        <p className="text-[#8A8A8E] text-[11.5px] leading-snug mt-0.5">
          {hint}{disabled && disabledHint ? <span className="text-[#5A5A5E]"> {disabledHint}</span> : null}
        </p>
      </div>
    </button>
  );
}

export default function BgRemove() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCatalogue } = useI18n();
  const navigate = useNavigate();
  useTitle(tCatalogue("tool_bg_remove_name"));
  const { user, refresh } = useAuth();
  const { costs } = usePricing();

  const scenePresets = useMemo(
    () => BG_SCENE_KEYS.map((key) => ({
      key,
      label: t(`bg_scene_${key}`),
      swatch: SCENE_SWATCHES[key],
    })),
    [t],
  );

  const customPromptChips = useMemo(
    () => BG_PROMPT_CHIP_KEYS.map((n) => t(`bg_prompt_chip_${n}`)),
    [t],
  );

  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [mode, setMode] = useState("transparent");
  const [solidColor, setSolidColor] = useState("#FFFFFF");
  const [sceneKey, setSceneKey] = useState("white");
  const [customPrompt, setCustomPrompt] = useState("");
  const [keepShadow, setKeepShadow] = useState(false);
  const [refineHair, setRefineHair] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const cost = mode === "scene" || mode === "custom" ? costs.bgRemoveScene : costs.bgRemove;

  useStudioSessionBack("/app/tools");

  const customBgOk = mode !== "custom" || customPrompt.trim().length >= 4;

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    readyOverride: Boolean(photo) && customBgOk,
    hintOverride: !photo
      ? null
      : !customBgOk
        ? t("bg_err_describe")
        : null,
  });

  const modeLabel = useMemo(() => {
    if (mode === "transparent") return t("bg_mode_transparent");
    if (mode === "solid") return `${t("bg_mode_solid")} · ${solidColor.toUpperCase()}`;
    if (mode === "scene") {
      return scenePresets.find((p) => p.key === sceneKey)?.label || t("bg_mode_scene");
    }
    const p = customPrompt.trim();
    if (p.length >= 4) return `${p.slice(0, 36)}${p.length > 36 ? "…" : ""}`;
    return t("bg_mode_describe");
  }, [mode, solidColor, sceneKey, customPrompt, scenePresets, t]);

  const tuningCount = (refineHair ? 1 : 0) + (keepShadow && mode !== "transparent" ? 1 : 0);
  const tuningLabel = tuningCount === 0
    ? (t("studio_styles_optional"))
    : `${tuningCount}/2`;

  const run = async () => {
    if (!photo) { toast.error(t("common_upload_first")); return; }
    if (mode === "custom" && customPrompt.trim().length < 4) {
      toast.error(t("bg_err_describe"));
      return;
    }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("bg_mode", mode);
      fd.append("bg_prompt", customPrompt);
      fd.append("scene_key", sceneKey);
      fd.append("solid_color", solidColor);
      fd.append("keep_shadow", keepShadow ? "true" : "false");
      fd.append("refine_hair", refineHair ? "true" : "false");
      const skipPollHeaders = { "X-Skip-Auto-Poll": "1" };
      const { data: submitData } = await uploadPost("/tools/bg-remove", fd, {
        timeout: 120000,
        pollTimeoutMs: 300000,
        headers: skipPollHeaders,
      });
      if (!submitData?.prediction_id) {
        const creation = normalizeCreation(submitData?.creation);
        if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
        setResult(creation);
        toast.success(t("bg_success", { n: creation?.credits_spent ?? cost }));
        await refresh();
        return;
      }
      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent ?? cost,
        type: "image",
      });
      const polled = await pollPrediction(submitData.prediction_id, {
        pollTimeoutMs: 300000,
        credits_spent: submitData.credits_spent ?? cost,
        type: "image",
      });
      const creation = normalizeCreation(polled?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("bg_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  };

  const modalTitle = {
    mode: t("bg_section_mode"),
    tuning: t("bg_section_tuning"),
  }[openKey] || "";

  const onPhotosChange = (next) => {
    setPhotos(next);
    setResult(null);
  };

  return (
    <StudioCompactShell testId="bg-remove-frame" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        title={tCatalogue("tool_bg_remove_name")}
        description={tCatalogue("tool_bg_remove_desc")}
        testId="bg-remove-header"
        helpKey="help_tool_bgremove"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {tCatalogue("tool_bg_remove_desc")}
          </p>
          <CompactImagePicker value={photos} onChange={onPhotosChange} maxFiles={1} testId="bg-remove-photo" />
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Scissors}
            label={t("bg_section_mode")}
            value={modeLabel}
            onOpen={() => openModal("mode")}
            testId="bg-card-mode"
            helpKey="help_sec_bgremove_options"
          />
          <SettingCard
            icon={Sliders}
            label={t("bg_section_tuning")}
            value={tuningLabel}
            onOpen={() => openModal("tuning")}
            testId="bg-card-tuning"
            helpKey="help_sec_bgremove_options"
          />
        </div>

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={run}
              label={t("bg_btn", { n: cost })}
              busyLabel={t("bg_processing")}
              hint={hint}
              cost={cost}
              testId="bg-remove-create-btn"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "mode"} title={modalTitle} onClose={closeModal}>
        <p className="text-[#8A8A8E] text-[12px] mb-3 leading-relaxed">{t("bg_mode_hint")}</p>
        <div className="grid grid-cols-2 gap-2" data-testid="bg-remove-mode-tabs">
          <ModeTab
            active={mode === "transparent"}
            onClick={() => setMode("transparent")}
            label={t("bg_mode_transparent")}
            hint={t("bg_mode_transparent_hint")}
            testId="bg-mode-transparent"
          />
          <ModeTab
            active={mode === "solid"}
            onClick={() => setMode("solid")}
            label={t("bg_mode_solid")}
            hint={t("bg_mode_solid_hint")}
            testId="bg-mode-solid"
          />
          <ModeTab
            active={mode === "scene"}
            onClick={() => setMode("scene")}
            label={t("bg_mode_scene")}
            hint={t("bg_mode_scene_hint")}
            testId="bg-mode-scene"
          />
          <ModeTab
            active={mode === "custom"}
            onClick={() => setMode("custom")}
            label={t("bg_mode_describe")}
            hint={t("bg_mode_custom_hint")}
            testId="bg-mode-custom"
          />
        </div>

        {mode === "solid" && (
          <div className="mt-4">
            <p className="text-[#8A8A8E] text-[12px] mb-3">{t("bg_pick_color")}</p>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2" data-testid="bg-remove-solid-palette">
              {SOLID_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSolidColor(c)}
                  className={`aspect-square rounded-lg border-2 transition-all ${
                    solidColor === c
                      ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/30 scale-[1.05]"
                      : "border-[#2E2E30] hover:border-[#7C3AED]/40"
                  }`}
                  style={{ background: c }}
                  data-testid={`bg-color-${c.replace("#", "")}`}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                className="w-10 h-10 rounded-md bg-transparent border border-[#2E2E30] cursor-pointer"
                data-testid="bg-remove-color-picker"
              />
              <span className="text-[#8A8A8E] text-[12px] font-mono">{solidColor.toUpperCase()}</span>
            </div>
          </div>
        )}

        {mode === "scene" && (
          <div className="mt-4">
            <p className="text-[#8A8A8E] text-[12px] mb-3">{t("bg_scene_ai")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[40vh] overflow-y-auto overscroll-contain pr-0.5" data-testid="bg-remove-scene-presets">
              {scenePresets.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setSceneKey(p.key)}
                  className={`relative aspect-[5/3] rounded-lg border-2 overflow-hidden transition-all text-left p-2.5 ${
                    sceneKey === p.key
                      ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/30"
                      : "border-[#2E2E30] hover:border-[#7C3AED]/40"
                  }`}
                  style={{ background: p.swatch }}
                  data-testid={`bg-scene-${p.key}`}
                >
                  <div className="absolute inset-0 bg-black/25" />
                  <span className="relative text-white text-[12px] font-medium drop-shadow font-display">
                    {p.label}
                  </span>
                  {sceneKey === p.key && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "custom" && (
          <div className="mt-4">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
                            placeholder={t("bg_prompt_ph")}
              className="rp-editor-textarea rp-editor-textarea--compact min-h-[88px] w-full"
              data-testid="bg-remove-custom-prompt"
            />
            <div className="flex flex-wrap gap-2 mt-2.5">
              {customPromptChips.map((s) => (
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
          </div>
        )}

        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="bg-mode-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "tuning"} title={modalTitle} onClose={closeModal}>
        <div className="space-y-2.5">
          <Toggle
            active={refineHair}
            onClick={() => setRefineHair(!refineHair)}
            label={t("bg_tune_hair")}
            hint={t("bg_tune_hair_hint")}
            testId="bg-toggle-hair"
          />
          <Toggle
            active={keepShadow}
            onClick={() => setKeepShadow(!keepShadow)}
            label={t("bg_tune_shadow")}
            hint={t("bg_tune_shadow_hint")}
            testId="bg-toggle-shadow"
            disabled={mode === "transparent"}
            disabledHint={t("bg_shadow_disabled")}
          />
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="bg-tuning-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
