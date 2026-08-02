import { useCallback, useEffect, useMemo, useState } from "react";
import { Ratio, Gauge, Check, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, uploadPost, pollPrediction, trackPendingPrediction } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import { usePhotoAspectDefault, ASPECT_MATCH } from "../../lib/usePhotoAspectDefault";
import StyleCover from "../../components/StyleCover";
import CompactImagePicker from "../../components/studio/CompactImagePicker";
import GenerationBubble from "../../components/studio/GenerationBubble";
import SettingCard from "../../components/studio/SettingCard";
import SettingModal from "../../components/studio/SettingModal";
import useTitle from "../../lib/useTitle";
import { useI18n } from "../../lib/i18n";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { appendStudioPhotos, primaryStudioPhoto } from "../../lib/studioFormData";
import { useStudioI18n } from "../../lib/useStudioI18n";
import StudioHelpTip from "../../components/studio/StudioHelpTip";
import { useStudioSessionBack } from "../../lib/useStudioSessionBack";
import { getPosterHqPremiumCost } from "../../lib/pricingRegions";
import { isAdminUser } from "../../lib/isAdmin";
import GPT_HQ_STYLES_FALLBACK from "../../config/gptHqStyles.json";

const FALLBACK_BY_ID = new Map(
  (Array.isArray(GPT_HQ_STYLES_FALLBACK) ? GPT_HQ_STYLES_FALLBACK : [])
    .filter((s) => s?.id)
    .map((s) => [s.id, s]),
);

/**
 * Public API strips prompts. Trust has_prompt/comingSoon from API;
 * never treat a missing prompt field as "coming soon".
 */
function normalizeStyle(raw) {
  if (!raw?.id) return null;
  const fb = FALLBACK_BY_ID.get(raw.id);
  const prompt = String(raw.prompt || fb?.prompt || "").trim();
  const costN = Number(raw.cost ?? fb?.cost);
  const hasPrompt = raw.has_prompt != null
    ? Boolean(raw.has_prompt)
    : Boolean(prompt);
  const comingSoon = raw.comingSoon != null
    ? Boolean(raw.comingSoon)
    : !hasPrompt;
  return {
    id: raw.id,
    name: raw.name || raw.label || fb?.name || raw.id,
    label: raw.label || raw.name || fb?.label || raw.id,
    cover: raw.cover || fb?.cover || "",
    prompt,
    cost: Number.isFinite(costN) && costN > 0 ? Math.round(costN) : getPosterHqPremiumCost(),
    comingSoon,
    has_prompt: hasPrompt,
  };
}

function loadFallbackStyles() {
  return (Array.isArray(GPT_HQ_STYLES_FALLBACK) ? GPT_HQ_STYLES_FALLBACK : [])
    .map(normalizeStyle)
    .filter(Boolean);
}

export default function GptHqStudio() {
  const { t } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  useTitle(t("gpt_hq_page_title"));
  const navigate = useNavigate();
  const { refresh, user } = useAuth();

  const [styles, setStyles] = useState(loadFallbackStyles);
  const [pickedStyle, setPickedStyle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [aspect, setAspect] = usePhotoAspectDefault(photos, "3:4", "3:4");
  const [quality, setQuality] = useState("hq");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  useStudioSessionBack(() => navigate("/app/tools"));

  useEffect(() => {
    api.get("/public/gpt-hq-styles")
      .then((r) => {
        const list = (r.data?.styles || []).map(normalizeStyle).filter(Boolean);
        if (list.length) setStyles(list);
      })
      .catch(() => {});
  }, []);

  const picked = useMemo(
    () => styles.find((s) => s.id === pickedStyle) || null,
    [styles, pickedStyle],
  );
  const styleReady = Boolean(picked?.has_prompt && !picked?.comingSoon);
  const cost = picked?.cost || getPosterHqPremiumCost();
  const premiumBalance = user?.premium_credits ?? 0;
  const hasHqCredits = Boolean(user?.is_unlimited || isAdminUser(user) || premiumBalance >= cost);

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    requirePreset: true,
    preset: styleReady ? pickedStyle : null,
    readyOverride: Boolean(photo && styleReady && hasHqCredits),
    hintOverride: !photo
      ? t("studio_gen_hint_photo")
      : !styleReady
        ? t("gpt_hq_need_style")
        : !hasHqCredits
          ? t("gpt_hq_need_credits", { need: cost, have: premiumBalance })
          : null,
  });

  const generate = useCallback(async () => {
    if (!photo) {
      toast.error(t("studio_gen_hint_photo"));
      return;
    }
    if (!styleReady || !pickedStyle) {
      toast.error(t("gpt_hq_need_style"));
      return;
    }
    if (!hasHqCredits) {
      toast.error(t("gpt_hq_need_credits", { need: cost, have: premiumBalance }));
      return;
    }

    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      appendStudioPhotos(fd, photos);
      fd.append("style_id", pickedStyle);
      fd.append("quality", quality);
      fd.append("aspect_ratio", apiAspectRatio(aspect, {
        model: "pro",
        hasPhoto: Boolean(photo) && (aspect === "match" || aspect === ASPECT_MATCH),
      }));
      const { data: submitData } = await uploadPost("/generate/gpt-hq-style", fd, {
        timeout: 300_000,
        headers: { "X-Skip-Auto-Poll": "1" },
        skipBlobOffload: !photo || photo.size < 3_500_000,
        blobOffloadTimeoutMs: 50_000,
      });

      if (submitData?.prediction_id) {
        trackPendingPrediction(submitData.prediction_id, {
          credits_spent: submitData.credits_spent ?? cost,
          type: "image",
        });
        const polled = await pollPrediction(submitData.prediction_id, {
          timeoutMs: 180_000,
          credits_spent: submitData.credits_spent ?? cost,
        });
        const normalized = normalizeCreation(polled?.creation);
        if (!primaryResultUrl(normalized)) throw new Error(t("gpt_hq_fail"));
        setResult(normalized);
      } else {
        const url = submitData?.result_url || submitData?.url;
        const normalized = normalizeCreation(
          submitData?.creation || (url ? { result_urls: [url], credits_spent: cost, type: "image" } : null),
        );
        if (!primaryResultUrl(normalized)) throw new Error(t("gpt_hq_fail"));
        setResult(normalized);
      }

      toast.success(t("gpt_hq_done"));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  }, [
    photo,
    photos,
    styleReady,
    pickedStyle,
    hasHqCredits,
    cost,
    premiumBalance,
    clearUploadToast,
    aspect,
    quality,
    refresh,
    t,
    errToast,
  ]);

  const aspectLabel = (aspect === "match" || aspect === ASPECT_MATCH)
    ? (t("aspect_original") || t("aspect_match") || "Original")
    : String(aspect || "3:4").toUpperCase();
  const qualityLabel = quality === "ultra"
    ? (t("gpt_hq_quality_ultra") || "Ultra")
    : (t("gpt_hq_quality_hq") || "HQ");
  const styleLabel = picked?.name
    || (t("gpt_hq_need_style") || t("studio_styles_optional"));

  const modalTitle = {
    format: t("pro_step_format"),
    quality: t("studio_hd_quality"),
    style: t("studio_card_style") || t("gpt_hq_styles_heading"),
  }[openKey] || "";

  const selectStyle = (id) => {
    const next = styles.find((s) => s.id === id);
    if (!next || next.comingSoon || !next.has_prompt) {
      toast.message(t("gpt_hq_need_style"));
      return;
    }
    setPickedStyle(id);
    closeModal();
  };

  const selectableStyles = styles.filter((s) => s.has_prompt && !s.comingSoon);
  const lockedCount = styles.length - selectableStyles.length;

  return (
    <StudioCompactShell testId="gpt-hq-studio-page" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        eyebrow={t("gpt_hq_wallet")}
        title={t("gpt_hq_title")}
        description={t("gpt_hq_subtitle")}
        testId="gpt-hq-header"
        helpKey="help_page_gpt_hq"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-[#FACC15]/15 bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("gpt_hq_upload_hint")}
          </p>
          <CompactImagePicker value={photos} onChange={setPhotos} maxFiles={1} testId="gpt-hq-photo" />
        </div>

        <SettingCard
          icon={Palette}
          label={t("studio_card_style") || t("gpt_hq_styles_heading")}
          value={styleLabel}
          thumbSrc={picked?.cover || undefined}
          meta={picked ? `${picked.cost} HQ` : undefined}
          onOpen={() => openModal("style")}
          testId="gpt-hq-card-style"
          helpKey="help_sec_gpt_hq_style"
        />

        <div className="mv-setting-grid">
          <SettingCard
            icon={Ratio}
            label={t("pro_step_format")}
            value={aspectLabel}
            onOpen={() => openModal("format")}
            testId="gpt-hq-card-format"
            helpKey="help_sec_format"
          />
          <SettingCard
            icon={Gauge}
            label={t("studio_hd_quality")}
            value={qualityLabel}
            onOpen={() => openModal("quality")}
            testId="gpt-hq-card-quality"
            helpKey="help_ctrl_hd_quality"
          />
        </div>

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={generate}
              label={t("gpt_hq_generate", { n: cost })}
              busyLabel={t("pro_loading")}
              hint={hint}
              cost={cost}
              testId="gpt-hq-create"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} wallet="premium" />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "style"} title={modalTitle} onClose={closeModal}>
        {styles.length === 0 ? (
          <p className="text-[#8A8A8E] text-[13px] leading-relaxed py-2">
            {t("gpt_hq_styles_empty")}
          </p>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[52vh] overflow-y-auto overscroll-contain pr-0.5"
            data-testid="gpt-hq-styles"
          >
            {styles.map((s) => {
              const active = pickedStyle === s.id;
              const locked = s.comingSoon || !s.has_prompt;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => selectStyle(s.id)}
                  disabled={locked}
                  aria-pressed={active}
                  className={`pro-preset-card ${active ? "pro-preset-card--active" : ""} ${locked ? "opacity-55 cursor-not-allowed" : ""}`}
                  data-testid={`gpt-hq-style-${s.id}`}
                >
                  <StyleCover
                    id={s.id}
                    title={s.name}
                    prompt={s.prompt || s.name}
                    category="enhance"
                    eyebrow={locked ? (t("gpt_hq_coming_soon")) : `${s.cost} HQ`}
                    selected={active}
                    compact
                    coverSrc={s.cover || undefined}
                    className="pro-preset-card__cover"
                  />
                </button>
              );
            })}
          </div>
        )}
        {lockedCount > 0 && selectableStyles.length === 0 ? (
          <p className="text-[11px] text-[#8A8A8E] leading-relaxed mt-2" data-testid="gpt-hq-empty-note">
            {t("gpt_hq_styles_empty")}
          </p>
        ) : null}
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="gpt-hq-style-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
        <AspectPicker
          value={aspect}
          onChange={setAspect}
          hasPhoto={!!photo}
          testIdPrefix="gpt-hq-aspect"
          premium
        />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="gpt-hq-format-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "quality"} title={modalTitle} onClose={closeModal}>
        <div className="mv-picker__chips">
          <button
            type="button"
            onClick={() => setQuality("hq")}
            className={`mktvid-chip ${quality === "hq" ? "mktvid-chip-active" : ""}`}
            data-testid="gpt-hq-quality-hq"
          >
            {t("gpt_hq_quality_hq") || "HQ"}
          </button>
          <button
            type="button"
            onClick={() => setQuality("ultra")}
            className={`mktvid-chip ${quality === "ultra" ? "mktvid-chip-active" : ""}`}
            data-testid="gpt-hq-quality-ultra"
          >
            {t("gpt_hq_quality_ultra") || "Ultra"}
          </button>
        </div>
        <div className="mt-2">
          <StudioHelpTip helpKey="help_ctrl_hd_quality" testId="gpt-hq-quality-help" size="lg" />
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="gpt-hq-quality-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
