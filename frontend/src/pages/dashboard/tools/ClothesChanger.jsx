import { useMemo, useState } from "react";
import { Layers, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { isAdminUser } from "../../../lib/isAdmin";
import { usePricing } from "../../../lib/PricingContext";
import ImageUploadZone from "../../../components/ImageUploadZone";
import GenerationBubble from "../../../components/studio/GenerationBubble";
import SettingCard from "../../../components/studio/SettingCard";
import SettingModal from "../../../components/studio/SettingModal";
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
        className="min-h-[140px] sm:min-h-[200px]"
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
  const [changeType, setChangeType] = useState("full");
  const [engine, setEngine] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);

  const cost = costs.clothes;
  const isAdmin = isAdminUser(user);

  useStudioSessionBack("/app/tools");

  const changeTypes = useMemo(
    () => [
      { id: "full", label: t("clothes_change_full"), hint: t("clothes_change_full_hint") },
      { id: "piece", label: t("clothes_change_piece"), hint: t("clothes_change_piece_hint") },
      { id: "color", label: t("clothes_change_color"), hint: t("clothes_change_color_hint") },
    ],
    [t],
  );

  const engineOptions = useMemo(
    () => [
      {
        id: "normal",
        label: t("clothes_engine_normal") || "Normal · Flux",
        hint: t("clothes_engine_normal_hint") || "Flux 2 Klein — standard outfit swap.",
      },
      {
        id: "nsfw",
        label: t("clothes_engine_nsfw") || "NSFW · Grok",
        hint: t("clothes_engine_nsfw_hint") || "Grok Imagine — more permissive for adult / lingerie content (admin only).",
      },
    ],
    [t],
  );

  const typeLabel = changeTypes.find((c) => c.id === changeType)?.label || changeType;
  const engineLabel = engineOptions.find((e) => e.id === engine)?.label || engine;

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
      fd.append("change_type", changeType);
      if (isAdmin && engine === "nsfw") {
        fd.append("engine", "nsfw");
      } else {
        fd.append("engine", "normal");
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
          {/* Sempre 2 colunas (como antes) — no telemóvel empilhar deixa as caixas enormes e parte o ecrã */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-[600px]" data-testid="clothes-photo-grid">
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
              helper={t("clothes_fashion_garment_helper") || "Foto da peça"}
              emptyLabel={t("clothes_upload_empty")}
              testId="clothes-garment"
            />
          </div>
          <p className="text-[#6B7280] text-[11px] mt-2 leading-relaxed">
            {t("clothes_desc")}
          </p>
        </div>

        <div className="mv-setting-grid">
          <SettingCard
            icon={Layers}
            label={t("clothes_section_type")}
            value={typeLabel}
            onOpen={() => setTypeOpen(true)}
            testId="clothes-card-type"
            helpKey="help_sec_clothes_garment"
          />
          {isAdmin ? (
            <SettingCard
              icon={Sparkles}
              label={t("clothes_section_engine") || "Engine"}
              value={engineLabel}
              onOpen={() => setEngineOpen(true)}
              testId="clothes-card-engine"
            />
          ) : null}
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

      <SettingModal
        open={typeOpen}
        title={t("clothes_section_type")}
        onClose={() => setTypeOpen(false)}
      >
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
              <p className={`text-[14px] font-medium font-display mb-1 ${changeType === ct.id ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>
                {ct.label}
              </p>
              <p className="text-[#8A8A8E] text-[11px]">{ct.hint}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTypeOpen(false)}
          className="rp-modal-confirm mt-3"
          data-testid="clothes-type-confirm"
        >
          <Check className="w-4 h-4" /> {t("confirm") || "Confirmar"}
        </button>
      </SettingModal>

      {isAdmin ? (
        <SettingModal
          open={engineOpen}
          title={t("clothes_section_engine") || "Engine"}
          onClose={() => setEngineOpen(false)}
        >
          <p className="text-[11px] text-[#8A8A8E] leading-relaxed mb-2" data-testid="clothes-engine-admin-note">
            {t("clothes_engine_admin_only") || "Admin only — NSFW engine uses Grok Imagine (more permissive for adult content)."}
          </p>
          <div className="grid grid-cols-1 gap-2" data-testid="clothes-engines">
            {engineOptions.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setEngine(opt.id)}
                className={`text-left p-4 border-2 rounded-xl transition-all ${
                  engine === opt.id
                    ? "border-[#7C3AED] bg-[#7C3AED]/10"
                    : "border-[#2E2E30] hover:border-[#7C3AED]/40 bg-[#13131A]"
                }`}
                data-testid={`clothes-engine-${opt.id}`}
              >
                <p className={`text-[14px] font-medium font-display mb-1 ${engine === opt.id ? "text-[#C4B5FD]" : "text-[#F4F1EA]"}`}>
                  {opt.label}
                </p>
                <p className="text-[#8A8A8E] text-[11px]">{opt.hint}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEngineOpen(false)}
            className="rp-modal-confirm mt-3"
            data-testid="clothes-engine-confirm"
          >
            <Check className="w-4 h-4" /> {t("confirm") || "Confirmar"}
          </button>
        </SettingModal>
      ) : null}

      <GenerationBubble busy={busy} result={result} onChange={setResult} />
    </StudioCompactShell>
  );
}
