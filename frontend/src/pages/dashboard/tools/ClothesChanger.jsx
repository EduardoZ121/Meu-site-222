import { useMemo, useState } from "react";
import { Sparkles, Shirt } from "lucide-react";
import { toast } from "sonner";
import { uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import ResultPanel from "../../../components/ResultPanel";
import ImageUploadZone from "../../../components/ImageUploadZone";
import CollapsibleSection from "../../../components/CollapsibleSection";
import BrandPageHeader from "../../../components/brand/BrandPageHeader";
import StudioResultAnchor from "../../../components/StudioResultAnchor";
import StudioGenerateBar from "../../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../../components/StudioGenerateCostMeta";
import StudioMobileTabs from "../../../components/studio/StudioMobileTabs";
import { useStudioMobileTabs } from "../../../lib/useStudioMobileTabs";
import useTitle from "../../../lib/useTitle";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";

const PRESET_IDS = ["casual", "formal", "streetwear", "luxury", "sport", "evening", "vintage", "business"];

function PhotoBox({ photo, onChange, label, helper, emptyLabel, testId }) {
  return (
    <div className="w-full">
      <label className="block text-[#F4F1EA] text-[13px] font-medium mb-2 font-['Inter_Tight']">{label}</label>
      <ImageUploadZone
        value={photo}
        onChange={onChange}
        layout="square"
        testId={testId}
        compressOptions={{
          maxSize: 1280,
          maxBytes: 900 * 1024,
          maxBytesIOS: 1.2 * 1024 * 1024,
        }}
        emptyLabel={emptyLabel}
        emptyHint={helper}
      />
    </div>
  );
}

export default function ClothesChanger() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat } = useI18n();
  useTitle(tCat("tool_clothes_name"));
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const { mobileTab, setMobileTab, panelVisibility, focusResultPanel } = useStudioMobileTabs();
  const [photo, setPhoto] = useState(null);
  const [garment, setGarment] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [changeType, setChangeType] = useState("full");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = costs.clothes;

  const stylePresets = useMemo(
    () => PRESET_IDS.map((id) => ({
      id,
      label: t(`clothes_preset_${id}_label`),
      desc: t(`clothes_preset_${id}_desc`),
    })),
    [t],
  );

  const changeTypes = useMemo(
    () => [
      { id: "full", label: t("clothes_change_full"), hint: t("clothes_change_full_hint") },
      { id: "piece", label: t("clothes_change_piece"), hint: t("clothes_change_piece_hint") },
      { id: "color", label: t("clothes_change_color"), hint: t("clothes_change_color_hint") },
    ],
    [t],
  );

  const applyPreset = (preset) => {
    setPrompt(preset.desc);
  };

  // Auto-switch is no longer needed — backend chooses the best internal motor.
  // composition when a garment is uploaded, regardless of change_type.

  const run = async () => {
    if (!photo) { toast.error(t("clothes_err_person")); return; }
    if (!garment && prompt.trim().length < 3) {
      toast.error(t("clothes_err_garment"));
      return;
    }
    if ((user?.credits ?? 0) < cost) {
      toast.error(t("common_need_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }
    focusResultPanel();
    clearUploadToast();
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();

      const finalPrompt = prompt.trim();
      if (garment) {
        fd.append("photo", photo);
        fd.append("garment", garment);
        if (finalPrompt) fd.append("prompt", finalPrompt);
        fd.append("change_type", changeType);
      } else {
        const prefixes = {
          full:  "Replace all clothing with:",
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
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto rp-studio-page-pad" data-testid="clothes-page">
      <BrandPageHeader
        icon={Shirt}
        eyebrow={t("tool_cap")}
        title={tCat("tool_clothes_name")}
        description={tCat("tool_clothes_desc")}
        testId="clothes-header"
      />

      <StudioMobileTabs active={mobileTab} onChange={setMobileTab} testIdPrefix="clothes" />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        <div className={`space-y-5 ${panelVisibility("create")}`}>
          <CollapsibleSection title={t("clothes_section_photos")} defaultOpen testId="clothes-section-photos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[600px]">
              <PhotoBox
                photo={photo}
                onChange={setPhoto}
                label={t("clothes_person_label")}
                helper={t("clothes_person_helper")}
                emptyLabel={t("clothes_upload_empty")}
                testId="clothes-photo"
              />
              <PhotoBox
                photo={garment}
                onChange={setGarment}
                label={t("clothes_garment_label")}
                helper={t("clothes_garment_helper")}
                emptyLabel={t("clothes_upload_empty")}
                testId="clothes-garment"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={t("clothes_section_type")} testId="clothes-section-type">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="change-types">
              {changeTypes.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setChangeType(ct.id)}
                  className={`text-left p-4 border-2 rounded-md transition-all ${
                    changeType === ct.id
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 shadow-md shadow-[#7C3AED]/20"
                      : "border-[#2E2E30] hover:border-[#7C3AED]/40 bg-[#13131A]"
                  }`}
                  data-testid={`change-type-${ct.id}`}
                >
                  <p className={`text-[14px] font-medium font-['Inter_Tight'] mb-1 ${changeType === ct.id ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>{ct.label}</p>
                  <p className="text-[#8A8A8E] text-[11px]">{ct.hint}</p>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Step 3 — quick presets */}
          {!garment && (
            <CollapsibleSection title={t("clothes_section_presets")} optional testId="clothes-section-presets">
              <div className="flex flex-wrap gap-2" data-testid="presets">
                {stylePresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="px-4 py-2 border border-[#2E2E30] hover:border-[#7C3AED] text-[#8A8A8E] hover:text-[#C4B5FD] hover:bg-[#7C3AED]/5 text-[12px] font-medium rounded-full transition-all"
                    data-testid={`preset-${p.id}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Step 4 — prompt */}
          {!garment && (
            <CollapsibleSection title={t("clothes_section_prompt")} testId="clothes-section-prompt">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder={t("clothes_prompt_ph")}
                  className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-3.5 rounded-md focus:outline-none resize-none transition-colors"
                  data-testid="clothes-prompt"
                />
                <span className="absolute bottom-3 right-3 text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/500</span>
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* RIGHT */}
        <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className={`xl:sticky xl:top-[80px] self-start ${panelVisibility("result")}`}>
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">{t("clothes_result_label")}</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("clothes_result_empty")} />
        </StudioResultAnchor>
      </div>

      <StudioGenerateBar
        ready={Boolean(photo) && (Boolean(garment) || prompt.trim().length >= 3) && (user?.credits ?? 0) >= cost}
        busy={busy}
        onClick={run}
        label={t("clothes_btn", { n: cost })}
        busyLabel={t("clothes_dressing")}
        hint={!photo ? t("clothes_err_person") : (!garment && prompt.trim().length < 3 ? t("clothes_err_garment") : null)}
        testId="clothes-create"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />
    </div>
  );
}
