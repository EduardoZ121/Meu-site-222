import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Sparkles, SlidersHorizontal } from "lucide-react";
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
import MarketingVideoImageGrid from "../../components/marketing-video/MarketingVideoImageGrid";
import MarketingVideoOptions from "../../components/marketing-video/MarketingVideoOptions";
import {
  MARKETING_VIDEO_DURATION,
  MARKETING_VIDEO_STAGE_KEYS,
  computeMarketingVideoCostFromPricing,
  statusLabelKey,
} from "../../lib/marketingVideo";

function ModeToggle({ mode, onChange, disabled, t }) {
  return (
    <div
      className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0B0B0C]/80 border border-white/[0.08]"
      data-testid="mktvid-mode-toggle"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("quick")}
        className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-all ${
          mode === "quick"
            ? "bg-violet-600 text-white"
            : "text-[#8A8A8E] hover:text-[#E9E4DC]"
        }`}
        data-testid="mktvid-mode-quick"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {t("mktvid_mode_quick")}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("custom")}
        className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-all ${
          mode === "custom"
            ? "bg-violet-600 text-white"
            : "text-[#8A8A8E] hover:text-[#E9E4DC]"
        }`}
        data-testid="mktvid-mode-custom"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {t("mktvid_mode_custom")}
      </button>
    </div>
  );
}

export default function MarketingVideo() {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const { region } = usePricing();
  useTitle(t("mktvid_title"));

  const [mode, setMode] = useState("quick");
  const [files, setFiles] = useState([]);
  const [formatId, setFormatId] = useState("tiktok");
  const [formats, setFormats] = useState([]);
  const [pricing, setPricing] = useState({ 15: 240 });
  const [categories, setCategories] = useState([]);
  const [visualStyles, setVisualStyles] = useState([]);
  const [category, setCategory] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  const cost = useMemo(() => computeMarketingVideoCostFromPricing(pricing), [pricing]);

  const { ready, hint } = useStudioGenerateGate({
    user,
    cost,
    requirePhoto: true,
    photo: files[0] || null,
  });

  const loadConfig = useCallback(async () => {
    try {
      const { data } = await api.get("/marketing-video/config", {
        headers: { "x-pricing-region": region || "intl", "x-lang": lang || "pt" },
      });
      if (data?.pricing) setPricing(data.pricing);
      if (data?.categories) setCategories(data.categories);
      if (data?.visual_styles) setVisualStyles(data.visual_styles);
      if (data?.formats?.length) setFormats(data.formats);
      if (data?.default_format) setFormatId((prev) => prev || data.default_format);
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
      fd.append("duration", String(MARKETING_VIDEO_DURATION));
      fd.append("format", formatId);
      fd.append("lang", lang || "pt");
      fd.append("mode", mode);
      if (mode === "custom") {
        if (category) fd.append("category", category);
        if (visualStyle) fd.append("visual_style", visualStyle);
      }
      fd.append("notify_by_email", "1");
      if (user?.email) fd.append("notify_email", user.email);

      ({ data: submitData } = await uploadPost("/generate/marketing-video", fd, {
        timeout: 120000,
        headers: { "X-Skip-Auto-Poll": "1" },
      }));

      trackPendingPrediction(submitData.prediction_id, {
        credits_spent: submitData.credits_spent || cost,
        type: "marketing_video",
      });

      toast.success(t("mktvid_success"));
      await refresh();
      await loadHistory();
    } catch (err) {
      toast.error(formatApiError(err, t("mktvid_fail"), { t }), { duration: 9000 });
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
    <StudioCompactShell testId="marketing-video-page" className="pb-4 md:pb-8">
      <div className="mb-3 md:mb-4 space-y-2">
        <ModeToggle mode={mode} onChange={setMode} disabled={busy} t={t} />
        <p className="hidden sm:block text-[11px] text-[#6b6b70]">
          {mode === "quick" ? t("mktvid_mode_quick_desc") : t("mktvid_mode_custom_desc")}
        </p>
      </div>

      <div className="rounded-xl md:rounded-2xl border border-white/[0.08] bg-[#141418]/80 p-3 md:p-5 space-y-3 md:space-y-4 mb-4">
        <MarketingVideoImageGrid files={files} onChange={setFiles} disabled={busy} />

        <MarketingVideoOptions
          mode={mode}
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          visualStyles={visualStyles}
          visualStyle={visualStyle}
          onVisualStyleChange={setVisualStyle}
          formats={formats}
          formatId={formatId}
          onFormatChange={setFormatId}
          cost={cost}
          busy={busy}
        />

        {busy && (
          <div className="space-y-1.5" data-testid="mktvid-progress">
            <div className="h-1 rounded-full bg-[#2E2E30] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-500"
                style={{ width: `${Math.min(95, 8 + progress * 0.4)}%` }}
              />
            </div>
            <p className="text-[11px] text-[#C4B5FD]">{stageLabel}</p>
          </div>
        )}
      </div>

      <StudioGenerateBar
        ready={ready && !busy}
        busy={busy}
        onClick={generate}
        label={t("mktvid_generate")}
        busyLabel={t("mktvid_generating_bg")}
        hint={hint}
        testId="mktvid-generate-btn"
        costMeta={<StudioGenerateCostMeta cost={cost} user={user} />}
      />

      <details className="mt-6 md:mt-8 group" data-testid="mktvid-history">
        <summary className="flex items-center justify-between gap-2 cursor-pointer list-none py-1">
          <span className="text-[12px] font-medium text-[#E9E4DC]">{t("mktvid_history")}</span>
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
            <p className="text-[11px] text-[#6b6b70]">{t("mktvid_history_empty")}</p>
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
