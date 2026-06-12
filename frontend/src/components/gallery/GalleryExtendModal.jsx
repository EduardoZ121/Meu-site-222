import { useMemo, useState } from "react";
import { Film, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { formatApiError, uploadPost } from "../../lib/api";
import { dispatchBackgroundJob, ensureBackgroundSlot } from "../../lib/bgGeneration";
import { primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { getSurcharges } from "../../lib/creditPricing";
import { computeVideoExtendCost, buildVideoExtendSurcharge } from "../../lib/videoExtendPricing";
import { useI18n } from "../../lib/i18n";
import PromptEnhanceToggle from "../promptAssist/PromptEnhanceToggle";

const DURATIONS = [4, 6, 8, 10];
const RESOLUTIONS = ["1080p", "720p"];
const IDEA_KEYS = ["vid_extend_idea_1", "vid_extend_idea_2", "vid_extend_idea_3"];

function selectCard(active) {
  return `px-3 py-2.5 rounded-xl border text-left transition-all ${
    active
      ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5"
      : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
  }`;
}

export default function GalleryExtendModal({ item, onClose, onStarted }) {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const { region } = usePricing();
  const surcharges = useMemo(() => getSurcharges(region), [region]);
  const videoSurcharge = useMemo(() => buildVideoExtendSurcharge(region), [region]);
  const videoUrl = primaryResultUrl(item);

  const [step, setStep] = useState("prompt");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(6);
  const [resolution, setResolution] = useState("1080p");
  const [improve, setImprove] = useState(false);
  const [busy, setBusy] = useState(false);

  const cost = useMemo(() => {
    let total = computeVideoExtendCost({ resolution, duration, regionId: region });
    if (improve) total += surcharges.enhancePrompt ?? 5;
    return total;
  }, [resolution, duration, improve, surcharges.enhancePrompt, region]);

  const ideas = useMemo(() => IDEA_KEYS.map((k) => t(k)), [t]);

  const run = async () => {
    if (!videoUrl) {
      toast.error(t("gal_file_unavailable"));
      return;
    }
    if (prompt.trim().length < 3) {
      toast.error(t("vid_extend_err_short"));
      return;
    }
    if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
      toast.error(t("vid_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }
    setBusy(true);
    try {
      ensureBackgroundSlot();
      const fd = new FormData();
      fd.append("prompt", prompt.trim());
      fd.append("video_url", videoUrl);
      fd.append("resolution", resolution);
      fd.append("duration", String(duration));
      fd.append("lang", lang || "pt");
      if (improve) fd.append("improve_prompt", "1");
      const { data } = await uploadPost("/generate/video-extend", fd, {
        timeout: 600_000,
        skipBlobOffload: true,
        headers: { "X-Skip-Auto-Poll": "1" },
      });
      dispatchBackgroundJob(data, {
        type: "video",
        creditsSpent: data.credits_spent || cost,
        label: t("vid_extend_title"),
      });
      await refresh();
      onStarted?.();
      onClose();
    } catch (err) {
      toast.error(formatApiError(err, t("vid_extend_fail"), { context: "video_upload", t }), { duration: 10000 });
    } finally {
      setBusy(false);
    }
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      data-testid="gallery-extend-modal"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[#2E2E30] bg-[#0F0F12] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#2E2E30] bg-[#0F0F12]/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 text-[#A855F7] shrink-0" />
            <p className="text-[#F4F1EA] text-[15px] font-medium truncate">{t("vid_extend_title")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 min-w-10 flex items-center justify-center rounded-full bg-[#1a1a22] text-[#8A8A8E] hover:text-white"
            aria-label={t("gal_close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-3 flex gap-2">
          {["prompt", "options"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStep(id)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                step === id
                  ? "bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/40"
                  : "bg-[#141418] text-[#8A8A8E] border border-transparent"
              }`}
              data-testid={`gallery-extend-tab-${id}`}
            >
              {id === "prompt" ? t("vid_extend_prompt_label") : t("vid_extend_extra_label")}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {step === "prompt" && (
            <>
              <p className="text-[#8A8A8E] text-[12px] leading-relaxed">{t("vid_extend_source_hint")}</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
                rows={4}
                placeholder={t("vid_extend_prompt_placeholder")}
                className="rp-editor-textarea rp-editor-textarea--compact min-h-[100px] w-full"
                data-testid="gallery-extend-prompt"
              />
              <PromptEnhanceToggle
                checked={improve}
                onChange={setImprove}
                testId="gallery-extend-improve"
                cost={surcharges.enhancePrompt ?? 5}
              />
              <div className="flex flex-wrap gap-2">
                {ideas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    className="rp-pill max-w-full !justify-start !normal-case !text-[11px]"
                  >
                    <Sparkles className="w-3 h-3 shrink-0" /> {idea}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "options" && (
            <>
              <div>
                <p className="text-[#8A8A8E] text-[11px] mb-2 uppercase tracking-wider">{t("vid_extend_extra_label")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={selectCard(duration === d)}
                      data-testid={`gallery-extend-dur-${d}`}
                    >
                      <p className="text-[#F4F1EA] text-[15px]">+{d}s</p>
                      {videoSurcharge.duration[d] > 0 && (
                        <p className="text-[#A855F7] text-[10px] font-mono mt-1">+{videoSurcharge.duration[d]}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[#8A8A8E] text-[11px] mb-2 uppercase tracking-wider">{t("vid_edit_resolution")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResolution(r)}
                      className={selectCard(resolution === r)}
                      data-testid={`gallery-extend-res-${r}`}
                    >
                      <p className="text-[#F4F1EA] text-[14px]">{r}</p>
                      {videoSurcharge.resolution[r] > 0 && (
                        <p className="text-[#A855F7] text-[10px] font-mono mt-1">+{videoSurcharge.resolution[r]}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#2E2E30]">
            <p className="text-[#8A8A8E] text-[12px]">
              {t("vid_extend_btn", { n: cost })}
            </p>
            {step === "prompt" ? (
              <button
                type="button"
                onClick={() => setStep("options")}
                disabled={prompt.trim().length < 3}
                className="rp-action-primary !py-2 !px-4 !text-sm disabled:opacity-40"
              >
                {t("vid_extend_extra_label")} →
              </button>
            ) : (
              <button
                type="button"
                onClick={run}
                disabled={busy || prompt.trim().length < 3}
                className="rp-action-primary !py-2 !px-4 !text-sm disabled:opacity-40 inline-flex items-center gap-2"
                data-testid="gallery-extend-submit"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                {t("vid_extend_title")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
