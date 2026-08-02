import { useMemo, useState } from "react";
import { Shirt, Layers, MessageSquare, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import { getSurcharges } from "../../../lib/creditPricing";
import { improvePromptClient } from "../../../lib/promptEnhance";
import PromptEnhanceToggle from "../../../components/promptAssist/PromptEnhanceToggle";
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
import { useStudioSessionBack } from "../../../lib/useStudioSessionBack";
import { PROMPT_MAX_LENGTH } from "../../../lib/promptLimits";
import useTitle from "../../../lib/useTitle";

const STYLE_PRESETS = [
  { id: "casual", label: "Casual", desc: "white t-shirt, blue jeans, sneakers" },
  { id: "formal", label: "Formal", desc: "elegant black suit, white shirt, leather shoes" },
  { id: "streetwear", label: "Streetwear", desc: "oversized hoodie, baggy cargo pants, high-top sneakers" },
  { id: "luxury", label: "Luxury", desc: "designer outfit, silk shirt, gold accessories, premium look" },
  { id: "sport", label: "Sport", desc: "athletic gym wear, performance fabric, sportswear" },
  { id: "evening", label: "Evening", desc: "elegant evening dress, satin fabric, sophisticated styling" },
  { id: "vintage", label: "Vintage", desc: "70s vintage fashion, retro pattern, classic tailoring" },
  { id: "business", label: "Business", desc: "navy blazer, crisp shirt, tailored trousers" },
];

export default function ClothesChanger() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat, lang } = useI18n();
  const navigate = useNavigate();
  useTitle(tCat("tool_clothes_name"));
  const { refresh, user } = useAuth();
  const { costs, region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);

  const [personPhotos, setPersonPhotos] = useState([]);
  const [garmentPhotos, setGarmentPhotos] = useState([]);
  const photo = primaryStudioPhoto(personPhotos);
  const garment = primaryStudioPhoto(garmentPhotos);
  const [prompt, setPrompt] = useState("");
  const [improve, setImprove] = useState(false);
  const [changeType, setChangeType] = useState("full");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const enhanceCost = surcharges.enhancePrompt ?? 5;
  const cost = costs.clothes + (improve && prompt.trim().length >= 3 ? enhanceCost : 0);

  useStudioSessionBack(() => navigate("/app/tools"));

  const changeTypes = useMemo(
    () => [
      { id: "full", label: t("clothes_change_full"), hint: t("clothes_change_full_hint") },
      { id: "piece", label: t("clothes_change_piece"), hint: t("clothes_change_piece_hint") },
      { id: "color", label: t("clothes_change_color"), hint: t("clothes_change_color_hint") },
    ],
    [t],
  );

  const typeLabel = changeTypes.find((c) => c.id === changeType)?.label || changeType;
  const promptSummary = garment
    ? (t("clothes_garment_label") || "Referência")
    : prompt.trim()
      ? `${prompt.trim().slice(0, 28)}${prompt.trim().length > 28 ? "…" : ""}`
      : (t("studio_styles_optional") || "Opcional");

  const garmentOk = Boolean(garment) || prompt.trim().length >= 3;
  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    readyOverride: Boolean(photo) && garmentOk,
    hintOverride: !photo
      ? null
      : !garmentOk
        ? t("clothes_err_garment")
        : null,
  });

  const run = async () => {
    if (!photo) { toast.error(t("clothes_err_person")); return; }
    if (!garment && prompt.trim().length < 3) {
      toast.error(t("clothes_err_garment"));
      return;
    }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      let finalPrompt = prompt.trim();
      if (improve && finalPrompt.length >= 3) {
        try {
          finalPrompt = await improvePromptClient(finalPrompt, { tool: "clothes", lang });
          setPrompt(finalPrompt.slice(0, PROMPT_MAX_LENGTH));
        } catch (err) {
          toast.error(err?.message || tCat("studio_improve_fail"));
          setBusy(false);
          return;
        }
      }
      if (garment) {
        fd.append("photo", photo);
        fd.append("garment", garment);
        if (finalPrompt) fd.append("prompt", finalPrompt);
        fd.append("change_type", changeType);
      } else {
        const prefixes = {
          full: "Replace all clothing with:",
          piece: "Add/replace this specific clothing piece:",
          color: "Keep the same outfit but change the color/style to:",
        };
        const prefix = prefixes[changeType] || "Change the outfit to:";
        fd.append("photo", photo);
        fd.append("prompt", `${prefix} ${finalPrompt}. Preserve face, body pose and identity. Photorealistic, natural lighting.`);
        fd.append("change_type", changeType);
      }

      const { data } = await uploadPost("/tools/clothes", fd, { timeout: 240000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("clothes_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  };

  const modalTitle = {
    type: t("clothes_section_type"),
    look: garment ? t("clothes_section_prompt") : t("clothes_section_presets"),
  }[openKey] || "";

  return (
    <StudioCompactShell testId="clothes-page" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        title={tCat("tool_clothes_name")}
        description={t("clothes_desc") || t("clothes_changer.description") || tCat("tool_clothes_desc")}
        testId="clothes-header"
        helpKey="help_tool_clothes"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-2">{t("clothes_person_label")}</p>
          <CompactImagePicker
            value={personPhotos}
            onChange={(next) => { setPersonPhotos(next); setResult(null); }}
            maxFiles={1}
            testId="clothes-photo"
          />
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mt-4 mb-2">{t("clothes_garment_label")}</p>
          <CompactImagePicker
            value={garmentPhotos}
            onChange={(next) => { setGarmentPhotos(next); setResult(null); }}
            maxFiles={1}
            testId="clothes-garment"
          />
          <p className="text-[#6B7280] text-[11px] mt-2 leading-relaxed">{t("clothes_garment_helper")}</p>
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Layers}
            label={t("clothes_section_type")}
            value={typeLabel}
            onOpen={() => openModal("type")}
            testId="clothes-card-type"
            helpKey="help_sec_clothes_garment"
          />
          <SettingCard
            icon={MessageSquare}
            label={garment ? t("clothes_section_prompt") : t("clothes_section_presets")}
            value={promptSummary}
            onOpen={() => openModal("look")}
            testId="clothes-card-look"
            helpKey="help_sec_prompt"
          />
        </div>

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={run}
              label={t("clothes_btn", { n: cost })}
              busyLabel={t("clothes_dressing")}
              hint={hint}
              cost={cost}
              testId="clothes-create"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "type"} title={modalTitle} onClose={closeModal}>
        <div className="grid grid-cols-1 gap-2" data-testid="change-types">
          {changeTypes.map((ct) => (
            <button
              type="button"
              key={ct.id}
              onClick={() => setChangeType(ct.id)}
              className={`text-left p-4 border-2 rounded-xl transition-all ${
                changeType === ct.id
                  ? "border-[#7C3AED] bg-[#7C3AED]/10"
                  : "border-[#2E2E30] hover:border-[#7C3AED]/40 bg-[#13131A]"
              }`}
              data-testid={`change-type-${ct.id}`}
            >
              <p className={`text-[14px] font-medium font-['Inter_Tight'] mb-1 ${changeType === ct.id ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>
                {ct.label}
              </p>
              <p className="text-[#8A8A8E] text-[11px]">{ct.hint}</p>
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="clothes-type-confirm">
          <Check className="w-4 h-4" /> {t("confirm") || "Confirmar"}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "look"} title={modalTitle} onClose={closeModal}>
        {!garment && (
          <div className="flex flex-wrap gap-2 mb-4" data-testid="presets">
            {STYLE_PRESETS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPrompt(p.desc)}
                className={`px-3 py-1.5 border text-[12px] font-medium rounded-full transition-all ${
                  prompt === p.desc
                    ? "border-[#7C3AED] text-[#C4B5FD] bg-[#7C3AED]/10"
                    : "border-[#2E2E30] text-[#8A8A8E] hover:border-[#7C3AED] hover:text-[#C4B5FD]"
                }`}
                data-testid={`preset-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="mb-3">
          <PromptEnhanceToggle checked={improve} onChange={setImprove} testId="clothes-enhance" cost={enhanceCost} />
        </div>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={PROMPT_MAX_LENGTH}
            placeholder={t("clothes_prompt_ph")}
            className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3.5 rounded-xl focus:outline-none resize-none transition-colors font-['Inter_Tight']"
            data-testid="clothes-prompt"
          />
          <span className="absolute bottom-3 right-3 text-[#5A5A5E] text-[11px] font-mono">
            {prompt.length}/{PROMPT_MAX_LENGTH}
          </span>
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="clothes-look-confirm">
          <Check className="w-4 h-4" /> {t("confirm") || "Confirmar"}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
