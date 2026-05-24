import { useMemo, useState } from "react";
import { Film, Loader2, Sparkles, Wand2 } from "lucide-react";
import { formatApiError, uploadPost } from "../../lib/api";
import { normalizeCreation, primaryResultUrl } from "../../lib/creationUrls";
import { useAuth } from "../../lib/auth";
import { usePricing } from "../../lib/PricingContext";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import StudioResultAnchor from "../../components/StudioResultAnchor";
import StudioGenerateBar from "../../components/StudioGenerateBar";
import ImageUploadZone from "../../components/ImageUploadZone";
import AspectPicker from "../../components/AspectPicker";
import { apiAspectRatio } from "../../lib/apiAspectRatio";

const ASPECTS = ["16:9", "9:16", "1:1", "4:5"];
const IDEA_KEYS = ["vid_idea_1", "vid_idea_2", "vid_idea_3", "vid_idea_4"];

export default function VideoGenerate() {
  const { t } = useI18n();
  const ideas = useMemo(() => IDEA_KEYS.map((k) => t(k)), [t]);
  const DURATIONS = useMemo(() => [
    { v: 4, label: "4s", desc: t("vid_dur_short") },
    { v: 6, label: "6s", desc: t("vid_dur_standard") },
    { v: 8, label: "8s", desc: t("vid_dur_cinematic") },
  ], [t]);
  const MOTIONS = useMemo(() => [
    { id: "cinematic", label: "Cinematic", desc: t("vid_motion_cinematic_desc") },
    { id: "dynamic", label: t("vid_motion_dynamic"), desc: t("vid_motion_dynamic_desc") },
    { id: "smooth", label: t("vid_motion_smooth"), desc: t("vid_motion_smooth_desc") },
    { id: "static", label: t("vid_motion_static"), desc: t("vid_motion_static_desc") },
  ], [t]);
  const { refresh, user } = useAuth();
  const { costs } = usePricing();
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState(6);
  const [motion, setMotion] = useState("cinematic");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = costs.video;
  const contentReady = prompt.trim().length >= 3;
  const creditsReady = (user?.credits ?? 0) >= cost || user?.is_unlimited;
  const canGenerate = contentReady && creditsReady && !busy;
  const generateHint = !contentReady
    ? t("studio_gen_hint_prompt")
    : !creditsReady
      ? t("vid_err_credits", { need: cost, have: user?.credits ?? 0 })
      : "";

  const generate = async () => {
    if (!canGenerate) {
      if (prompt.trim().length < 3) toast.error(t("vid_err_short"));
      else if ((user?.credits ?? 0) < cost) toast.error(t("vid_err_credits", { need: cost, have: user?.credits ?? 0 }));
      return;
    }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      const composed = `${prompt.trim()} — motion style: ${motion}, duration: ${duration}s`;
      fd.append("prompt", composed);
      fd.append("aspect_ratio", apiAspectRatio(aspect, { model: "video", hasPhoto: !!photo }));
      if (photo) fd.append("photo", photo);
      const { data } = await uploadPost("/generate/video", fd, { timeout: 300000 });
      const creation = normalizeCreation(data?.creation);
      if (!primaryResultUrl(creation)) throw new Error(t("vid_no_result"));
      setResult(creation);
      toast.success(t("vid_success", { n: creation?.credits_spent ?? cost }));
      await refresh();
    } catch (err) {
      toast.error(formatApiError(err, t("vid_fail")), { duration: 9000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10" data-testid="video-generate-panel">
      <div className="space-y-10">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED]">{t("vid_step_prompt")}</p>
            <span className="text-[#5A5A5E] text-[11px] font-mono">{prompt.length}/600</span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 600))}
            rows={5}
            placeholder={t("vid_prompt_placeholder")}
            className="rp-editor-textarea min-h-[130px]"
            data-testid="video-prompt"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {ideas.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setPrompt(idea)}
                className="rp-pill max-w-full !justify-start !normal-case !tracking-normal !font-['Inter_Tight'] !text-[12px] !font-normal"
                data-testid="video-idea"
              >
                <Sparkles className="w-3 h-3 shrink-0" /> {idea.slice(0, 36)}{idea.length > 36 ? "…" : ""}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_step_frame")}</p>
          <div className="max-w-[420px]">
            <ImageUploadZone
              value={photo}
              onChange={setPhoto}
              layout="video"
              testId="video-photo"
              emptyLabel={t("vid_start_label")}
              emptyHint={t("upload_drop")}
            />
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_step_format")}</p>
          <AspectPicker
            value={aspect}
            onChange={setAspect}
            options={ASPECTS}
            hasPhoto={!!photo}
            columns="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
            testIdPrefix="vid-ar"
          />
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_step_duration")}</p>
          <div className="grid grid-cols-3 gap-2.5 max-w-[480px]">
            {DURATIONS.map((d) => (
              <button
                key={d.v}
                type="button"
                onClick={() => setDuration(d.v)}
                data-testid={`vid-dur-${d.v}`}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  duration === d.v
                    ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
                    : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
                }`}
              >
                <p className="text-[#F4F1EA] text-[18px] font-light">{d.label}</p>
                <p className="text-[#8A8A8E] text-[11px]">{d.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("vid_step_motion")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MOTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMotion(m.id)}
                data-testid={`vid-motion-${m.id}`}
                className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                  motion === m.id
                    ? "border-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/15 to-[#7C3AED]/5 shadow-[0_0_28px_-10px_rgba(124,58,237,0.6)]"
                    : "border-[#2E2E30] bg-[#0F0F12] hover:border-[#5A5A5E]"
                }`}
              >
                <p className="text-[#F4F1EA] text-[14px] font-medium">{m.label}</p>
                <p className="text-[#8A8A8E] text-[11px] mt-1">{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <div>
          <StudioGenerateBar
            layout="inline"
            alignHint="center"
            ready={contentReady && creditsReady}
            busy={busy}
            onClick={generate}
            label={t("vid_render_btn", { n: cost })}
            busyLabel={t("vid_rendering")}
            hint={generateHint}
            testId="video-generate"
          />
          <p className="text-[#5A5A5E] text-[11px] mt-3 text-center font-mono uppercase tracking-[0.14em]">
            {t("vid_balance", { n: user?.credits ?? 0 })}
          </p>
        </div>
      </div>

      <StudioResultAnchor busy={busy} ready={Boolean(primaryResultUrl(result))} className="lg:sticky lg:top-[88px] self-start">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-4">{t("last_result")}</p>
        {result ? (
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("vid_loading")} />
        ) : (
          <div className="rounded-xl border border-[#2E2E30] bg-gradient-to-br from-[#13131A] to-[#0B0B0C] aspect-video flex flex-col items-center justify-center gap-3 p-6">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
            </div>
            <p className="text-[#F4F1EA] text-[14px] text-center max-w-[240px]">{t("vid_empty_preview")}</p>
            <p className="text-[#5A5A5E] text-[11px] font-mono uppercase tracking-[0.14em]">{aspect} · {duration}s · {motion}</p>
          </div>
        )}
      </StudioResultAnchor>
    </div>
  );
}
