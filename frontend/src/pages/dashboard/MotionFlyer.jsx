import { useCallback, useEffect, useMemo, useState } from "react";

import { ChevronDown, RefreshCw } from "lucide-react";

import { toast } from "sonner";

import { api, formatApiError, trackPendingPrediction, uploadPost } from "../../lib/api";

import { useAuth } from "../../lib/auth";

import { useI18n } from "../../lib/i18n";

import { usePricing } from "../../lib/PricingContext";

import useTitle from "../../lib/useTitle";

import StudioCompactShell from "../../components/studio/StudioCompactShell";

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

  const { user, refresh } = useAuth();

  const { region } = usePricing();

  useTitle(t("mfly_title"));



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

        headers: { "x-pricing-region": region || "intl", "x-lang": lang || "pt" },

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

    <StudioCompactShell testId="motion-flyer-page" className="pb-4 md:pb-8">

      <p className="mb-3 md:mb-4 text-[11px] text-[#6b6b70] hidden sm:block">{t("mfly_subtitle")}</p>



      <div className="rounded-xl md:rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-5 space-y-3 md:space-y-4 mb-4">

        <MotionFlyerUpload file={file} onChange={handleFileChange} disabled={busy} />



        <MotionFlyerOptions imageAspect={imageAspect} cost={cost} />



        {busy && (

          <div className="space-y-1.5" data-testid="mfly-progress">

            <div className="h-1 rounded-full bg-[#2E2E30] overflow-hidden">

              <div className="h-full w-2/3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] animate-pulse" />

            </div>

            <p className="text-[11px] text-[#C4B5FD]">{stageLabel}</p>

          </div>

        )}

      </div>



      <StudioGenerateBar

        ready={ready && !busy}

        busy={busy}

        onClick={generate}

        label={t("mfly_generate")}

        busyLabel={t("mfly_generating_bg")}

        hint={hint}

        cost={cost}

        testId="mfly-generate-btn"

        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}

      />



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


