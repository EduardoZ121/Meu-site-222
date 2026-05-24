import { useMemo, useState } from "react";
import { Loader2, Sparkles, Shirt } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatApiError, uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import ResultPanel from "../../../components/ResultPanel";
import ImageUploadZone from "../../../components/ImageUploadZone";
import StudioResultAnchor from "../../../components/StudioResultAnchor";
import useTitle from "../../../lib/useTitle";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";

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

function SectionTitle({ step, children }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A78BFA] mb-4 font-['Inter_Tight']">
      {step ? <span className="text-[#7C3AED] mr-2">{step}</span> : null}
      {children}
    </h2>
  );
}

function PhotoUploadCard({
  photo, onChange, label, helper, emptyLabel, testId,
}) {
  const hasPhoto = Boolean(photo);
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-[#F4F1EA] text-[14px] font-medium font-['Inter_Tight']">{label}</p>
        {helper && <p className="text-[#6B6B70] text-[12px] mt-0.5">{helper}</p>}
      </div>
      <div
        className={`rounded-2xl transition-all duration-200 ${
          hasPhoto
            ? "ring-1 ring-[#7C3AED]/40 shadow-[0_0_32px_-12px_rgba(124,58,237,0.45)]"
            : "border-2 border-dashed border-[#7C3AED]/45 bg-[#7C3AED]/[0.04] hover:border-[#A78BFA]/70 hover:bg-[#7C3AED]/[0.07]"
        }`}
      >
        <ImageUploadZone
          value={photo}
          onChange={onChange}
          layout="square"
          testId={testId}
          className="rounded-2xl"
          compressOptions={{
            maxSize: 1280,
            maxBytes: 900 * 1024,
            maxBytesIOS: 1.2 * 1024 * 1024,
          }}
          emptyLabel={emptyLabel}
          emptyHint={helper}
        />
      </div>
    </div>
  );
}

export default function ClothesChanger() {
  const { t } = useStudioI18n();
  const { t: tCat } = useI18n();
  const errMsg = (err) => formatApiError(err, t("common_fail"));
  useTitle(tCat("tool_clothes_name"));
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const [photo, setPhoto] = useState(null);
  const [garment, setGarment] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [changeType, setChangeType] = useState("full");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cost = costs.clothes;

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

  const run = async () => {
    if (!photo) {
      toast.error(t("clothes_err_person"));
      return;
    }
    if (!garment && prompt.trim().length < 3) {
      toast.error(t("clothes_err_garment"));
      return;
    }
    if ((user?.credits ?? 0) < cost) {
      toast.error(t("common_need_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("change_type", changeType);

      const finalPrompt = prompt.trim();
      if (garment) {
        fd.append("garment", garment);
        if (finalPrompt) fd.append("prompt", finalPrompt);
      } else {
        const prefixes = {
          full: "Replace all clothing with:",
          piece: "Add or replace this piece:",
          color: "Same outfit, new color or pattern:",
        };
        const prefix = prefixes[changeType] || prefixes.full;
        fd.append("prompt", `${prefix} ${finalPrompt}`);
      }

      const { data } = await uploadPost("/tools/clothes", fd, { timeout: 240000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("clothes_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(errMsg(err), { duration: 8000 });
    } finally {
      setBusy(false);
    }
  };

  const hasResult = Boolean(primaryResultUrl(result));

  return (
    <div className="max-w-[1400px] mx-auto pb-36" data-testid="clothes-page">
      <header className="mb-10 md:mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED]/25 to-[#EC4899]/10 border border-[#7C3AED]/30 flex items-center justify-center">
            <Shirt className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
          </div>
          <p className="text-[#A78BFA] text-[10px] font-semibold uppercase tracking-[0.22em]">
            {tCat("tool_clothes_name")}
          </p>
        </div>
        <h1 className="text-[#F4F1EA] text-[34px] md:text-[48px] font-light tracking-[-0.03em] leading-[1.05] mb-4 font-['Inter_Tight']">
          {tCat("tool_clothes_name")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] md:text-[16px] max-w-[600px] leading-relaxed">
          {t("clothes_desc")}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-12 xl:gap-14">
        <div className="space-y-10 md:space-y-12">
          <section data-testid="clothes-section-photos">
            <SectionTitle step="01">{t("clothes_section_photos")}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[720px]">
              <PhotoUploadCard
                photo={photo}
                onChange={setPhoto}
                label={t("clothes_person_label")}
                helper={t("clothes_person_helper")}
                emptyLabel={t("clothes_upload_empty")}
                testId="clothes-photo"
              />
              <PhotoUploadCard
                photo={garment}
                onChange={setGarment}
                label={t("clothes_garment_label")}
                helper={t("clothes_garment_helper")}
                emptyLabel={t("clothes_upload_empty")}
                testId="clothes-garment"
              />
            </div>
          </section>

          <section data-testid="clothes-section-type">
            <SectionTitle step="02">{t("clothes_section_type")}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="change-types">
              {changeTypes.map((ct) => {
                const active = changeType === ct.id;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setChangeType(ct.id)}
                    className={`text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? "border-[#7C3AED] bg-[#0f0a18] shadow-[0_0_28px_-6px_rgba(124,58,237,0.55),inset_0_0_0_1px_rgba(167,139,250,0.12)]"
                        : "border-[#2E2E30] bg-[#0E0E12]/80 hover:border-[#7C3AED]/35 hover:bg-[#13131A]"
                    }`}
                    data-testid={`change-type-${ct.id}`}
                  >
                    <p className={`text-[14px] font-semibold font-['Inter_Tight'] mb-1.5 ${
                      active ? "text-[#E9D5FF]" : "text-[#F4F1EA]"
                    }`}
                    >
                      {ct.label}
                    </p>
                    <p className="text-[#6B6B70] text-[11.5px] leading-snug">{ct.hint}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {!garment && (
            <section data-testid="clothes-section-presets">
              <SectionTitle step="03">{t("clothes_section_presets")}</SectionTitle>
              <div className="flex flex-wrap gap-2" data-testid="presets">
                {STYLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-4 py-2 border border-[#2E2E30] hover:border-[#7C3AED]/60 text-[#8A8A8E] hover:text-[#E9D5FF] hover:bg-[#7C3AED]/8 text-[12px] font-medium rounded-full transition-all"
                    data-testid={`preset-${p.id}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!garment && (
            <section data-testid="clothes-section-prompt">
              <SectionTitle step={garment ? "03" : "04"}>{t("clothes_section_prompt")}</SectionTitle>
              <div className="relative max-w-[720px]">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder={t("clothes_prompt_ph")}
                  className="w-full bg-[#0E0E12] border border-[#2E2E30] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30 text-[#F4F1EA] text-[15px] placeholder:text-[#5A5A5E] px-4 py-4 rounded-xl focus:outline-none resize-none transition-all"
                  data-testid="clothes-prompt"
                />
                <span className="absolute bottom-3 right-3 text-[#5A5A5E] text-[11px] font-mono">
                  {prompt.length}/500
                </span>
              </div>
            </section>
          )}

          {garment && (
            <section className="max-w-[720px]" data-testid="clothes-section-notes">
              <SectionTitle step="03">{t("clothes_section_notes")}</SectionTitle>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={t("clothes_notes_ph")}
                className="w-full bg-[#0E0E12] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-xl focus:outline-none resize-none"
                data-testid="clothes-notes"
              />
            </section>
          )}
        </div>

        <StudioResultAnchor
          busy={busy}
          ready={hasResult}
          className="xl:sticky xl:top-[88px] self-start"
        >
          <SectionTitle>{t("clothes_result_label")}</SectionTitle>
          <p className="text-[#6B6B70] text-[12px] mb-4 -mt-2">{t("clothes_result_hint")}</p>
          <div className="rounded-2xl border border-[#2E2E30] bg-[#0A0A0C]/60 overflow-hidden">
            <ResultPanel
              creation={result}
              loading={busy}
              onChange={setResult}
              emptyLabel={t("clothes_result_empty")}
            />
          </div>
        </StudioResultAnchor>
      </div>

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 md:left-[240px] z-30 border-t border-[#2E2E30]/80 bg-[#0B0B0C]/95 backdrop-blur-xl px-4 sm:px-8 py-5"
      >
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4 text-[12px] text-[#8A8A8E]">
            <span>
              {t("clothes_credits_needed")}{" "}
              <strong className="text-[#C4B5FD] text-[15px] tabular-nums">{cost}</strong>
            </span>
            <span className="text-[#3F3F46]">·</span>
            <span>
              {t("clothes_balance")}{" "}
              <strong className="text-[#F4F1EA] tabular-nums">{user?.credits ?? 0}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="w-full sm:w-auto sm:min-w-[300px] bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#9333EA] hover:from-[#7C3AED] hover:via-[#8B5CF6] hover:to-[#A855F7] disabled:from-[#1A1A1C] disabled:via-[#1A1A1C] disabled:to-[#1A1A1C] disabled:text-[#5A5A5E] text-white py-4 px-8 rounded-xl text-[14px] font-semibold tracking-wide transition-all flex items-center justify-center gap-2.5 shadow-[0_8px_32px_-8px_rgba(124,58,237,0.65)] hover:shadow-[0_12px_40px_-8px_rgba(124,58,237,0.75)]"
            data-testid="clothes-create"
          >
            {busy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("clothes_dressing")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" strokeWidth={2} />
                {t("clothes_btn", { n: cost })}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
