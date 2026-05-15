import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

export default function Posters() {
  const { t } = useI18n();
  useTitle(t("sidebar_posters"));
  const { refresh, user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState("music");
  const [picked, setPicked] = useState(null);
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/public/poster-templates").then((r) => {
      setTemplates(r.data.templates || []);
      const firstMusic = (r.data.templates || []).find((tpl) => tpl.category === "music");
      if (firstMusic) setPicked(firstMusic);
    });
  }, []);

  useEffect(() => { if (picked) setValues({}); }, [picked]);

  const cats = ["music", "events", "before_after", "editorial", "promo"];
  const filtered = templates.filter((tpl) => tpl.category === category);
  const cost = 15;

  const generate = async () => {
    if (!picked) return;
    if (picked.placeholders.some((p) => !values[p])) {
      toast.error(t("post_fill_first")); return;
    }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/generate/poster", { template_id: picked.id, placeholders: values });
      setResult(data.creation);
      toast.success(t("gen_done", { n: data.creation.credits_spent }));
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("failed"));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="posters-page">
      <p className="eyebrow mb-3">{t("post_eyebrow")}</p>
      <h1 className="heading-xl mb-10">{t("post_title_a")} <span className="italic text-rp-lavender">{t("post_title_b")}</span>{t("post_title_dot")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("post_category")}</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {cats.map((c) => (
              <button key={c} onClick={() => { setCategory(c); setPicked(templates.find((tpl) => tpl.category === c) || null); }} className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.16em] ${category === c ? "border-rp-purple text-rp-lavender" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`postercat-${c}`}>
                {t(`cat_${c}`)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10 max-h-[280px] overflow-y-auto pr-1" data-testid="poster-templates">
            {filtered.map((tpl) => (
              <button key={tpl.id} onClick={() => setPicked(tpl)} className={`p-3 border text-left ${picked?.id === tpl.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`} data-testid={`tpl-${tpl.id}`}>
                <p className="font-heading text-sm text-rp-text">{tpl.label}</p>
              </button>
            ))}
          </div>

          {picked && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-4">{t("post_fill")}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {picked.placeholders.map((p) => (
                  <input key={p} value={values[p] || ""} onChange={(e) => setValues({ ...values, [p]: e.target.value })} placeholder={p.replace(/_/g, " ")} className="field-input !py-2.5" data-testid={`field-${p}`} />
                ))}
              </div>
            </>
          )}

          <button onClick={generate} disabled={busy || !picked || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50" data-testid="poster-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t("post_loading")}</>) : (<><FileText className="w-4 h-4" /> {t("post_button")} · {cost} {t("credits")}</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">{t("last_result")}</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel={t("post_empty")} />
        </aside>
      </div>
    </div>
  );
}
