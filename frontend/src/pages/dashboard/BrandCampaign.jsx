import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircle2, Globe, ImageIcon, Link2, Loader2, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, notifyCreationSucceeded, pollPrediction, uploadPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { isAdminUser } from "../../lib/isAdmin";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import useTitle from "../../lib/useTitle";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import BrandCampaignStylePanel from "../../components/brand-campaign/BrandCampaignStylePanel";
import MultiImageUpload from "../../components/studio/MultiImageUpload";
import {
  BRAND_CAMPAIGN_ASPECTS,
  computeBrandCampaignCost,
} from "../../lib/brandCampaign";
import { cn } from "../../lib/utils";

const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function buildInitialSlots(brief, count) {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    title: brief?.concepts?.[i]?.title || `Ad ${i + 1}`,
    status: "generating",
    url: null,
    error: null,
  }));
}

function notifyBatchResults(results = [], seen = new Set()) {
  for (const item of results) {
    const id = item.creation_id || item.prediction_id;
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    const creation = item.creation || {
      id,
      type: "poster",
      result_urls: item.url ? [item.url] : [],
      credits_spent: item.credits_spent || 0,
    };
    if (creation.result_urls?.length) {
      notifyCreationSucceeded(creation);
    }
  }
  return seen;
}

export default function BrandCampaign() {
  const { t, lang } = useI18n();
  const { user, refresh, loading } = useAuth();
  const { region, costs } = usePricing();
  useTitle(t("bc_title"));

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [aspect, setAspect] = useState("4:5");
  const [outputCount, setOutputCount] = useState(4);
  const [perImageCost, setPerImageCost] = useState(costs?.brandCampaignPerImage ?? costs?.posterPro ?? 40);
  const [brief, setBrief] = useState(null);
  const [results, setResults] = useState([]);
  const [slots, setSlots] = useState([]);
  const [styleCategories, setStyleCategories] = useState([]);
  const [stylePresetCount, setStylePresetCount] = useState(60);
  const [styleCategory, setStyleCategory] = useState("general");
  const [stylePresetMode, setStylePresetMode] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const progressTimerRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());

  const costInfo = useMemo(
    () => computeBrandCampaignCost(perImageCost, outputCount),
    [perImageCost, outputCount],
  );

  const hasSource = websiteUrl.trim().length > 8 || files.length > 0;

  const { ready, hint } = useStudioGenerateGate({
    user,
    cost: costInfo.total,
    readyOverride: hasSource,
    hintOverride: !hasSource ? t("bc_hint_source") : null,
  });

  const loadConfig = useCallback(async () => {
    try {
      const { data } = await api.get("/brand-campaign/config", {
        headers: { "x-pricing-region": region || "intl", "x-lang": lang || "pt" },
      });
      if (data?.per_image_cost) setPerImageCost(data.per_image_cost);
      if (data?.style_categories?.length) setStyleCategories(data.style_categories);
      if (data?.style_preset_count) setStylePresetCount(data.style_preset_count);
    } catch {
      /* defaults */
    }
  }, [region, lang]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
  }, []);

  const appendImagesToForm = (fd) => {
    files.forEach((file, i) => {
      fd.append(`image_${i}`, file);
    });
  };

  const handleFilesChange = useCallback((next) => {
    setFiles((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      return (Array.isArray(resolved) ? resolved : []).slice(0, 5);
    });
    setBrief(null);
  }, []);

  const analyzeBrand = async () => {
    const fd = new FormData();
    const url = websiteUrl.trim();
    if (url) fd.append("website_url", url);
    appendImagesToForm(fd);
    fd.append("lang", lang || "pt");
    if (user?.email) fd.append("notify_email", user.email);
    const { data } = await uploadPost("/brand-campaign/analyze", fd, {
      timeout: 180000,
      headers: { "X-Skip-Auto-Poll": "1" },
    });
    if (!data?.brief?.concepts?.length) {
      throw new Error(t("bc_err_analysis"));
    }
    setBrief({
      ...data.brief,
      site_read_method: data.site_read_method || data.brief?.site_read_method || "",
      uploaded_photos_count: data.uploaded_photos_count ?? data.brief?.uploaded_photos_count ?? files.length,
      vision_images_count: data.vision_images_count ?? data.brief?.vision_images_count ?? 0,
    });
    if (data?.per_image_cost) setPerImageCost(data.per_image_cost);
    return data.brief;
  };

  const startProgressTicker = (total) => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    const started = Date.now();
    const estMs = total * 120000;
    progressTimerRef.current = window.setInterval(() => {
      const pct = Math.min(95, Math.round(((Date.now() - started) / estMs) * 100));
      setProgress(pct);
    }, 1500);
  };

  const applyBatchResponse = (data, activeBrief, total) => {
    const ok = data?.results || [];
    const failed = data?.errors || [];
    const deferred = data?.pending || [];
    const nextSlots = buildInitialSlots(activeBrief, total).map((slot, i) => {
      const hit = ok.find((r) => r.concept_index === i);
      if (hit) {
        return { ...slot, status: "done", url: hit.url };
      }
      const queued = deferred.find((p) => p.concept_index === i);
      if (queued) {
        return { ...slot, status: "pending", predictionId: queued.prediction_id };
      }
      const miss = failed.find((e) => e.concept_index === i);
      if (miss) {
        return { ...slot, status: "error", error: miss.error };
      }
      return { ...slot, status: "error", error: t("bc_err_no_image", { n: i + 1 }) };
    });

    setSlots(nextSlots);
    setResults(ok.map((r) => ({ url: r.url, title: r.title || activeBrief.concepts?.[r.concept_index]?.title })));
    notifiedIdsRef.current = notifyBatchResults(ok, notifiedIdsRef.current);
    return { ok, failed, deferred, creditsSpent: data?.credits_spent || 0 };
  };

  const pollDeferredJobs = async (deferred, activeBrief) => {
    if (!deferred?.length) return { ok: [], failed: [] };

    setProgressLabel(t("bc_finishing_pending", { n: deferred.length }));

    const settled = await Promise.all(deferred.map(async (job) => {
      try {
        const polled = await pollPrediction(job.prediction_id, {
          credits_spent: job.credits_spent,
          type: "poster",
          timeoutMs: 600_000,
          onTick: () => {
            setProgressLabel(t("bc_generating_n", {
              current: job.concept_index + 1,
              total: costInfo.count,
            }));
          },
        });
        const url = polled?.creation?.result_urls?.[0];
        if (!url) throw new Error(t("bc_err_no_image", { n: job.concept_index + 1 }));

        const result = {
          url,
          title: job.title || activeBrief.concepts?.[job.concept_index]?.title,
          concept_index: job.concept_index,
          creation_id: polled.creation?.id || job.prediction_id,
          prediction_id: job.prediction_id,
          credits_spent: job.credits_spent,
          creation: polled.creation,
        };

        setSlots((prev) => prev.map((slot) => (
          slot.index === job.concept_index
            ? { ...slot, status: "done", url, error: null }
            : slot
        )));
        setResults((prev) => [...prev, { url, title: result.title }]);
        notifiedIdsRef.current = notifyBatchResults([result], notifiedIdsRef.current);
        return { ok: result, failed: null };
      } catch (err) {
        const message = formatApiError(err) || err?.message || t("bc_err_failed");
        setSlots((prev) => prev.map((slot) => (
          slot.index === job.concept_index
            ? { ...slot, status: "error", error: message }
            : slot
        )));
        return {
          ok: null,
          failed: {
            concept_index: job.concept_index,
            title: job.title,
            error: message,
          },
        };
      }
    }));

    const ok = settled.map((s) => s.ok).filter(Boolean);
    const failed = settled.map((s) => s.failed).filter(Boolean);
    return { ok, failed };
  };

  const generate = async () => {
    if (!hasSource) {
      toast.error(t("bc_hint_source"));
      return;
    }

    setBusy(true);
    setResults([]);
    setProgress(0);
    setProgressLabel(t("bc_analyzing"));
    notifiedIdsRef.current = new Set();

    const total = costInfo.count;

    try {
      let activeBrief = brief;
      if (!activeBrief?.concepts?.length) {
        activeBrief = await analyzeBrand();
      }

      setSlots(buildInitialSlots(activeBrief, total));
      setProgressLabel(t("bc_batch_running", { total }));
      startProgressTicker(total);

      const fd = new FormData();
      if (websiteUrl.trim()) fd.append("website_url", websiteUrl.trim());
      appendImagesToForm(fd);
      fd.append("brief", JSON.stringify(activeBrief));
      fd.append("output_count", String(total));
      fd.append("aspect_ratio", aspect);
      fd.append("lang", lang || "pt");
      fd.append("style_category", styleCategory);
      fd.append("style_preset", stylePresetMode);
      if (user?.email) fd.append("notify_email", user.email);

      const { data } = await uploadPost("/generate/brand-campaign-batch", fd, {
        timeout: 780000,
        headers: { "X-Skip-Auto-Poll": "1" },
      });

      const { ok, failed, deferred, creditsSpent } = applyBatchResponse(data, activeBrief, total);

      let allOk = [...ok];
      let allFailed = [...failed];

      if (deferred.length > 0) {
        const extra = await pollDeferredJobs(deferred, activeBrief);
        allOk = [...allOk, ...extra.ok];
        allFailed = [...allFailed, ...extra.failed];
      }

      await refresh();

      try {
        await api.post("/generations/repair");
      } catch {
        /* best effort — repõe galeria se pending completou no servidor */
      }

      setProgress(100);
      if (allOk.length === total) {
        toast.success(t("bc_done", { n: allOk.length, credits: creditsSpent }));
      } else if (allOk.length > 0) {
        toast.warning(t("bc_partial", { ok: allOk.length, total }), { duration: 10000 });
        toast.success(t("bc_view_gallery"), { duration: 8000 });
      } else {
        const firstErr = allFailed[0]?.error || t("bc_err_failed");
        throw new Error(firstErr);
      }
    } catch (err) {
      console.error("[BrandCampaign]", err);
      toast.error(formatApiError(err) || t("bc_err_failed"));
    } finally {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setBusy(false);
      setProgressLabel("");
    }
  };

  if (loading) {
    return (
      <StudioCompactShell testId="brand-campaign-page" maxWidth="960px">
        <div className="flex min-h-[40vh] items-center justify-center" data-testid="bc-loading">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" aria-hidden />
        </div>
      </StudioCompactShell>
    );
  }
  if (!isAdminUser(user)) {
    return <Navigate to="/app/tools" replace />;
  }

  const showSlots = busy || slots.length > 0;

  return (
    <StudioCompactShell testId="brand-campaign-page" maxWidth="960px">
      <header className="mb-5 md:mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-violet-400/90 mb-2">{t("bc_eyebrow")}</p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-xl md:text-2xl font-semibold text-[#EDEBE8] font-['Inter_Tight']">{t("bc_title")}</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {t("bc_admin_badge")}
          </span>
        </div>
        <p className="text-[14px] text-[#8A8A8E] leading-relaxed max-w-2xl">{t("bc_subtitle")}</p>
      </header>

      <section className="rp-editor-panel p-4 sm:p-5 mb-4 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] mb-2">
            <Globe className="w-3.5 h-3.5" />
            {t("bc_url_label")}
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b70]" />
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => { setWebsiteUrl(e.target.value); setBrief(null); }}
              placeholder={t("bc_url_placeholder")}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0B0C]/80 border border-white/[0.08] text-[#EDEBE8] text-sm placeholder:text-[#5A5A5E] focus:border-violet-500/50 focus:outline-none"
              data-testid="bc-url-input"
              disabled={busy}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[#6b6b70]">{t("bc_url_hint")}</p>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] mb-2">{t("bc_photos_label")}</p>
          <MultiImageUpload
            value={files}
            onChange={handleFilesChange}
            maxFiles={5}
            disabled={busy}
            testId="bc-upload"
            layout="wide"
            size="compact"
            emptyLabel={t("bc_photos_empty")}
            emptyHint={t("bc_photos_hint")}
          />
          {files.length > 0 && (
            <p className="mt-2 text-[11px] text-emerald-400/90" data-testid="bc-photos-ready">
              {t("bc_photos_ready", { n: files.length })}
            </p>
          )}
        </div>
      </section>

      {styleCategories.length > 0 && (
        <div className="mb-4">
          <BrandCampaignStylePanel
            categories={styleCategories}
            category={styleCategory}
            onCategoryChange={setStyleCategory}
            presetMode={stylePresetMode}
            onPresetModeChange={setStylePresetMode}
            disabled={busy}
            presetCount={stylePresetCount}
          />
        </div>
      )}

      <section className="rp-editor-panel p-4 sm:p-5 mb-4 space-y-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] mb-3">{t("bc_count_label")}</p>
          <div className="flex flex-wrap gap-2" data-testid="bc-count-picker">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={busy}
                onClick={() => setOutputCount(n)}
                className={cn(
                  "min-w-[2.5rem] h-10 px-3 rounded-xl text-sm font-semibold tabular-nums transition-all border",
                  outputCount === n
                    ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_20px_-6px_rgba(139,92,246,0.8)]"
                    : "bg-[#0B0B0C]/60 border-white/[0.08] text-[#8A8A8E] hover:text-white hover:border-white/20",
                )}
                data-testid={`bc-count-${n}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#6b6b70]">
            {t("bc_count_hint", { per: costInfo.perImage, total: costInfo.total })}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] mb-2">{t("bc_aspect_label")}</p>
          <div className="flex flex-wrap gap-2">
            {BRAND_CAMPAIGN_ASPECTS.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                disabled={busy}
                onClick={() => setAspect(id)}
                className={cn(
                  "px-3 py-2 rounded-lg text-[12px] font-medium border transition-all",
                  aspect === id
                    ? "bg-violet-600/20 border-violet-500/50 text-violet-200"
                    : "border-white/[0.08] text-[#8A8A8E] hover:text-white",
                )}
              >
                {t(labelKey)} ({id})
              </button>
            ))}
          </div>
        </div>
      </section>

      {user?.email && (
        <p className="mb-4 text-[11px] text-[#8A8A8E] leading-relaxed px-1" data-testid="bc-email-hint">
          {t("bc_notify_email")} — {t("bc_notify_email_hint")}
        </p>
      )}

      {brief && (
        <section className="rp-editor-panel p-4 sm:p-5 mb-4" data-testid="bc-brief-preview">
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 mb-2">{t("bc_brief_ready")}</p>
          <h2 className="text-lg font-semibold text-white mb-1">{brief.brand_name || t("bc_brand_unknown")}</h2>
          <p className="text-[13px] text-[#9CA3AF] mb-3">{brief.product_summary}</p>
          {brief.site_read_method && (
            <p className="text-[11px] text-emerald-400/80 mb-2">{t("bc_read_method", { method: brief.site_read_method })}</p>
          )}
          {(brief.vision_images_count > 0 || brief.uploaded_photos_count > 0) && (
            <p className="text-[11px] text-emerald-400/80 mb-2" data-testid="bc-vision-used">
              {t("bc_vision_used", {
                n: brief.vision_images_count || brief.uploaded_photos_count || files.length,
              })}
            </p>
          )}
          {brief.reference_image_urls?.length > 0 && (
            <p className="text-[11px] text-[#8A8A8E] mb-3">{t("bc_refs_found", { n: brief.reference_image_urls.length })}</p>
          )}
          {brief.color_palette?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {brief.color_palette.map((c) => (
                <span key={c} className="text-[11px] px-2 py-1 rounded-full bg-white/[0.06] text-[#C4B5FD] border border-white/10">
                  {c}
                </span>
              ))}
            </div>
          )}
          <ul className="space-y-1.5 text-[12px] text-[#8A8A8E]">
            {(brief.concepts || []).slice(0, outputCount).map((c, i) => (
              <li key={c.title || i} className="flex gap-2">
                <span className="text-violet-400 font-mono shrink-0">{i + 1}.</span>
                <span>{c.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showSlots && (
        <section className="mb-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-4" data-testid="bc-progress-slots">
          {busy && (
            <>
              <p className="text-[13px] text-violet-200 mb-2">{progressLabel}</p>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] mb-3">{t("bc_results")}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {slots.map((slot) => (
              <div
                key={slot.index}
                className={cn(
                  "rounded-xl overflow-hidden border bg-[#0E0E12]",
                  slot.status === "done" && "border-emerald-500/40",
                  slot.status === "error" && "border-red-500/40",
                  slot.status === "generating" && "border-violet-500/30",
                  slot.status === "pending" && "border-amber-500/40",
                )}
              >
                <div className="relative aspect-[4/5] bg-[#0B0B0C] flex items-center justify-center">
                  {slot.url ? (
                    <img src={slot.url} alt={slot.title} className="w-full h-full object-cover" />
                  ) : slot.status === "generating" || slot.status === "pending" ? (
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  ) : slot.status === "error" ? (
                    <XCircle className="w-8 h-8 text-red-400/80" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[#4b4b50]" />
                  )}
                  {slot.status === "done" && (
                    <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-emerald-400 drop-shadow" />
                  )}
                </div>
                <div className="px-2 py-2 space-y-0.5">
                  <p className="text-[10px] text-[#8A8A8E] truncate">{slot.title}</p>
                  <p className={cn(
                    "text-[10px] font-mono uppercase",
                    slot.status === "done" && "text-emerald-400",
                    slot.status === "error" && "text-red-400",
                    slot.status === "generating" && "text-violet-300",
                    slot.status === "pending" && "text-amber-300",
                  )}
                  >
                    {slot.status === "done" && t("bc_slot_done")}
                    {slot.status === "generating" && t("bc_slot_generating")}
                    {slot.status === "pending" && t("bc_slot_pending")}
                    {slot.status === "error" && (slot.error || t("bc_slot_error"))}
                    {slot.status === "waiting" && t("bc_slot_waiting")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {(results.length > 0 || busy) && (
            <p className="mt-3 text-[11px] text-[#8A8A8E]">
              {t("bc_gallery_hint")}{" "}
              <Link to="/app/gallery" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
                {t("bc_view_gallery")}
              </Link>
            </p>
          )}
        </section>
      )}

      <StudioGenerateBar
        ready={ready}
        busy={busy}
        onClick={generate}
        label={t("bc_generate", { n: outputCount })}
        busyLabel={progressLabel || t("bc_generating")}
        hint={hint}
        cost={costInfo.total}
        costMeta={(
          <StudioGenerateCostMeta
            cost={costInfo.total}
            user={user}
            extra={`${outputCount}× ${costInfo.perImage} cr`}
          />
        )}
        testId="bc-generate"
        icon={Sparkles}
      />
    </StudioCompactShell>
  );
}
