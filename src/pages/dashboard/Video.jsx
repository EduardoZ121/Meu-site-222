import { useState } from "react";
import { Film, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

export default function Video() {
  const { t } = useI18n();
  useTitle(t("sidebar_video"));
  const { refresh, user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("16:9");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const cost = 20;

  const generate = async () => {
    if (prompt.trim().length < 3) { toast.error(t("vid_describe_motion")); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("prompt", prompt);
      fd.append("aspect_ratio", aspect);
      if (photo) fd.append("photo", photo);
      const { data } = await api.post("/generate/video", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data.creation);
      toast.success(t("gen_done", { n: data.creation.credits_spent }));
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("failed"));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="video-page">
      <p className="eyebrow mb-3">{t("vid_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("vid_title_a")} <span className="italic text-rp-lavender">{t("vid_title_b")}</span>{t("vid_title_dot")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("vid_prompt_label")}</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} placeholder={t("vid_prompt_placeholder")} className="field-input resize-none mb-8" data-testid="video-prompt" />

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("vid_start_label")}</label>
          <div className="max-w-[320px] mb-10">
            <PhotoUpload value={photo} onChange={setPhoto} testId="video-photo" />
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("aspect_ratio")}</label>
          <div className="flex flex-wrap gap-2 mb-10">
            {["16:9", "9:16", "1:1", "4:5"].map((a) => (
              <button key={a} onClick={() => setAspect(a)} className={`px-4 py-2 border text-[11px] font-mono uppercase ${aspect === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`}>{a}</button>
            ))}
          </div>

          <button onClick={generate} disabled={busy || prompt.length < 3 || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50" data-testid="video-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t("vid_loading")}</>) : (<><Film className="w-4 h-4" /> {t("vid_button")} · {cost} {t("credits")}</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">{t("last_result")}</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("vid_empty")} />
        </aside>
      </div>
    </div>
  );
}
