import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Palette, Sun, Camera, Cloud, Sliders, Ratio, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, pollPrediction, trackPendingPrediction, uploadPost } from "../../lib/api";
import { hasStudioCredits, useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import { computeArtisticEffectSurcharge } from "../../lib/creditPricing";
import { toast } from "sonner";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import ArtisticStyleCard from "../../components/artistic/ArtisticStyleCard";
import ArtisticEffectOption from "../../components/artistic/ArtisticEffectOption";
import DraggableRecipeBubble from "../../components/artistic/DraggableRecipeBubble";
import ArtisticCategoryRail from "../../components/artistic/ArtisticCategoryRail";
import CompactImagePicker from "../../components/studio/CompactImagePicker";
import GenerationBubble from "../../components/studio/GenerationBubble";
import SettingCard from "../../components/studio/SettingCard";
import SettingModal from "../../components/studio/SettingModal";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import AspectPicker from "../../components/AspectPicker";
import { appendStudioPhotos, primaryStudioPhoto } from "../../lib/studioFormData";
import { localizeArtisticCatalog } from "../../lib/artisticStudioLocales";
import { canAccessNsfwArtisticStyles } from "../../lib/artisticStudioData";
import { isArtisticExperimentalStyle } from "../../lib/artisticLabStyles";
import {
  buildArtisticStudioPrompt,
  buildRecipeChips,
  EMPTY_EFFECTS,
  getStyleById,
} from "../../lib/buildArtisticStudioPrompt";
import useTitle from "../../lib/useTitle";
import { useStudioI18n } from "../../lib/useStudioI18n";
import { useStudioSessionBack } from "../../lib/useStudioSessionBack";
import { usePhotoAspectDefault, ASPECT_MATCH } from "../../lib/usePhotoAspectDefault";

const SECTION_ICONS = {
  light: Sun,
  lens: Camera,
  cloud: Cloud,
  palette: Palette,
  brush: Palette,
  frame: Sparkles,
};

function countActiveEffects(effects, sections) {
  let n = 0;
  for (const section of sections) {
    if (section.type === "radio") {
      if (effects[section.id]) n += 1;
    } else {
      const box = effects[section.id] || {};
      n += Object.values(box).filter(Boolean).length;
    }
  }
  return n;
}

export default function Artistic() {
  const { lang, t } = useI18n();
  const { errToast, clearUploadToast } = useStudioI18n();
  useTitle(t("art_page_title"));
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const { costs, region } = usePricing();

  const [styleCat, setStyleCat] = useState("photography");
  const [styleId, setStyleId] = useState(null);
  const [effects, setEffects] = useState(EMPTY_EFFECTS);
  const cost = useMemo(
    () => costs.artistic + computeArtisticEffectSurcharge(effects, region),
    [costs.artistic, effects, region],
  );
  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [aspect, setAspect] = usePhotoAspectDefault(photos, "3:4", "3:4");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  useStudioSessionBack("/app/tools");

  const includeNsfw = useMemo(() => canAccessNsfwArtisticStyles(user), [user]);

  const catalog = useMemo(
    () => localizeArtisticCatalog(lang, { includeNsfw }),
    [lang, includeNsfw],
  );

  useEffect(() => {
    const catIds = catalog.categories.map((c) => c.id);
    if (!catIds.includes(styleCat) && catIds.length) {
      setStyleCat(catIds[0]);
    }
  }, [catalog.categories, styleCat]);

  const stylesInCat = useMemo(
    () => catalog.styles.filter((s) => s.cat === styleCat),
    [catalog.styles, styleCat],
  );

  const isLabStyle = useMemo(
    () => isArtisticExperimentalStyle(styleId),
    [styleId],
  );

  const recipeChips = useMemo(
    () => buildRecipeChips({ styleId, effects }),
    [styleId, effects],
  );

  const effectCount = useMemo(
    () => countActiveEffects(effects, catalog.sections),
    [effects, catalog.sections],
  );

  const setRadioEffect = (sectionId, optionId) => {
    setEffects((prev) => ({ ...prev, [sectionId]: optionId }));
  };

  const toggleCheckboxEffect = (sectionId, optionId) => {
    setEffects((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [optionId]: !prev[sectionId]?.[optionId] },
    }));
  };

  const selectStyle = useCallback((id) => {
    setStyleId(id);
    const picked = catalog.styles.find((s) => s.id === id);
    if (picked?.cat) setStyleCat(picked.cat);
    closeModal();
  }, [catalog.styles]);

  const clearAll = () => {
    setStyleId(null);
    setEffects(EMPTY_EFFECTS);
    toast.message(t("art_recipe_cleared"));
  };

  const generateReady = Boolean(photo) && Boolean(styleId);

  const { ready: gateReady, hint: gateHint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    readyOverride: generateReady,
    hintOverride: !photo
      ? t("art_err_image_mode")
      : !styleId
        ? t("art_flow_step_style_hint")
        : null,
  });

  const generate = useCallback(async () => {
    if (!styleId) {
      toast.error(t("art_flow_step_style_hint"));
      return;
    }
    if (!photo) {
      toast.error(t("art_err_image_mode"));
      return;
    }
    if (isLabStyle && !photo) {
      toast.error(t("art_lab_need_photo"));
      return;
    }
    if (!hasStudioCredits(user, cost)) {
      toast.error(t("common_need_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    clearUploadToast();
    setBusy(true);
    setResult(null);
    const pollOpts = {
      credits_spent: cost,
      type: "artistic",
      timeoutMs: 240_000,
    };
    const skipPollHeaders = { "X-Skip-Auto-Poll": "1" };
    try {
      const finalPrompt = buildArtisticStudioPrompt({
        userPrompt: "",
        styleId,
        effects,
        imageMode: true,
      });

      const fd = new FormData();
      appendStudioPhotos(fd, photos);
      fd.append("prompt_final", finalPrompt);
      fd.append("aspect_ratio", apiAspectRatio(aspect, {
        model: "artistic",
        hasPhoto: aspect === "match" || aspect === ASPECT_MATCH,
      }));
      fd.append("style_id", styleId || "");
      fd.append("style_cat", styleCat || "");
      fd.append("effects_json", JSON.stringify(effects));
      fd.append("lang", lang || "en");
      const { data: submitData } = await uploadPost("/generate/artistic-studio", fd, {
        timeout: 120_000,
        pollTimeoutMs: 240_000,
        headers: skipPollHeaders,
      });

      if (!submitData?.prediction_id) {
        throw new Error(t("common_no_result"));
      }

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || cost,
        type: "artistic",
      });
      const data = await pollPrediction(submitData.prediction_id, {
        ...pollOpts,
        credits_spent: submitData.credits_spent || cost,
      });

      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) {
        throw new Error(t("common_no_result"));
      }
      setResult(creation);
      toast.success(t("common_generated", { n: creation.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  }, [
    styleId,
    styleCat,
    isLabStyle,
    photo,
    photos,
    user,
    cost,
    lang,
    effects,
    aspect,
    refresh,
    t,
    errToast,
    clearUploadToast,
  ]);

  const aspectLabel = (aspect === "match" || aspect === ASPECT_MATCH)
    ? (t("aspect_original") || t("aspect_match") || "Original")
    : String(aspect || "3:4").toUpperCase();
  const styleLabel = getStyleById(styleId)?.label || t("studio_styles_optional");
  const effectsLabel = effectCount > 0
    ? `${effectCount} ${t("art_sec_effects").toLowerCase()}`
    : (t("studio_styles_optional"));

  const modalTitle = {
    format: t("studio_acc_format"),
    style: t("art_sec_style"),
    effects: t("art_sec_effects"),
  }[openKey] || "";

  const styleGallery = (
    <>
      <ArtisticCategoryRail
        categories={catalog.categories}
        styles={catalog.styles}
        activeId={styleCat}
        onSelect={setStyleCat}
      />
      <p className="text-[#9CA3AF] text-[10px] font-mono uppercase tracking-[0.14em] mb-3">
        {catalog.categories.find((c) => c.id === styleCat)?.label}
      </p>
      <div className="art-studio-styles-grid max-h-[46vh] overflow-y-auto overscroll-contain pr-0.5">
        {stylesInCat.map((s) => (
          <ArtisticStyleCard key={s.id} style={s} selected={styleId === s.id} onSelect={selectStyle} />
        ))}
      </div>
    </>
  );

  const effectsPanel = (
    <div className="space-y-6 max-h-[52vh] overflow-y-auto overscroll-contain pr-0.5">
      {catalog.sections.map((section) => {
        const SecIcon = SECTION_ICONS[section.icon] || Sparkles;
        return (
          <div key={section.id}>
            <p className="text-[#9CA3AF] text-[10px] font-mono uppercase tracking-[0.16em] mb-2.5 flex items-center gap-1.5">
              <SecIcon className="w-3.5 h-3.5 text-[#67e8f9]" /> {section.title}
            </p>
            <div className="space-y-1">
              {section.options.map((opt) => {
                const active =
                  section.type === "radio"
                    ? effects[section.id] === opt.id
                    : Boolean(effects[section.id]?.[opt.id]);
                return (
                  <ArtisticEffectOption
                    key={opt.id}
                    section={section}
                    opt={opt}
                    active={active}
                    onToggle={() => {
                      if (section.type === "radio") setRadioEffect(section.id, opt.id);
                      else toggleCheckboxEffect(section.id, opt.id);
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <StudioCompactShell testId="artistic-studio-page" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        eyebrow={t("art_brand")}
        title={t("art_hero_title")}
        description={t("art_hero_subtitle")}
        testId="artistic-header"
        helpKey="help_page_artistic"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("art_photo_desc")}
          </p>
          <CompactImagePicker value={photos} onChange={setPhotos} maxFiles={5} testId="art-photo" />
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Ratio}
            label={t("studio_acc_format")}
            value={aspectLabel}
            onOpen={() => openModal("format")}
            testId="art-card-format"
            helpKey="help_sec_format"
          />
          <SettingCard
            icon={Palette}
            label={t("art_sec_style")}
            value={styleLabel}
            onOpen={() => openModal("style")}
            testId="art-card-style"
            helpKey="help_sec_art_style"
          />
        </div>
        <SettingCard
          icon={Sliders}
          label={t("art_sec_effects")}
          value={effectsLabel}
          onOpen={() => openModal("effects")}
          testId="art-card-effects"
          helpKey="help_sec_art_effects"
        />

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={gateReady}
              busy={busy}
              onClick={generate}
              label={t("art_generate_credits", { n: cost })}
              busyLabel={t("studio_sending")}
              hint={gateHint}
              cost={cost}
              testId="artistic-generate-button"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "format"} title={modalTitle} onClose={closeModal}>
        <AspectPicker value={aspect} onChange={setAspect} hasPhoto={!!photo} testIdPrefix="art-aspect" />
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="art-format-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "style"} title={modalTitle} onClose={closeModal}>
        <p className="text-[#6B7280] text-[10px] mb-3">
          {t("art_styles_count", { n: catalog.styles.length })}
        </p>
        {styleGallery}
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="art-style-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "effects"} title={modalTitle} onClose={closeModal}>
        {effectsPanel}
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="art-effects-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
      <DraggableRecipeBubble chips={recipeChips} onClearAll={clearAll} />
    </StudioCompactShell>
  );
}
