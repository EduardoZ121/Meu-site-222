import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, pollPrediction, trackPendingPrediction, uploadPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import useTitle from "../../lib/useTitle";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioInlineHeader from "../../components/studio/StudioInlineHeader";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import MarketingVideoImageGrid from "../../components/marketing-video/MarketingVideoImageGrid";
import {
  MARKETING_VIDEO_DURATIONS,
  MARKETING_VIDEO_STAGE_KEYS,
  computeMarketingVideoCostFromPricing,
  stageIndexForElapsed,
  statusLabelKey,
} from "../../lib/marketingVideo";

export default function MarketingVideo() {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const { region } = usePricing();
  useTitle(t("mktvid_title"));

  const [files, setFiles] = useState([]);
  const [duration, setDuration] = useState(6);
  const [pricing, setPricing] = useState({ 4: 72, 6: 95, 10: 145, 15: 195 });
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [needsCategory, setNeedsCategory] = useState(false);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  const cost = useMemo(
    () => computeMarketingVideoCostFromPricing(pricing, duration),
    [pricing, duration],
  );

  const { ready, hint } = useStudioGenerateGate({
    user,
    cost,
    requirePhoto: true,
    photo: files[0] || null,
    blocked: needsCategory && !category,
  });

  const loadConfig = useCallback(async () => {
    try {
      const { data } = await api.get("/marketing-video/config", {
        headers: { "x-pricing-region": region || "intl", "x-lang": lang || "pt" },
      });
      if (data?.pricing) setPricing(data.pricing);
      if (data?.categories) setCategories(data.categories);
    } catch {
      /* fallback defaults */
    }
  }, [region, lang]);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await api.get("/marketing-video/history");
      setHistory(data?.jobs || []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, [loadConfig, loadHistory]);

  const generate = async () => {
    if (!files.length) {
      toast.error(t("mktvid_need_image"));
      return;
    }
    if (!ready) {
      if ((user?.credits ?? 0) < cost && !user?.is_unlimited) {
        toast.error(t("mktvid_need_credits", { need: cost, have: user?.credits ?? 0 }));
      } else if (needsCategory && !category) {
        toast.message(t("mktvid_pick_category"));
      }
      return;
    }

    setBusy(true);
    setProgress(0);
    setStageIdx(0);
    let submitData;

    try {
      const fd = new FormData();
      files.forEach((file, i) => {
        fd.append(`image_${i}`, file);
      });
      fd.append("duration", String(duration));
      fd.append("lang", lang || "pt");
      if (category) fd.append("category", category);

      ({ data: submitData } = await uploadPost("/generate/marketing-video", fd, {
        timeout: 120000,
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || cost,
        type: "marketing_video",
      });

      await pollPrediction(submitData.prediction_id, {
        onTick: (sec) => {
          setProgress(sec);
          setStageIdx(stageIndexForElapsed(sec));
        },
        credits_spent: submitData.credits_spent || cost,
        type: "marketing_video",
        timeoutMs: 780000,
      });

      toast.success(t("mktvid_success"));
      setNeedsCategory(false);
      await refresh();
      await loadHistory();
    } catch (err) {
      const res = err?.response?.data;
      if (res?.needs_category) {
        setNeedsCategory(true);
        if (res?.categories?.length) setCategories(res.categories);
        toast.message(t("mktvid_pick_category"));
      } else {
        toast.error(formatApiError(err, t("mktvid_fail"), { t }), { duration: 9000 });
      }
      if (err?.refunded && submitData?.credits_spent) {
        await refresh().catch(() => {});
      }
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const stageLabel = t(MARKETING_VIDEO_STAGE_KEYS[stageIdx] || MARKETING_VIDEO_STAGE_KEYS[0]);

  return (
    <StudioCompactShell testId="marketing-video-page" maxWidth="960px" className="pb-8">
      <StudioInlineHeader
        eyebrow={t("mktvid_admin_badge")}
        title={t("mktvid_title")}
        description={t("mktvid_subtitle")}
        testId="marketing-video-header"
      />

      <div className="rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-4 md:p-6 space-y-6 mb-8">
        <div>
          <h2 className="text-[13px] font-medium text-[#E9E4DC] mb-3">{t("mktvid_upload_title")}</h2>
          <MarketingVideoImageGrid files={files} onChange={setFiles} disabled={busy} />
        </div>

        {(needsCategory || category) && (
          <div>
            <label className="block text-[12px] text-[#8A8A8E] mb-2" htmlFor="mktvid-category">
              {t("mktvid_category_label")}
            </label>
            <select
              id="mktvid-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={busy}
              className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0B0B0C] px-3 py-2.5 text-[13px] text-[#E9E4DC]"
              data-testid="mktvid-category-select"
            >
              <option value="">{t("mktvid_auto_category")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <p className="text-[12px] text-[#8A8A8E] mb-3">{t("mktvid_duration")}</p>
          <div className="flex flex-wrap gap-2" data-testid="mktvid-durations">
            {MARKETING_VIDEO_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                disabled={busy}
                onClick={() => setDuration(d)}
                className={`rp-pill min-w-[72px] ${duration === d ? "rp-pill-active" : ""}`}
                data-testid={`mktvid-dur-${d}`}
              >
                {d}s
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#C4B5FD] font-mono">{t("mktvid_cost", { n: cost })}</p>
          <p className="mt-2 text-[11px] text-[#6b6b70]">{t("mktvid_email_note")}</p>
        </div>

        {busy && (
          <div className="space-y-2" data-testid="mktvid-progress">
            <div className="h-1.5 rounded-full bg-[#2E2E30] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-500"
                style={{ width: `${Math.min(95, 8 + progress * 0.4)}%` }}
              />
            </div>
            <p className="text-[12px] text-[#C4B5FD]">{stageLabel}</p>
            <p className="text-[11px] text-[#6b6b70] font-mono">{t("mktvid_generating", { n: progress })}</p>
          </div>
        )}
      </div>

      <StudioGenerateBar
        ready={ready && !busy}
        busy={busy}
        onClick={generate}
        label={t("mktvid_generate")}
        busyLabel={stageLabel}
        hint={needsCategory && !category ? t("mktvid_pick_category") : hint}
        testId="mktvid-generate-btn"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />

      <section className="mt-10" data-testid="mktvid-history">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-medium text-[#E9E4DC]">{t("mktvid_history")}</h2>
          <button
            type="button"
            onClick={() => loadHistory()}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#8A8A8E] hover:text-[#C4B5FD]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
        {!history.length ? (
          <p className="text-[12px] text-[#6b6b70]">{t("mktvid_history_empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#141418] text-[#8A8A8E] uppercase tracking-wide text-[10px]">
                <tr>
                  <th className="px-3 py-2">{t("mktvid_col_date")}</th>
                  <th className="px-3 py-2">{t("mktvid_col_duration")}</th>
                  <th className="px-3 py-2">{t("mktvid_col_category")}</th>
                  <th className="px-3 py-2">{t("mktvid_col_credits")}</th>
                  <th className="px-3 py-2">{t("mktvid_col_status")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((job) => (
                  <tr key={job.id} className="border-t border-white/[0.06]">
                    <td className="px-3 py-2 text-[#E9E4DC] whitespace-nowrap">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">{job.duration ? `${job.duration}s` : "—"}</td>
                    <td className="px-3 py-2 capitalize">{job.category || "—"}</td>
                    <td className="px-3 py-2 font-mono">{job.credits_spent ?? "—"}</td>
                    <td className="px-3 py-2">{t(statusLabelKey(job.status))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </StudioCompactShell>
  );
}
