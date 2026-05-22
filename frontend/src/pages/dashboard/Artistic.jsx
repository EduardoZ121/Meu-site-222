import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Sparkles,
  Palette,
  Sun,
  Camera,
  Cloud,
  RotateCcw,
  Shuffle,
  Sliders,
  Type,
  ImageIcon,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api, formatApiError, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import CreationResultMedia from "../../components/CreationResultMedia";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import { toast } from "sonner";
import ImageUploadZone from "../../components/ImageUploadZone";
import AspectPicker from "../../components/AspectPicker";
import ArtisticStyleCard from "../../components/artistic/ArtisticStyleCard";
import ArtisticLabStyleCard from "../../components/artistic/ArtisticLabStyleCard";
import ArtisticEffectOption from "../../components/artistic/ArtisticEffectOption";
import DraggableRecipeBubble from "../../components/artistic/DraggableRecipeBubble";
import { localizeArtisticCatalog, countStylesInCategory } from "../../lib/artisticStudioLocales";
import { canAccessNsfwArtisticStyles } from "../../lib/artisticStudioData";
import { isArtisticLabStyle } from "../../lib/artisticLabStyles";
import {
  buildArtisticStudioPrompt,
  buildRecipeChips,
  EMPTY_EFFECTS,
  getStyleById,
} from "../../lib/buildArtisticStudioPrompt";
import useTitle from "../../lib/useTitle";
import PromptAssistBar from "../../components/promptAssist/PromptAssistBar";
import WizardPromptModal from "../../components/promptAssist/WizardPromptModal";
import SuggestPromptModal from "../../components/promptAssist/SuggestPromptModal";

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
      if (picked?.labPreset && inputMode !== "image") {
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
    if (isArtisticLabStyle(styleId) && !photo) {
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
        try {
          const { data: imp } = await api.post("/prompt/improve", {
            prompt: userPrompt,
            lang: lang || "en",
          });
          if (imp?.prompt) {
            userPrompt = imp.prompt;
            setPrompt(imp.prompt);
            toast.message(t("art_prompt_refined"));
          }
        } catch {
          toast.info(t("art_refine_unavailable"));
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
        fd.append("aspect_ratio", aspect);
        fd.append("style_id", styleId || "");
        ({ data } = await uploadPost("/generate/artistic-studio", fd, { timeout: 240000 }));
      } else {
        ({ data } = await api.post("/generate/artistic-studio", {
          prompt_final: finalPrompt,
          aspect_ratio: aspect,
          style_id: styleId || "",
        }));
      }

      const creation = normalizeCreation(data?.creation || data);
      if (!primaryResultUrl(creation)) {
        throw new Error(t("common_no_result"));
      }
      setResult(creation);
      setMeta({
        style: getStyleById(styleId)?.label,
        chips: recipeChips,
        seed: creation.id?.slice?.(0, 8),
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

  return (
    <div
      className="rp-artistic-page w-full min-w-0 max-w-full mx-auto pb-6 md:pb-12 md:max-w-[1600px] bg-[#0A0A0F]"
      data-testid="artistic-studio-page"
    >
      {/* Hero — só desktop; no mobile o título está no StudioTopBar */}
      <header className="hidden md:block mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#9333EA]/20 border border-[rgba(147,51,234,0.35)] flex items-center justify-center">
            <Palette className="w-5 h-5 text-[#A855F7]" />
          </div>
          <p className="text-[#A855F7] text-[10px] font-mono uppercase tracking-[0.22em]">
            {t("art_brand")}
          </p>
        </div>
        <h2 className="text-white text-[28px] md:text-[36px] font-light tracking-tight font-['Inter_Tight']">
          {t("art_title")}
        </h2>
        <p className="text-[#9CA3AF] text-[14px] mt-2 max-w-2xl">
          {t("art_subtitle")}
        </p>
      </header>

      <p className="md:hidden text-[#9CA3AF] text-[12px] leading-snug mb-3 px-0.5">
        {t("art_subtitle")}
      </p>

      {/* Mobile tabs */}
      <div
        className="flex lg:hidden gap-1 mb-3 p-1 rounded-xl bg-[#111118] border border-[rgba(147,51,234,0.2)] w-full min-w-0"
        role="tablist"
      >
        {[
          { id: "style", label: t("art_tab_style") },
          { id: "effects", label: t("art_tab_effects") },
          { id: "generate", label: t("art_tab_prompt") },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMobileTab(t.id)}
            className={`flex-1 py-2 text-[11px] font-medium rounded-md transition-colors ${
              mobileTab === t.id ? "bg-[#9333EA] text-white" : "text-[#9CA3AF]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5 w-full min-w-0">
        {/* COL 1 — Estilos */}
        <section
          className={`w-full min-w-0 rounded-xl md:rounded-2xl border border-[rgba(147,51,234,0.2)] bg-[#111118] p-3 md:p-4 ${
            mobileTab !== "style" ? "hidden lg:block" : ""
          }`}
        >
          <h2 className="text-white text-[13px] font-semibold mb-1 flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#A855F7]" /> {t("art_sec_style")}
          </h2>
          <p className="text-[#6B7280] text-[10px] mb-3">
            {t("art_styles_count", { n: catalog.styles.length })}
            {includeNsfw ? ` · ${t("art_nsfw_admin_badge")}` : ""}
          </p>
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 w-full min-w-0 scrollbar-thin [-webkit-overflow-scrolling:touch]">
            {catalog.categories.map((c) => {
              const n = countStylesInCategory(catalog.styles, c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setStyleCat(c.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-[10px] font-medium transition-all border ${
                    styleCat === c.id
                      ? "bg-[#9333EA] text-white border-[#A855F7] shadow-[0_0_12px_rgba(147,51,234,0.35)]"
                      : "bg-[#0A0A0F] text-[#9CA3AF] border-[rgba(147,51,234,0.15)] hover:text-white hover:border-[rgba(147,51,234,0.35)]"
                  } ${c.adminOnly ? "ring-1 ring-[#be185d]/40" : ""}`}
                  data-testid={`art-cat-${c.id}`}
                >
                  <span className="block leading-tight">{c.label}</span>
                  <span className={`block text-[9px] mt-0.5 ${styleCat === c.id ? "text-white/70" : "text-[#6B7280]"}`}>
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[#9CA3AF] text-[10px] font-mono uppercase tracking-[0.14em] mb-2">
            {catalog.categories.find((c) => c.id === styleCat)?.label}
          </p>

          {isLabCategory && includeNsfw && (
            <div className="art-lab-panel mb-4 rounded-xl border border-[rgba(236,72,153,0.25)] bg-gradient-to-br from-[#1a0a1f]/80 via-[#111118] to-[#0a0a0f] p-3 md:p-4 max-h-[min(calc(100dvh-12rem),720px)] overflow-y-auto overflow-x-hidden">
              <p className="text-[#f0abfc] text-[11px] font-semibold mb-1">{t("art_lab_title")}</p>
              <p className="text-[#6B7280] text-[9px] font-mono uppercase tracking-wider mb-1">{t("art_lab_engine_note")}</p>
              <p className="text-[#9CA3AF] text-[10px] leading-snug mb-3">{t("art_lab_desc")}</p>
              <div className="art-lab-scroll flex gap-2.5 overflow-x-auto pb-2 w-full min-w-0 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-2 md:gap-2.5 md:overflow-visible md:pb-0 lg:grid-cols-2">
                {labPresets.map((s) => (
                  <div key={s.id} className="snap-start shrink-0 w-[min(72vw,200px)] md:w-auto md:shrink">
                    <ArtisticLabStyleCard
                      style={s}
                      selected={styleId === s.id}
                      onSelect={selectStyle}
                    />
                  </div>
                ))}
              </div>
              {classicExperimental.length > 0 && (
                <>
                  <p className="text-[#6B7280] text-[9px] font-mono uppercase tracking-[0.16em] mt-4 mb-2">
                    {t("art_lab_classic_row")}
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full min-w-0">
                    {classicExperimental.map((s) => (
                      <ArtisticStyleCard
                        key={s.id}
                        style={s}
                        selected={styleId === s.id}
                        onSelect={selectStyle}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {!isLabCategory && (
            <div className="grid grid-cols-2 gap-2 w-full min-w-0 max-h-[min(calc(100dvh-14rem),640px)] lg:max-h-[min(70vh,640px)] overflow-y-auto overflow-x-hidden pr-0.5">
              {stylesInCat.map((s) => (
                <ArtisticStyleCard
                  key={s.id}
                  style={s}
                  selected={styleId === s.id}
                  onSelect={selectStyle}
                />
              ))}
            </div>
          )}

        </section>

        {/* COL 2 — Efeitos */}
        <section
          className={`w-full min-w-0 rounded-xl md:rounded-2xl border border-[rgba(147,51,234,0.2)] bg-[#111118] p-3 md:p-4 max-h-[min(calc(100dvh-14rem),800px)] lg:max-h-[min(85vh,800px)] overflow-y-auto overflow-x-hidden ${
            mobileTab !== "effects" ? "hidden lg:block" : ""
          }`}
        >
          <h2 className="text-white text-[13px] font-semibold mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#06B6D4]" /> {t("art_sec_effects")}
          </h2>
          <div className="space-y-6">
            {catalog.sections.map((section) => {
              const SecIcon = SECTION_ICONS[section.icon] || Sparkles;
              return (
                <div key={section.id}>
                  <p className="text-[#9CA3AF] text-[10px] font-mono uppercase tracking-[0.16em] mb-2 flex items-center gap-1.5">
                    <SecIcon className="w-3 h-3 text-[#06B6D4]" /> {section.title}
                  </p>
                  <div className="space-y-1.5">
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
        </section>

        {/* COL 3 — Geração */}
        <section
          className={`w-full min-w-0 rounded-xl md:rounded-2xl border border-[rgba(147,51,234,0.2)] bg-[#111118] p-3 md:p-4 flex flex-col overflow-x-hidden ${
            mobileTab !== "generate" ? "hidden lg:block" : ""
          }`}
        >
          <h2 className="text-white text-[13px] font-semibold mb-4">{t("art_sec_generate")}</h2>

          <div className="inline-flex rounded-lg border border-[#2E2E30] p-0.5 bg-[#0A0A0F] mb-4 w-full">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-colors ${
                inputMode === "text" ? "bg-[#9333EA] text-white" : "text-[#9CA3AF]"
              }`}
            >
              <Type className="w-3.5 h-3.5" /> {t("art_input_text")}
            </button>
            <button
              type="button"
              onClick={() => setInputMode("image")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-colors ${
                inputMode === "image" ? "bg-[#9333EA] text-white" : "text-[#9CA3AF]"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> {t("art_input_image")}
            </button>
          </div>

          {inputMode === "image" && (
            <div className="mb-4">
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

          <label className="block text-[#9CA3AF] text-[10px] font-mono uppercase tracking-wider mb-1.5">
            {inputMode === "image" ? t("art_prompt_label_image") : t("art_prompt_label")}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
            rows={inputMode === "text" ? 5 : 3}
            maxLength={800}
            placeholder={
              inputMode === "text"
                ? t("art_prompt_ph_text")
                : t("art_prompt_ph_image")
            }
            className="w-full bg-[#0A0A0F] border border-[rgba(147,51,234,0.25)] focus:border-[#9333EA] rounded-xl text-white text-[13px] placeholder:text-[#6B7280] px-3 py-3 resize-y min-h-[100px] focus:outline-none focus:ring-1 focus:ring-[#9333EA]/40"
            data-testid="artistic-studio-prompt"
          />

          <PromptAssistBar
            improve={improve}
            onImproveChange={setImprove}
            onOpenWizard={() => setWizardOpen(true)}
            onOpenSuggest={() => setSuggestOpen(true)}
            promptLength={prompt.length}
            maxLength={800}
            testIdPrefix="artistic-prompt-assist"
          />

          <WizardPromptModal
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onApply={setPrompt}
          />
          <SuggestPromptModal
            open={suggestOpen}
            onOpenChange={setSuggestOpen}
            onApply={setPrompt}
          />

          <p className="text-[#9CA3AF] text-[10px] font-mono uppercase tracking-wider mb-2 mt-4">{t("art_format_label")}</p>
          <AspectPicker
            value={aspect}
            onChange={setAspect}
            hasPhoto={inputMode === "image" && !!photo}
            options={["1:1", "3:4", "4:5", "9:16", "16:9"]}
            testIdPrefix="art-studio-aspect"
          />

          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="mt-5 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:opacity-50 text-white text-[13px] font-medium shadow-[0_0_24px_rgba(147,51,234,0.35)] hover:shadow-[0_0_32px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-2"
            data-testid="artistic-studio-generate"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t("art_generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {inputMode === "image" ? t("art_edit_credits", { n: cost }) : t("art_generate_credits", { n: cost })}
              </>
            )}
          </button>

          {/* Preview resultado */}
          <StudioResultAnchor
            busy={busy}
            ready={Boolean(downloadUrl)}
            className="mt-6 flex-1"
          >
            <p className="text-[#9CA3AF] text-[10px] font-mono uppercase tracking-wider mb-2">{t("art_result_label")}</p>
            {busy && (
              <div className="aspect-[3/4] rounded-xl bg-[#0A0A0F] border border-[rgba(147,51,234,0.2)] animate-pulse flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#9333EA] animate-spin" />
                <p className="text-[#9CA3AF] text-[12px]">{t("art_applying_recipe")}</p>
                {recipeChips.length > 0 && (
                  <p className="text-[#6B7280] text-[10px] px-4 text-center">
                    {recipeChips.map((c) => c.label).join(" · ")}
                  </p>
                )}
              </div>
            )}
            {!busy && downloadUrl && (
              <div className="rounded-xl overflow-hidden border border-[rgba(147,51,234,0.3)] animate-in fade-in">
                <CreationResultMedia
                  creation={result}
                  className="w-full object-contain max-h-[420px]"
                  containerClassName="min-h-[200px] bg-[#0A0A0F] flex items-center justify-center"
                  testId="artistic-result-image"
                />
                {meta && (
                  <div className="p-3 bg-[#0A0A0F] border-t border-[rgba(147,51,234,0.15)] text-[10px] text-[#9CA3AF] space-y-1">
                    {meta.style && <p>{t("art_meta_style", { style: meta.style })}</p>}
                    {meta.chips?.length > 0 && (
                      <p>{t("art_meta_effects", { effects: meta.chips.map((c) => c.label).join(", ") })}</p>
                    )}
                    {meta.seed && <p className="font-mono">ID: {meta.seed}</p>}
                  </div>
                )}
                <div className="flex gap-2 p-2 bg-[#0A0A0F]">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2 rounded-lg border border-[rgba(147,51,234,0.3)] text-[11px] text-white hover:bg-[#9333EA]/20"
                  >
                    {t("art_download")}
                  </a>
                  <button
                    type="button"
                    onClick={generate}
                    className="flex-1 py-2 rounded-lg border border-[rgba(147,51,234,0.3)] text-[11px] text-white hover:bg-[#9333EA]/20 flex items-center justify-center gap-1"
                  >
                    <Shuffle className="w-3 h-3" /> {t("art_vary")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt((p) => `${p}${p ? " " : ""}refine details, higher quality`);
                      toast.message(t("art_refine_toast"));
                    }}
                    className="flex-1 py-2 rounded-lg border border-[rgba(147,51,234,0.3)] text-[11px] text-white hover:bg-[#9333EA]/20 flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> {t("art_refine_btn")}
                  </button>
                </div>
              </div>
            )}
            {!busy && !downloadUrl && (
              <div className="aspect-[3/4] rounded-xl border border-dashed border-[rgba(147,51,234,0.2)] flex items-center justify-center text-[#6B7280] text-[12px] text-center px-6">
                {t("art_result_empty")}
              </div>
            )}
          </StudioResultAnchor>
        </section>
      </div>

      <DraggableRecipeBubble chips={recipeChips} onClearAll={clearAll} />
    </div>
  );
}

