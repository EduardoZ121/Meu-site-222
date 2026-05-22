import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Palette, Sun, Camera, Cloud, Sliders } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api, formatApiError, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import CreationResultMedia from "../../components/CreationResultMedia";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import { toast } from "sonner";
import { apiAspectRatio } from "../../lib/apiAspectRatio";
import ArtisticStyleCard from "../../components/artistic/ArtisticStyleCard";
import ArtisticLabStyleCard from "../../components/artistic/ArtisticLabStyleCard";
import ArtisticEffectOption from "../../components/artistic/ArtisticEffectOption";
import DraggableRecipeBubble from "../../components/artistic/DraggableRecipeBubble";
import ArtisticStudioHeader from "../../components/artistic/ArtisticStudioHeader";
import ArtisticStudioTabs from "../../components/artistic/ArtisticStudioTabs";
import ArtisticCategorySidebar from "../../components/artistic/ArtisticCategorySidebar";
import ArtisticPanelShell from "../../components/artistic/ArtisticPanelShell";
import ArtisticPromptStudio from "../../components/artistic/ArtisticPromptStudio";
import ArtisticResultStudio from "../../components/artistic/ArtisticResultStudio";
import { pushArtisticPromptHistory } from "../../lib/artisticPromptHistory";
import { localizeArtisticCatalog } from "../../lib/artisticStudioLocales";
import { canAccessNsfwArtisticStyles } from "../../lib/artisticStudioData";
import { isArtisticExperimentalStyle } from "../../lib/artisticLabStyles";
import { ARTISTIC_LAB_MODEL_LABEL } from "../../lib/artisticStudioEngines";
import {
  buildArtisticStudioPrompt,
  buildRecipeChips,
  EMPTY_EFFECTS,
  getStyleById,
} from "../../lib/buildArtisticStudioPrompt";
import useTitle from "../../lib/useTitle";

const SECTION_ICONS = {
  light: Sun,
  lens: Camera,
  cloud: Cloud,
  palette: Palette,
};

export default function Artistic() {
  const { lang, t } = useI18n();
  const errMsg = useCallback((err) => formatApiError(err, t("common_fail")), [t]);
  useTitle(t("art_page_title"));
  const [searchParams] = useSearchParams();
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const cost = costs.artistic;

  const [styleCat, setStyleCat] = useState("photography");
  const [styleId, setStyleId] = useState(null);
  const [effects, setEffects] = useState(EMPTY_EFFECTS);
  const [inputMode, setInputMode] = useState("text");
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [improve, setImprove] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [aspect, setAspect] = useState("3:4");
  const [busy, setBusy] = useState(false);
  const [improving, setImproving] = useState(false);
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null);
  const [mobileTab, setMobileTab] = useState("style");

  useEffect(() => {
    const q = searchParams.get("prompt");
    if (q) setPrompt(q);
  }, [searchParams]);

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

  const isLabCategory = styleCat === "nsfw";
  const labPresets = useMemo(
    () => stylesInCat.filter((s) => s.labPreset),
    [stylesInCat],
  );
  const classicExperimental = useMemo(
    () => stylesInCat.filter((s) => !s.labPreset),
    [stylesInCat],
  );
  const labLightStyles = useMemo(
    () => classicExperimental.filter((s) => s.tier !== "heavy"),
    [classicExperimental],
  );
  const labHeavyStyles = useMemo(
    () => classicExperimental.filter((s) => s.tier === "heavy"),
    [classicExperimental],
  );

  const isLabStyle = useMemo(
    () => isArtisticExperimentalStyle(styleId),
    [styleId],
  );

  const recipeChips = useMemo(
    () => buildRecipeChips({ styleId, effects }),
    [styleId, effects],
  );

  const promptFinal = useMemo(
    () => buildArtisticStudioPrompt({
      userPrompt: prompt,
      styleId,
      effects,
      imageMode: inputMode === "image",
    }),
    [prompt, styleId, effects, inputMode],
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

  const selectStyle = useCallback(
    (id) => {
      setStyleId(id);
      const picked = catalog.styles.find((s) => s.id === id);
      if (picked?.cat === "nsfw" && inputMode !== "image") {
        setInputMode("image");
        toast.message(t("art_lab_image_hint"));
      }
    },
    [catalog.styles, inputMode, t],
  );

  const clearAll = () => {
    setStyleId(null);
    setEffects(EMPTY_EFFECTS);
    setPrompt("");
    toast.message(t("art_recipe_cleared"));
  };

  const generate = useCallback(async () => {
    if (!styleId && prompt.trim().length < 3) {
      toast.error(t("studio_err_text"));
      return;
    }
    if (inputMode === "image" && !photo) {
      toast.error(t("art_err_image_mode"));
      return;
    }
    if (isLabStyle && !photo) {
      toast.error(t("art_lab_need_photo"));
      return;
    }
    if ((user?.credits ?? 0) < cost) {
      toast.error(t("common_need_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      let userPrompt = prompt.trim();
      if (improve && userPrompt.length >= 3) {
        const pickedStyle = getStyleById(styleId);
        try {
          const { data: imp } = await api.post("/prompt/improve", {
            prompt: userPrompt,
            lang: lang || "en",
            tool: "artistic",
            style_id: styleId || "",
            style_label: pickedStyle?.label || "",
            style_suffix: pickedStyle?.suffix || "",
            image_mode: inputMode === "image",
          });
          if (imp?.prompt && imp.prompt.trim().length >= 3) {
            userPrompt = imp.prompt.trim();
            setPrompt(userPrompt);
            if (imp.enhanced) {
              toast.success(t("art_prompt_refined"));
            } else {
              toast.message(t("art_refine_unchanged"));
            }
          }
        } catch (impErr) {
          const detail = impErr?.response?.data?.detail;
          toast.error(detail || t("art_refine_unavailable"));
        }
      }

      const finalPrompt = buildArtisticStudioPrompt({
        userPrompt,
        styleId,
        effects,
        imageMode: inputMode === "image",
      });

      let data;
      if (inputMode === "image" && photo) {
        const fd = new FormData();
        fd.append("photo", photo);
        fd.append("prompt_final", finalPrompt);
        fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "artistic", hasPhoto: true }));
        fd.append("style_id", styleId || "");
        ({ data } = await uploadPost("/generate/artistic-studio", fd, { timeout: 240000 }));
      } else {
        ({ data } = await api.post("/generate/artistic-studio", {
          prompt_final: finalPrompt,
          aspect_ratio: apiAspectRatio(aspect, { model: "artistic", hasPhoto: false }),
          style_id: styleId || "",
        }));
      }

      const creation = normalizeCreation(data?.creation || data);
      if (!primaryResultUrl(creation)) {
        throw new Error(t("common_no_result"));
      }
      setResult(creation);
      if (userPrompt.length >= 3) pushArtisticPromptHistory(userPrompt);
      setMeta({
        style: getStyleById(styleId)?.label,
        chips: recipeChips,
        seed: creation.id?.slice?.(0, 8),
        lastPrompt: userPrompt,
      });
      toast.success(t("common_generated", { n: creation.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally {
      setBusy(false);
    }
  }, [
    styleId,
    isLabStyle,
    prompt,
    inputMode,
    photo,
    user,
    cost,
    improve,
    lang,
    effects,
    aspect,
    recipeChips,
    refresh,
    t,
    errMsg,
  ]);

  const downloadUrl = primaryResultUrl(result);

  const improvePromptOnly = useCallback(async () => {
    const userPrompt = prompt.trim();
    if (userPrompt.length < 3) {
      toast.error(t("studio_err_text"));
      return;
    }
    setImproving(true);
    try {
      const pickedStyle = getStyleById(styleId);
      const { data: imp } = await api.post("/prompt/improve", {
        prompt: userPrompt,
        lang: lang || "en",
        tool: "artistic",
        style_id: styleId || "",
        style_label: pickedStyle?.label || "",
        style_suffix: pickedStyle?.suffix || "",
        image_mode: inputMode === "image",
      });
      if (imp?.prompt && imp.prompt.trim().length >= 3) {
        setPrompt(imp.prompt.trim().slice(0, 800));
        toast.success(imp.enhanced ? t("art_prompt_refined") : t("art_refine_unchanged"));
      }
    } catch (impErr) {
      toast.error(impErr?.response?.data?.detail || t("art_refine_unavailable"));
    } finally {
      setImproving(false);
    }
  }, [prompt, styleId, inputMode, lang, t]);

  const panelVisibility = (tab) =>
    mobileTab !== tab ? "hidden lg:block" : "";

  const styleGallery = (
    <div className="art-style-layout min-h-0 flex-1">
      <ArtisticCategorySidebar
        categories={catalog.categories}
        styles={catalog.styles}
        activeId={styleCat}
        onSelect={setStyleCat}
      />
      <div className="art-style-layout__main min-w-0 flex flex-col">
        <p className="text-[#9CA3AF] text-[10px] font-mono uppercase tracking-[0.14em] mb-2 px-0.5">
          {catalog.categories.find((c) => c.id === styleCat)?.label}
          {includeNsfw ? ` · ${t("art_nsfw_admin_badge")}` : ""}
        </p>
      {isLabCategory && includeNsfw ? (
        <div className="art-lab-panel mb-4 rounded-xl border border-[rgba(236,72,153,0.25)] bg-gradient-to-br from-[#1a0a1f]/80 via-[#111118] to-[#0a0a0f] p-3 md:p-4 max-h-[min(calc(100dvh-12rem),720px)] overflow-y-auto overflow-x-hidden">
          <p className="text-[#f0abfc] text-[11px] font-semibold mb-1">{t("art_lab_title")}</p>
          <p className="text-[#6B7280] text-[9px] font-mono uppercase tracking-wider mb-1">
            {t("art_lab_engine_note", { model: ARTISTIC_LAB_MODEL_LABEL })}
          </p>
          <p className="text-[#9CA3AF] text-[10px] leading-snug mb-3">{t("art_lab_desc")}</p>
          <div className="art-lab-scroll flex gap-2.5 overflow-x-auto pb-2 w-full min-w-0 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-2 md:gap-2.5 md:overflow-visible md:pb-0 lg:grid-cols-2">
            {labPresets.map((s) => (
              <div key={s.id} className="snap-start shrink-0 w-[min(72vw,220px)] md:w-auto md:shrink">
                <ArtisticLabStyleCard style={s} selected={styleId === s.id} onSelect={selectStyle} />
              </div>
            ))}
          </div>
          {labLightStyles.length > 0 && (
            <>
              <p className="text-[#6B7280] text-[9px] font-mono uppercase tracking-[0.16em] mt-4 mb-2">
                {t("art_lab_light_row")}
              </p>
              <div className="art-studio-styles-grid !max-h-none">
                {labLightStyles.map((s) => (
                  <ArtisticStyleCard key={s.id} style={s} selected={styleId === s.id} onSelect={selectStyle} />
                ))}
              </div>
            </>
          )}
          {labHeavyStyles.length > 0 && (
            <>
              <p className="text-[#6B7280] text-[9px] font-mono uppercase tracking-[0.16em] mt-4 mb-2">
                {t("art_lab_heavy_row")}
              </p>
              <div className="art-studio-styles-grid !max-h-none">
                {labHeavyStyles.map((s) => (
                  <ArtisticStyleCard key={s.id} style={s} selected={styleId === s.id} onSelect={selectStyle} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="art-studio-styles-grid art-studio-styles-grid--wide">
          {stylesInCat.map((s) => (
            <ArtisticStyleCard key={s.id} style={s} selected={styleId === s.id} onSelect={selectStyle} />
          ))}
        </div>
      )}
      </div>
    </div>
  );

  return (
    <div
      className="rp-artistic-page art-studio-page w-full min-w-0 max-w-full mx-auto px-2 sm:px-4 pb-10 md:pb-12"
      data-testid="artistic-studio-page"
    >
      <ArtisticStudioHeader />

      <ArtisticStudioTabs value={mobileTab} onChange={setMobileTab} className="mb-5" />

      <div className="art-studio-workspace">
        <ArtisticPanelShell
          title={t("art_sec_style")}
          icon={Palette}
          className={panelVisibility("style")}
          bodyClassName="!p-0 flex flex-col min-h-[min(72vh,720px)] lg:min-h-[calc(100vh-220px)]"
          testId="artistic-module-style"
        >
          <p className="text-[#6B7280] text-[10px] px-4 pt-3 pb-2 border-b border-[rgba(255,255,255,0.04)]">
            {t("art_styles_count", { n: catalog.styles.length })}
          </p>
          <div className="flex-1 min-h-0 p-3 overflow-hidden">{styleGallery}</div>
        </ArtisticPanelShell>

        <ArtisticPanelShell
          title={t("art_sec_effects")}
          icon={Sliders}
          accent="cyan"
          className={panelVisibility("effects")}
          bodyClassName="overflow-y-auto max-h-[min(72vh,720px)] lg:max-h-[calc(100vh-220px)]"
          testId="artistic-module-effects"
        >
          <div className="space-y-5">
            {catalog.sections.map((section) => {
              const SecIcon = SECTION_ICONS[section.icon] || Sparkles;
              return (
                <div key={section.id} className="art-effect-group">
                  <p className="art-effect-group__title">
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
        </ArtisticPanelShell>

        <ArtisticPanelShell
          title={t("art_sec_generate")}
          icon={Sparkles}
          className={`${panelVisibility("generate")} art-panel--prompt`}
          bodyClassName="flex flex-col gap-4 min-h-[min(72vh,720px)] lg:min-h-[calc(100vh-220px)]"
          testId="artistic-module-prompt"
        >
          <ArtisticResultStudio
            variant="hero"
            busy={busy}
            downloadUrl={downloadUrl}
            result={result}
            meta={meta}
            recipeChips={recipeChips}
            onVary={generate}
            onRefine={() => {
              setPrompt((p) => `${p}${p ? " " : ""}refine details, higher quality`);
              toast.message(t("art_refine_toast"));
            }}
            onReusePrompt={() => {
              if (meta?.lastPrompt) setPrompt(meta.lastPrompt);
              else toast.message(t("art_result_reuse"));
            }}
          />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ArtisticPromptStudio
              inputMode={inputMode}
              setInputMode={setInputMode}
              isLabStyle={isLabStyle}
              photo={photo}
              setPhoto={setPhoto}
              prompt={prompt}
              setPrompt={setPrompt}
              aspect={aspect}
              setAspect={setAspect}
              improve={improve}
              setImprove={setImprove}
              busy={busy}
              cost={cost}
              onGenerate={generate}
              onImprovePrompt={improvePromptOnly}
              improving={improving}
              compact
            />
          </div>
        </ArtisticPanelShell>
      </div>

      <DraggableRecipeBubble chips={recipeChips} onClearAll={clearAll} />
    </div>
  );
}

