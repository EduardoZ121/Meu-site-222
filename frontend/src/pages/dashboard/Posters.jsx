import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

export default function Posters() {
  useTitle("Posters");
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
      const firstMusic = (r.data.templates || []).find((t) => t.category === "music");
      if (firstMusic) setPicked(firstMusic);
    });
  }, []);

  useEffect(() => {
    if (picked) setValues({});
  }, [picked]);

  const cats = ["music", "events", "before_after", "editorial", "promo"];
  const filtered = templates.filter((t) => t.category === category);
  const cost = 15;

  const generate = async () => {
    if (!picked) return;
    if (picked.placeholders.some((p) => !values[p])) {
      toast.error("Fill every placeholder first."); return;
    }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/generate/poster", { template_id: picked.id, placeholders: values });
      setResult(data.creation);
      toast.success(`Done — ${data.creation.credits_spent} credits.`);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Poster failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="posters-page">
      <p className="eyebrow mb-3">Posters · 44</p>
      <h1 className="heading-xl mb-10">A <span className="italic text-rp-lavender">poster</span>, in minutes.</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Category</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {cats.map((c) => (
              <button key={c} onClick={() => { setCategory(c); setPicked(templates.find((t) => t.category === c) || null); }} className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.16em] ${category === c ? "border-rp-purple text-rp-lavender" : "border-rp-border text-rp-mute hover:text-rp-text"}`} data-testid={`postercat-${c}`}>
                {c.replace("_", "/")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10 max-h-[280px] overflow-y-auto pr-1" data-testid="poster-templates">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => setPicked(t)} className={`p-3 border text-left ${picked?.id === t.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`} data-testid={`tpl-${t.id}`}>
                <p className="font-heading text-sm text-rp-text">{t.label}</p>
              </button>
            ))}
          </div>

          {picked && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-4">Fill in the blanks</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {picked.placeholders.map((p) => (
                  <input key={p} value={values[p] || ""} onChange={(e) => setValues({ ...values, [p]: e.target.value })} placeholder={p.replace(/_/g, " ")} className="field-input !py-2.5" data-testid={`field-${p}`} />
                ))}
              </div>
            </>
          )}

          <button onClick={generate} disabled={busy || !picked || (user?.credits ?? 0) < cost} className="btn-primary w-full disabled:opacity-50" data-testid="poster-generate">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Designing…</>) : (<><FileText className="w-4 h-4" /> Design · {cost} credits</>)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">Last poster</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="Pick a template, fill in." />
        </aside>
      </div>
    </div>
  );
}
