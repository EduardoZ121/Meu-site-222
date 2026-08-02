import { useMemo, useState } from "react";
import { ZoomIn, Sliders, Check } from "lucide-react";
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
import { useStudioSessionBack } from "../../../lib/useStudioSessionBack";
import useTitle from "../../../lib/useTitle";

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

export default function Upscale() {
  const { t, errToast, clearUploadToast } = useStudioI18n();
  const { t: tCat } = useI18n();
  const navigate = useNavigate();
  useTitle(tCat("tool_upscale_name"));
  const { user, refresh } = useAuth();
  const { costs } = usePricing();

  const [photos, setPhotos] = useState([]);
  const photo = primaryStudioPhoto(photos);
  const [scale, setScale] = useState(2);
  const [sharpen, setSharpen] = useState(true);
  const [denoise, setDenoise] = useState(true);
  const [preserveColors, setPreserveColors] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const openModal = (key) => setOpenKey(key);
  const closeModal = () => setOpenKey(null);

  const cost = costs.upscale;

  useStudioSessionBack(() => navigate("/app/tools"));

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
  });

  const scaleOptions = useMemo(
    () => [
      { s: 2, label: t("upscale_scale_2_label"), hint: t("upscale_scale_2_hint") },
      { s: 4, label: t("upscale_scale_4_label"), hint: t("upscale_scale_4_hint") },
    ],
    [t],
  );

  const tuningCount = [sharpen, denoise, preserveColors].filter(Boolean).length;
  const scaleLabel = scale === 4 ? t("upscale_scale_4_label") : t("upscale_scale_2_label");
  const tuningLabel = tuningCount === 0
    ? (t("studio_styles_optional"))
    : `${tuningCount}/3`;

  const run = async () => {
    if (!photo) { toast.error(t("common_upload_first")); return; }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("scale", String(scale));
      fd.append("sharpen", sharpen ? "true" : "false");
      fd.append("denoise", denoise ? "true" : "false");
      fd.append("preserve_colors", preserveColors ? "true" : "false");
      const { data } = await uploadPost("/tools/upscale", fd, { timeout: 240000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("common_no_result"));
      setResult(creation);
      toast.success(t("upscale_success", { scale, n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      errToast(err);
    } finally {
      setBusy(false);
    }
  };

  const modalTitle = {
    scale: t("upscale_section_scale"),
    tuning: t("common_section_tuning"),
  }[openKey] || "";

  const onPhotosChange = (next) => {
    setPhotos(next);
    setResult(null);
  };

  return (
    <StudioCompactShell testId="upscale-frame" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        title={tCat("tool_upscale_name")}
        description={t("upscale_desc_long")}
        testId="upscale-header"
        helpKey="help_tool_upscale"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("common_upload_hint_drag")}
          </p>
          <CompactImagePicker value={photos} onChange={onPhotosChange} maxFiles={1} testId="upscale-photo" />
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={ZoomIn}
            label={t("upscale_section_scale")}
            value={scaleLabel}
            onOpen={() => openModal("scale")}
            testId="upscale-card-scale"
            helpKey="help_sec_upscale_scale"
          />
          <SettingCard
            icon={Sliders}
            label={t("common_section_tuning")}
            value={tuningLabel}
            onOpen={() => openModal("tuning")}
            testId="upscale-card-tuning"
            helpKey="help_sec_upscale_options"
          />
        </div>

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready}
              busy={busy}
              onClick={run}
              label={t("upscale_btn", { n: cost })}
              busyLabel={t("upscale_loading", { scale })}
              hint={hint}
              cost={cost}
              testId="upscale-create-btn"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>

      <SettingModal open={openKey === "scale"} title={modalTitle} onClose={closeModal}>
        <p className="text-[#8A8A8E] text-[12px] mb-3 leading-relaxed">{t("upscale_section_scale_hint")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="upscale-scale-options">
          {scaleOptions.map(({ s, label, hint: scaleHint }) => (
            <button
              type="button"
              key={s}
              onClick={() => setScale(s)}
              data-testid={`upscale-scale-${s}`}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all overflow-hidden group ${
                scale === s
                  ? "border-[#7C3AED] bg-[#7C3AED]/10"
                  : "border-[#2E2E30] bg-[#13131A]/50 hover:border-[#7C3AED]/40 hover:bg-[#13131A]"
              }`}
            >
              <div className="flex items-start justify-between mb-2 relative">
                <ZoomIn className={`w-5 h-5 ${scale === s ? "text-[#C4B5FD]" : "text-[#5A5A5E] group-hover:text-[#8A8A8E]"}`} strokeWidth={1.5} />
                {scale === s && (
                  <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className={`relative text-[16px] font-light tracking-[-0.01em] mb-1 font-display ${
                scale === s ? "text-[#F4F1EA]" : "text-[#F4F1EA]/85"
              }`}>
                {label}
              </p>
              <p className="relative text-[#8A8A8E] text-[11px]">{scaleHint}</p>
            </button>
          ))}
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="upscale-scale-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <SettingModal open={openKey === "tuning"} title={modalTitle} onClose={closeModal}>
        <div className="space-y-2.5">
          <Toggle
            active={sharpen}
            onClick={() => setSharpen(!sharpen)}
            label={t("upscale_toggle_sharpen")}
            hint={t("upscale_toggle_sharpen_hint")}
            testId="upscale-toggle-sharpen"
          />
          <Toggle
            active={denoise}
            onClick={() => setDenoise(!denoise)}
            label={t("upscale_toggle_denoise")}
            hint={t("upscale_toggle_denoise_hint")}
            testId="upscale-toggle-denoise"
          />
          <Toggle
            active={preserveColors}
            onClick={() => setPreserveColors(!preserveColors)}
            label={t("upscale_toggle_colors")}
            hint={t("upscale_toggle_colors_hint")}
            testId="upscale-toggle-colors"
          />
        </div>
        <button type="button" onClick={closeModal} className="rp-modal-confirm mt-3" data-testid="upscale-tuning-confirm">
          <Check className="w-4 h-4" /> {t("confirm")}
        </button>
      </SettingModal>

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
