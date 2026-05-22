import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Sparkles, Shirt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudioStickyCta from "../../../components/studio/StudioStickyCta";
import { toast } from "sonner";
import { formatApiError, uploadPost } from "../../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../../lib/creationUrls";
import { useAuth } from "../../../lib/auth";
import { usePricing } from "../../../lib/PricingContext";
import ResultPanel from "../../../components/ResultPanel";
import ImageUploadZone from "../../../components/ImageUploadZone";
import CollapsibleSection from "../../../components/CollapsibleSection";
import StudioResultAnchor from "../../../components/StudioResultAnchor";
import useTitle from "../../../lib/useTitle";
import { readFileAsDataURL } from "../../../lib/previewDataUrl";
import { compressImageNeverFail } from "../../../lib/canvasCompress";
import { useI18n } from "../../../lib/i18n";
import { useStudioI18n } from "../../../lib/useStudioI18n";

const STYLE_PRESETS = [
  { id: "casual",      label: "Casual",      desc: "white t-shirt, blue jeans, sneakers" },
  { id: "formal",      label: "Formal",      desc: "elegant black suit, white shirt, leather shoes" },
  { id: "streetwear",  label: "Streetwear",  desc: "oversized hoodie, baggy cargo pants, high-top sneakers" },
  { id: "luxury",      label: "Luxury",      desc: "designer outfit, silk shirt, gold accessories, premium look" },
  { id: "sport",       label: "Sport",       desc: "athletic gym wear, performance fabric, sportswear" },
  { id: "evening",     label: "Evening",     desc: "elegant evening dress, satin fabric, sophisticated styling" },
  { id: "vintage",     label: "Vintage",     desc: "70s vintage fashion, retro pattern, classic tailoring" },
  { id: "business",    label: "Business",    desc: "navy blazer, crisp shirt, tailored trousers" },
];

async function loadImageFromFile(file) {
  const dataUrl = await readFileAsDataURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = dataUrl;
  });
}

async function composeSideBySideInBrowser(leftFile, rightFile, opts = {}) {
  const targetH = opts.targetHeight || 1024;
  const gap = opts.gap ?? 24;

  const leftImg = await loadImageFromFile(leftFile);
  const rightImg = await loadImageFromFile(rightFile);

  const lw = Math.max(1, Math.round(leftImg.naturalWidth * (targetH / Math.max(1, leftImg.naturalHeight))));
  const rw = Math.max(1, Math.round(rightImg.naturalWidth * (targetH / Math.max(1, rightImg.naturalHeight))));

  const canvas = document.createElement("canvas");
  canvas.width = lw + gap + rw;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(leftImg, 0, 0, lw, targetH);
  ctx.drawImage(rightImg, lw + gap, 0, rw, targetH);

  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
  if (!blob) throw new Error("toBlob");

  const composed = new File([blob], `clothes-merge.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  // Mantém dentro do limite seguro para o endpoint serverless.
  return compressImageNeverFail(composed, {
    maxSize: 1280,
    maxBytes: 900 * 1024,
    maxBytesIOS: 1.2 * 1024 * 1024,
  });
}

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
  const { t } = useStudioI18n();
  const { t: tCat } = useI18n();
  const errMsg = (err) => formatApiError(err, t("common_fail"));
  useTitle(tCat("tool_clothes_name"));
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const navigate = useNavigate();
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
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();

      // Quando há roupa de referência, evitamos prompt genérico e forçamos a “composição”
      // (LEFT = pessoa, RIGHT = roupa) para o Grok entender exatamente o que deve vestir.
      let finalPrompt = prompt.trim();
      if (garment) {
        let composedPhoto = null;
        try {
          composedPhoto = await composeSideBySideInBrowser(photo, garment);
        } catch (e) {
          // Se falhar a composição no browser, cai de volta para o envio normal.
          console.warn("[ClothesChanger] composeSideBySideInBrowser failed", e);
        }

        if (composedPhoto) {
          fd.append("photo", composedPhoto);
          fd.append("composed", "true");
          fd.append("prompt", [
            "The provided image contains TWO panels side-by-side:",
            "LEFT panel = the person photo.",
            "RIGHT panel = the clothing/outfit reference.",
            "Output a single photo of ONLY the person (LEFT) now wearing EXACTLY the outfit from the RIGHT panel.",
            "Preserve the person's face, identity and pose.",
            "Match clothing details precisely: colors, fabric texture, collar/sleeves, patterns/logos, buttons, and overall silhouette.",
            finalPrompt ? `Additional notes: ${finalPrompt}.` : "Use the right panel outfit as the single source of truth."
          ].join(" "));
          fd.append("change_type", changeType);
        } else {
          fd.append("photo", photo);
          fd.append("garment", garment);
          fd.append("prompt", [
            "The right image (garment reference) must define the outfit.",
            "Preserve the person's face and pose and dress them with the EXACT outfit from the reference.",
            finalPrompt ? `Additional notes: ${finalPrompt}.` : "Use the reference outfit as the single source of truth."
          ].join(" "));
          fd.append("change_type", changeType);
        }
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
      toast.error(errMsg(err), { duration: 8000 });
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
        <p className="text-[#8A8A8E] text-[15px] max-w-[640px]">{t("clothes_changer.description")}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-5">
          {/* Step 1 — photos */}
          <CollapsibleSection title={t("clothes_section_photos")} defaultOpen testId="clothes-section-photos">
            <div className="grid grid-cols-2 gap-3 max-w-[600px]">
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
                {STYLE_PRESETS.map((p) => (
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
        <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className="xl:sticky xl:top-[80px] self-start">
          <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">{t("clothes_result_label")}</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("clothes_result_empty")} />
        </StudioResultAnchor>
      </div>

      <StudioStickyCta testId="clothes-cta-bar">
        <div className="hidden sm:flex items-center gap-3 text-[12px] font-['Inter_Tight'] shrink-0">
          <span className="text-[#8A8A8E]">{t("clothes_credits_needed")}</span>
          <span className="text-[#C4B5FD] font-semibold tabular-nums">{cost}</span>
          <span className="w-px h-4 bg-[#2E2E30]" aria-hidden />
          <span className="text-[#8A8A8E]">{t("clothes_balance")}</span>
          <span className="text-[#F4F1EA] font-medium tabular-nums">{user?.credits ?? 0}</span>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rp-action-primary flex-1 sm:flex-initial sm:min-w-[260px] sm:ml-auto !w-auto sm:!w-auto"
          data-testid="clothes-create"
        >
          {busy ? (
            <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> {t("clothes_dressing")}</>
          ) : (
            <><Sparkles className="w-4 h-4" strokeWidth={1.5} /> {t("clothes_btn", { n: cost })}</>
          )}
        </button>
      </StudioStickyCta>
    </div>
  );
}
