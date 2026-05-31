import { useMemo, useState } from "react";
import { Loader2, Sparkles, Shirt, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import ResultPanel from "../../../components/ResultPanel";
import ImageUploadZone from "../../../components/ImageUploadZone";
import CollapsibleSection from "../../../components/CollapsibleSection";
import StudioResultAnchor from "../../../components/StudioResultAnchor";
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
  const { refresh, refundCredits, user } = useAuth();
  const { costs } = usePricing();
  const [photo, setPhoto] = useState(null);
  const [garment, setGarment] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [changeType, setChangeType] = useState("full");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [mobileTab, setMobileTab] = useState("create");
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

  const panelVisibility = (tab) => (mobileTab !== tab ? "hidden xl:block" : "");
  const resultReady = Boolean(primaryResultUrl(result));

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
    clearUploadToast();
    setMobileTab("result");
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("rp:scroll-to-result"));
    });
    setBusy(true); setResult(null);
    let submitCredits = null;
    try {
      const fd = new FormData();
      const finalPrompt = prompt.trim();
      fd.append("photo", photo);
      fd.append("change_type", changeType);
      if (garment) {
        fd.append("garment", garment);
        if (finalPrompt) fd.append("prompt", finalPrompt);
      } else {
        fd.append("prompt", finalPrompt);
      }

      const { data } = await uploadPost("/tools/clothes", fd, { timeout: 240000 });
      submitCredits = data?.credits_spent ?? cost;
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("clothes_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
      const spent = submitCredits ?? (err?.refunded ? cost : 0);
      if (err?.refunded && spent && !err?.server_billing) {
        refundCredits?.(spent, t("studio_refund_desc"));
      }
      try { await refresh(); } catch { /* ignore */ }
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-32" data-testid="clothes-page">
      <header className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#7C3AED]/15 flex items-center justify-center">
            <Shirt className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
          </div>
          <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em]">{tCat("tool_clothes_name")}</p>
        </div>
        <h1 className="text-[#F4F1EA] text-[32px] md:text-[44px] font-light tracking-[-0.02em] leading-[1.1] mb-3 font-['Inter_Tight']">
          {tCat("tool_clothes_name")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">{t("clothes_desc")}</p>
      </header>

      <div
        className="xl:hidden flex gap-2 mb-5 p-1 rounded-xl border border-white/[0.08] bg-white/[0.03]"
        role="tablist"
        data-testid="clothes-mobile-tabs"
      >
        {[
          { id: "create", labelKey: "studio_tab_create", icon: Sparkles },
          { id: "result", labelKey: "studio_tab_result", icon: ImageIcon },
        ].map(({ id, labelKey, icon: Icon }) => {
          const active = mobileTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMobileTab(id)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                  : "text-rp-mute2 hover:text-rp-mute"
              }`}
              data-testid={`clothes-tab-${id}`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2 : 1.75} />
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        <div className={`space-y-5 ${panelVisibility("create")}`}>
          {/* Step 1 — photos */}
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
        <StudioResultAnchor
          busy={busy}
          ready={resultReady}
          className={`xl:sticky xl:top-[80px] self-start ${panelVisibility("result")}`}
        >
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">{t("clothes_result_label")}</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("clothes_result_empty")} />
        </StudioResultAnchor>
      </div>

      {/* Sticky CTA */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[12px]">
            <span className="text-[#8A8A8E]">{t("clothes_credits_needed")}</span>
            <span className="text-[#C4B5FD] font-medium text-[16px]">{cost}</span>
            <span className="text-[#5A5A5E] mx-2">·</span>
            <span className="text-[#8A8A8E]">{t("clothes_balance")}</span>
            <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
          </div>
          <button
            onClick={run}
            disabled={busy}
            className="flex-1 sm:flex-initial sm:min-w-[260px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] disabled:from-[#1A1A1C] disabled:to-[#1A1A1C] disabled:text-[#5A5A5E] text-white py-3.5 rounded-md text-[13px] font-medium tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50"
            data-testid="clothes-create"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t("clothes_dressing")}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {t("clothes_btn", { n: cost })}</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
