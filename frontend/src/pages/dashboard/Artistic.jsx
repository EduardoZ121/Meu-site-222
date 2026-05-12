import { useEffect, useState } from "react";
import { Palette, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

export default function Artistic() {
  const { t } = useI18n();
  useTitle(t("sidebar_artistic"));
  const { refresh, user } = useAuth();
  const [styles, setStyles] = useState([]);
  const [style, setStyle] = useState("oil_paint");
  const [photo, setPhoto] = useState(null);
  const [aspect, setAspect] = useState("1:1");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/public/artistic-styles").then((r) => setStyles(r.data.styles || []));
  }, []);

  const cost = 13;

  const generate = async () => {
    if (!photo) { toast.error(t("art_no_photo")); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("style_id", style);
      fd.append("aspect_ratio", aspect);
      fd.append("extra_prompt", extra);
      const { data } = await api.post("/generate/artistic", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data.creation);
      toast.success(t("gen_done", { n: data.creation.credits_spent }));
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("failed"));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="artistic-page">
      <p className="eyebrow mb-3">{t("art_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("art_title_a")} <span className="italic text-rp-lavender">{t("art_title_b")}</span>{t("art_title_dot")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("pro_photo_label")}</label>
          <div className="max-w-[420px] mb-10">
            <PhotoUpload value={photo} onChange={setPhoto} testId="artistic-photo" />
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("art_style_label")}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-10 max-h-[440px] overflow-y-auto pr-1" data-testid="artistic-styles-grid">
            {styles.map((s) => (
              <button key={s.id} onClick={() => setStyle(s.id)} className={`p-3 border text-left transition-all ${style === s.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`} data-testid={`art-${s.id}`}>
                <p className="font-heading text-sm text-rp-text leading-tight">{s.label}</p>
              </button>
            ))}
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("art_extra_label")}</label>
          <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={t("art_extra_placeholder")} className="field-input mb-10" data-testid="artistic-extra" />

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("aspect_ratio")}</label>
          <div className="flex flex-wrap gap-2 mb-10">
            {["1:1", "4:5", "3:2", "9:16", "16:9"].map((a) => (
              <button key={a} onClick={() => setAspect(a)} className={`px-4 py-2 border text-[11px] font-mono uppercase ${aspect === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`}>{a}</button>
            ))}
          </div>

          <button onClick={generate} disabled={busy || !photo || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50" data-testid="artistic-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t("art_loading")}</>) : (<><Palette className="w-4 h-4" /> {t("art_button")} · {cost} {t("credits")}</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">{t("last_result")}</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("art_empty")} />
        </aside>
      </div>
    </div>
  );
}
