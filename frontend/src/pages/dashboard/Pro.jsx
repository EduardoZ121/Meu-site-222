import { useEffect, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

export default function Pro() {
  const { t } = useI18n();
  useTitle(t("sidebar_pro"));
  const { refresh, user } = useAuth();
  const [presets, setPresets] = useState([]);
  const [category, setCategory] = useState("realism");
  const [preset, setPreset] = useState("ultra_real");
  const [aspect, setAspect] = useState("4:5");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/public/pro-presets").then((r) => setPresets(r.data.presets || []));
  }, []);

  const cats = ["realism", "mood", "enhance"];
  const filtered = presets.filter((p) => p.category === category);
  const cost = 18;

  const generate = async () => {
    if (!photo) { toast.error(t("pro_no_photo")); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("preset_id", preset);
      fd.append("aspect_ratio", aspect);
      const { data } = await api.post("/generate/pro", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data.creation);
      toast.success(t("gen_done", { n: data.creation.credits_spent }));
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("failed"));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="pro-page">
      <p className="eyebrow mb-3">{t("pro_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("pro_title_a")} <span className="italic text-rp-lavender">{t("pro_title_b")}</span>{t("pro_title_dot")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("pro_photo_label")}</label>
          <div className="max-w-[420px] mb-10">
            <PhotoUpload value={photo} onChange={setPhoto} testId="pro-photo" />
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("pro_direction")}</label>
          <div className="flex gap-2 mb-5">
            {cats.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.16em] ${category === c ? "border-rp-purple text-rp-lavender" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`procat-${c}`}>{t(`cat_${c}`)}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setPreset(p.id)} className={`text-left p-4 border transition-all ${preset === p.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`} data-testid={`preset-${p.id}`}>
                <p className="font-heading text-base text-rp-text mb-1">{p.nome || p.label}</p>
                <p className="text-[10px] font-mono text-rp-mute2 uppercase tracking-[0.14em]">{t(`cat_${p.category}`)}</p>
              </button>
            ))}
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("aspect_ratio")}</label>
          <div className="flex flex-wrap gap-2 mb-10">
            {["1:1", "4:5", "3:2", "9:16", "16:9", "21:9", "3:4"].map((a) => (
              <button key={a} onClick={() => setAspect(a)} className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.12em] ${aspect === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`pro-aspect-${a}`}>{a}</button>
            ))}
          </div>

          <button onClick={generate} disabled={busy || !photo || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50" data-testid="pro-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t("pro_loading")}</>) : (<><Camera className="w-4 h-4" /> {t("pro_button")} · {cost} {t("credits")}</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">{t("last_result")}</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("pro_empty")} />
        </aside>
      </div>
    </div>
  );
}
