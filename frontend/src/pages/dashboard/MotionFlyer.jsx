import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError, trackPendingPrediction, uploadPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import useTitle from "../../lib/useTitle";
import { useStudioSessionBack } from "../../lib/useStudioSessionBack";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";
import GenerationBubble from "../../components/studio/GenerationBubble";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";

import MotionFlyerUpload from "../../components/motion-flyer/MotionFlyerUpload";

import MotionFlyerOptions from "../../components/motion-flyer/MotionFlyerOptions";

import {

  MOTION_FLYER_DURATION,

  MOTION_FLYER_STAGE_KEYS,

  computeMotionFlyerCostFromPricing,

  readImageFileDimensions,

  statusLabelKey,

} from "../../lib/motionFlyer";

import {

  consumePosterForMotionFlyer,

  fetchPosterImageFile,

} from "../../lib/posterMotionFlyerBridge";



export default function MotionFlyer() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { region } = usePricing();
  useTitle(t("mfly_title"));
  useStudioSessionBack("/app/video");



  const [file, setFile] = useState(null);

  const [imageAspect, setImageAspect] = useState(null);

  const [pricing, setPricing] = useState({ 10: 200 });

  const [history, setHistory] = useState([]);

  const [busy, setBusy] = useState(false);

  const [stageIdx, setStageIdx] = useState(0);



  const cost = useMemo(() => computeMotionFlyerCostFromPricing(pricing), [pricing]);



  const { ready, hint } = useStudioGenerateGate({

    user,

    cost,

    requirePhoto: true,

    photo: file,

  });



  const loadConfig = useCallback(async () => {

    try {

      const { data } = await api.get("/motion-flyer/config", {

        headers: { "x-pricing-region": region || "intl", "x-lang": lang || "en" },

      });

      if (data?.pricing) setPricing(data.pricing);

    } catch {

      /* fallback defaults */

    }

  }, [region, lang]);



  const loadHistory = useCallback(async () => {

    try {

      const { data } = await api.get("/motion-flyer/history");

      setHistory(data?.jobs || []);

    } catch {

      setHistory([]);

    }

  }, []);



  useEffect(() => {

    loadConfig();

    loadHistory();

  }, [loadConfig, loadHistory]);



  const handleFileChange = useCallback(async (nextFile) => {

    setFile(nextFile);

    if (!nextFile) {

      setImageAspect(null);

      return;

    }

    const dims = await readImageFileDimensions(nextFile);

    setImageAspect(dims);

  }, []);



  useEffect(() => {

    const queued = consumePosterForMotionFlyer();

    if (!queued) return;

    let cancelled = false;

    (async () => {

      try {

        const nextFile = await fetchPosterImageFile(queued);

        if (cancelled || !nextFile) return;

        await handleFileChange(nextFile);

        toast.message(t("post_mfly_prefilled"));

      } catch {

        if (!cancelled) toast.error(t("post_mfly_prefill_fail"));

      }

    })();

    return () => {

      cancelled = true;

    };

  }, [t, handleFileChange]);



  useEffect(() => {

    if (!busy) return undefined;

    setStageIdx(0);

    const id = window.setInterval(() => {

      setStageIdx((i) => Math.min(MOTION_FLYER_STAGE_KEYS.length - 1, i + 1));

    }, 14000);

    return () => window.clearInterval(id);

  }, [busy]);



  const generate = async () => {

    if (!file) {

      toast.error(t("mfly_need_image"));

      return;

    }

    if (!ready) {

      if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {

        toast.error(t("mfly_need_credits", { need: cost, have: user?.credits ?? 0 }));

      }

      return;

    }



    setBusy(true);

    setStageIdx(0);

    let submitData;



    try {

      const fd = new FormData();

      fd.append("image_0", file);

      fd.append("duration", String(MOTION_FLYER_DURATION));

      fd.append("lang", lang || "pt");

      if (imageAspect?.width) fd.append("image_width", String(imageAspect.width));

      if (imageAspect?.height) fd.append("image_height", String(imageAspect.height));

      fd.append("notify_by_email", "1");

      if (user?.email) fd.append("notify_email", user.email);

      ({ data: submitData } = await uploadPost("/generate/motion-flyer", fd, {

        timeout: 120000,

        headers: { "X-Skip-Auto-Poll": "1" },

      }));



      trackPendingPrediction(submitData.prediction_id, {

        credits_spent: submitData.credits_spent ?? cost,

        type: "motion_flyer",

      });



      const spent = submitData.credits_spent ?? cost;

      toast.success(

        spent > 0

          ? t("mfly_success_charged", { n: spent })

          : t("mfly_success"),

      );

      await refresh();

      await loadHistory();

    } catch (err) {

      toast.error(formatApiError(err, t("mfly_fail"), { t }), { duration: 9000 });

      if (err?.refunded && submitData?.credits_spent) {

        await refresh().catch(() => {});

      }

    } finally {

      setBusy(false);

      setStageIdx(0);

    }

  };



  const stageLabel = t(MOTION_FLYER_STAGE_KEYS[stageIdx] || MOTION_FLYER_STAGE_KEYS[0]);



  return (
    <StudioCompactShell testId="motion-flyer-page" maxWidth="720px" className="pb-8">
      <StudioInlineHeader
        eyebrow={t("vid_cap")}
        title={t("mfly_title")}
        description={t("mfly_subtitle")}
        testId="motion-flyer-header"
      />

      <div className="space-y-2.5">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-4">
          <p className="text-[#9CA3AF] text-[12px] leading-relaxed mb-3">{t("mfly_upload_hint")}</p>
          <MotionFlyerUpload file={file} onChange={handleFileChange} disabled={busy} />
        </div>

        <MotionFlyerOptions imageAspect={imageAspect} cost={cost} />

        {busy ? <GenerationBubble busy={busy} result={null} onChange={() => {}} /> : null}

        <div className="mv-setting-card mv-setting-card--static">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <StudioGenerateBar
              layout="inline"
              ready={ready && !busy}
              busy={busy}
              onClick={generate}
              label={t("mfly_generate")}
              busyLabel={t("mfly_generating_bg")}
              hint={hint}
              cost={cost}
              testId="mfly-generate-btn"
              buttonClassName="rp-gen-btn-inline w-full sm:w-auto"
            />
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            <StudioGenerateCostMeta cost={cost} user={user} />
          </div>
        </div>
      </div>



      <details className="mt-6 md:mt-8 group" data-testid="mfly-history">

        <summary className="flex items-center justify-between gap-2 cursor-pointer list-none py-1">

          <span className="text-[12px] font-medium text-[#E9E4DC]">{t("mfly_history")}</span>

          <span className="flex items-center gap-2 text-[#8A8A8E]">

            <button

              type="button"

              onClick={(e) => {

                e.preventDefault();

                loadHistory();

              }}

              className="inline-flex items-center gap-1 text-[10px] hover:text-[#C4B5FD]"

            >

              <RefreshCw className="w-3 h-3" />

            </button>

            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />

          </span>

        </summary>

        <div className="mt-2">

          {!history.length ? (

            <p className="text-[11px] text-[#6b6b70]">{t("mfly_history_empty")}</p>

          ) : (

            <div className="space-y-2">

              {history.slice(0, 8).map((job) => (

                <div

                  key={job.id}

                  className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#0f0f12] px-2.5 py-2 text-[11px]"

                >

                  <span className="text-[#E9E4DC] truncate capitalize">{job.category || "auto"}</span>

                  <span className="text-[#8A8A8E] shrink-0">{job.duration ? `${job.duration}s` : "—"}</span>

                  <span className="font-mono text-[#C4B5FD] shrink-0">{job.credits_spent ?? "—"}</span>

                  <span className="text-[#8A8A8E] shrink-0">{t(statusLabelKey(job.status))}</span>

                </div>

              ))}

            </div>

          )}

        </div>

      </details>

    </StudioCompactShell>

  );

}


