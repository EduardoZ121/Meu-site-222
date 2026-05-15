import { useState } from "react";
import { Layers, Plus, Trash2, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";

const COST_PER_SLIDE = 8;

export default function CarouselPage() {
  const { t } = useI18n();
  useTitle(t("sidebar_carousel"));
  const { refresh, user } = useAuth();
  const [slides, setSlides] = useState(["", ""]);
  const [styleSuffix, setStyleSuffix] = useState("editorial magazine photography, cinematic light");
  const [aspect, setAspect] = useState("4:5");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const totalCost = slides.length * COST_PER_SLIDE;

  const addSlide = () => slides.length < 5 && setSlides([...slides, ""]);
  const removeSlide = (i) => slides.length > 2 && setSlides(slides.filter((_, idx) => idx !== i));
  const updateSlide = (i, v) => setSlides(slides.map((s, idx) => idx === i ? v : s));

  const generate = async () => {
    if (slides.some((s) => s.trim().length < 3)) { toast.error(t("car_each_needs")); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/generate/carousel", { slides, style_suffix: styleSuffix, aspect_ratio: aspect });
      setResult(data.creation);
      toast.success(t("gen_done", { n: data.creation.credits_spent }));
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("failed"));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="carousel-page">
      <p className="eyebrow mb-3">{t("car_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("car_title_a")} <span className="italic text-rp-lavender">{t("car_title_b")}</span>{t("car_title_dot")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("car_slides")}</label>
          <div className="space-y-3 mb-6" data-testid="carousel-slides">
            {slides.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-mono text-[11px] text-rp-mute2 w-7 pt-3.5">{String(i + 1).padStart(2, "0")}</span>
                <textarea value={s} onChange={(e) => updateSlide(i, e.target.value)} rows={2} placeholder={t("car_slide_placeholder", { n: i + 1 })} className="field-input flex-1 resize-none" data-testid={`slide-${i}`} />
                {slides.length > 2 && (
                  <button onClick={() => removeSlide(i)} className="text-rp-mute hover:text-red-400 pt-3.5" data-testid={`slide-remove-${i}`}><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          {slides.length < 5 && (
            <button onClick={addSlide} className="btn-secondary mb-10" data-testid="slide-add"><Plus className="w-3.5 h-3.5" /> {t("car_add")}</button>
          )}

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("car_continuity")}</label>
          <input value={styleSuffix} onChange={(e) => setStyleSuffix(e.target.value)} placeholder={t("car_continuity_placeholder")} className="field-input mb-10" data-testid="carousel-style" />

          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("aspect_ratio")}</label>
          <div className="flex flex-wrap gap-2 mb-10">
            {["4:5", "1:1", "9:16"].map((a) => (
              <button key={a} onClick={() => setAspect(a)} className={`px-4 py-2 border text-[11px] font-mono uppercase ${aspect === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`}>{a}</button>
            ))}
          </div>

          <button onClick={generate} disabled={busy || (user?.credits ?? 0) < totalCost} className="btn-primary w-full disabled:opacity-50" data-testid="carousel-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t("car_loading", { n: slides.length })}</>) : (<><Layers className="w-4 h-4" /> {t("car_button")} · {totalCost} {t("credits")}</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">{t("last_result")}</p>
          {!result ? (
            <div className="card-rp p-10 aspect-square flex items-center justify-center text-center">
              {busy ? <Loader2 className="w-6 h-6 text-rp-lavender animate-spin" /> : <p className="text-rp-mute text-sm">{t("car_empty")}</p>}
            </div>
          ) : (
            <div className="card-rp p-3 space-y-1" data-testid="carousel-result">
              {result.result_urls.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer" className="block aspect-[4/5] overflow-hidden">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
