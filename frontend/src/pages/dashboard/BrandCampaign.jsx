import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, pollPrediction, uploadPost } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { usePricing } from "../../lib/PricingContext";
import useTitle from "../../lib/useTitle";
import StudioCompactShell from "../../components/studio/StudioCompactShell";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import StudioGenerateCostMeta from "../../components/StudioGenerateCostMeta";
import { useStudioGenerateGate } from "../../lib/useStudioGenerateGate";
import MultiImageUpload from "../../components/studio/MultiImageUpload";
import {
  BRAND_CAMPAIGN_ASPECTS,
  BRAND_CAMPAIGN_MAX,
  computeBrandCampaignCost,
} from "../../lib/brandCampaign";
import { cn } from "../../lib/utils";

const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function BrandCampaign() {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const { region, costs } = usePricing();
  useTitle(t("bc_title"));

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [aspect, setAspect] = useState("4:5");
  const [outputCount, setOutputCount] = useState(4);
  const [perImageCost, setPerImageCost] = useState(costs?.brandCampaignPerImage ?? costs?.posterPro ?? 40);
  const [brief, setBrief] = useState(null);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

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
    } catch {
      /* defaults */
    }
  }, [region, lang]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const appendImagesToForm = (fd) => {
    files.forEach((file, i) => {
      fd.append(`image_${i}`, file);
    });
  };

  const analyzeBrand = async () => {
    const fd = new FormData();
    if (websiteUrl.trim()) fd.append("website_url", websiteUrl.trim());
    appendImagesToForm(fd);
    fd.append("lang", lang || "pt");
    const { data } = await uploadPost("/brand-campaign/analyze", fd, {
      timeout: 120000,
      headers: { "X-Skip-Auto-Poll": "1" },
    });
    setBrief(data.brief);
    if (data?.per_image_cost) setPerImageCost(data.per_image_cost);
    return data.brief;
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

    const urls = [];
    let creditsSpent = 0;

    try {
      let activeBrief = brief;
      if (!activeBrief?.concepts?.length) {
        activeBrief = await analyzeBrand();
      }

      setProgressLabel(t("bc_generating"));
      const n = costInfo.count;

      for (let i = 0; i < n; i += 1) {
        setProgressLabel(t("bc_generating_n", { current: i + 1, total: n }));
        setProgress(Math.round((i / n) * 100));

        const fd = new FormData();
        if (websiteUrl.trim()) fd.append("website_url", websiteUrl.trim());
        appendImagesToForm(fd);
        fd.append("brief", JSON.stringify(activeBrief));
        fd.append("concept_index", String(i));
        fd.append("aspect_ratio", aspect);
        fd.append("lang", lang || "pt");

        // eslint-disable-next-line no-await-in-loop
        const { data } = await uploadPost("/generate/brand-campaign", fd, {
          timeout: 240000,
          pollTimeoutMs: 240000,
          onPollTick: (sec) => {
            const slice = 100 / n;
            setProgress(Math.min(99, Math.round((i / n) * 100 + (sec / 90) * slice)));
          },
        });

        let url = data?.creation?.result_urls?.[0];
        if (!url && data?.prediction_id) {
          // eslint-disable-next-line no-await-in-loop
          const polled = await pollPrediction(data.prediction_id, {
            credits_spent: data.credits_spent,
            type: "image",
          });
          url = polled?.creation?.result_urls?.[0] || polled?.output?.[0];
        }
        if (!url) throw new Error(t("bc_err_no_image", { n: i + 1 }));

        urls.push({
          url,
          title: activeBrief.concepts?.[i]?.title || `Ad ${i + 1}`,
        });
        creditsSpent += data?.credits_spent || costInfo.perImage;
        // eslint-disable-next-line no-await-in-loop
        await refresh();
      }

      setProgress(100);
      setResults(urls);
      toast.success(t("bc_done", { n: urls.length, credits: creditsSpent }));
    } catch (err) {
      console.error("[BrandCampaign]", err);
      toast.error(formatApiError(err) || t("bc_err_failed"));
    } finally {
      setBusy(false);
      setProgressLabel("");
    }
  };

  return (
    <StudioCompactShell testId="brand-campaign-page" maxWidth="960px">
      <header className="mb-5 md:mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-violet-400/90 mb-2">{t("bc_eyebrow")}</p>
        <h1 className="text-xl md:text-2xl font-semibold text-[#EDEBE8] font-['Inter_Tight'] mb-2">{t("bc_title")}</h1>
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
            onChange={(next) => { setFiles(next.slice(0, 5)); setBrief(null); }}
            maxFiles={5}
            disabled={busy}
            testId="bc-upload"
            layout="wide"
            size="compact"
            emptyLabel={t("bc_photos_empty")}
            emptyHint={t("bc_photos_hint")}
          />
        </div>
      </section>

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

      {brief && (
        <section className="rp-editor-panel p-4 sm:p-5 mb-4" data-testid="bc-brief-preview">
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 mb-2">{t("bc_brief_ready")}</p>
          <h2 className="text-lg font-semibold text-white mb-1">{brief.brand_name || t("bc_brand_unknown")}</h2>
          <p className="text-[13px] text-[#9CA3AF] mb-3">{brief.product_summary}</p>
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

      {busy && (
        <div className="mb-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
          <p className="text-[13px] text-violet-200 mb-2">{progressLabel}</p>
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <section className="mb-6" data-testid="bc-results">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] mb-3">{t("bc_results")}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {results.map((item, i) => (
              <figure key={item.url} className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0E0E12]">
                <img src={item.url} alt={item.title} className="w-full aspect-[4/5] object-cover" />
                <figcaption className="px-2 py-1.5 text-[10px] text-[#8A8A8E] truncate">{item.title}</figcaption>
              </figure>
            ))}
          </div>
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
