import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import ImageUploadZone from "../../../components/ImageUploadZone";
import GenerationBubble from "../../../components/studio/GenerationBubble";
import StudioCompactShell from "../../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../../components/studio/StudioInlineHeader";
import StudioGenerateBar from "../../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../../lib/useStudioGenerateGate";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";
import { useStudioSessionBack } from "../../../lib/useStudioSessionBack";
import useTitle from "../../../lib/useTitle";

function PhotoBox({ photo, onChange, label, helper, emptyLabel, testId }) {
  return (
    <div className="w-full min-w-0">
      <label className="block text-[#F4F1EA] text-[13px] font-medium mb-2 font-display">
        {label}
      </label>
      <ImageUploadZone
        value={photo}
        onChange={(next) => {
          onChange(next || null);
        }}
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
  const navigate = useNavigate();
  useTitle(tCat("tool_clothes_name"));
  const { refresh, user } = useAuth();
  const { costs } = usePricing();

  const [photo, setPhoto] = useState(null);
  const [garment, setGarment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = costs.clothes;

  useStudioSessionBack(() => navigate("/app/tools"));

  const { ready, hint } = useStudioGenerateGate({
    busy,
    user,
    cost,
    requirePhoto: true,
    photo,
    readyOverride: Boolean(photo && garment),
    hintOverride: !photo
      ? null
      : !garment
        ? t("clothes_err_garment")
        : null,
  });

  const run = async () => {
    if (!photo) {
      toast.error(t("clothes_err_person"));
      return;
    }
    if (!garment) {
      toast.error(t("clothes_err_garment"));
      return;
    }
    clearUploadToast();
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("garment", garment);
      fd.append("change_type", "full");

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

  return (
    <StudioCompactShell testId="clothes-page" maxWidth="900px" className="pb-8">
      <StudioInlineHeader
        title={tCat("tool_clothes_name")}
        description={t("clothes_desc") || t("clothes_changer.description") || tCat("tool_clothes_desc")}
        testId="clothes-header"
        helpKey="help_tool_clothes"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">
            {t("clothes_section_photos")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4" data-testid="clothes-photo-grid">
            <PhotoBox
              photo={photo}
              onChange={(next) => {
                setPhoto(next);
                setResult(null);
              }}
              label={t("clothes_person_label")}
              helper={t("clothes_person_helper")}
              emptyLabel={t("clothes_upload_empty")}
              testId="clothes-photo"
            />
            <PhotoBox
              photo={garment}
              onChange={(next) => {
                setGarment(next);
                setResult(null);
              }}
              label={t("clothes_garment_label")}
              helper={t("clothes_garment_helper")}
              emptyLabel={t("clothes_upload_empty")}
              testId="clothes-garment"
            />
          </div>
          <p className="text-[#6B7280] text-[11px] mt-3 leading-relaxed">
            {t("clothes_garment_helper")}
          </p>
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

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
