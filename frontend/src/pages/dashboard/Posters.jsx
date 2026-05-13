import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

const CAT_LABELS = {
  music: "Música",
  events: "Eventos",
  before_after: "Before / After",
  editorial: "Editorial",
  promo: "Promo",
};

// Friendlier field labels (Portuguese), fallback to underscores → spaces
const FIELD_LABELS = {
  artist_name: "Nome do artista",
  tour_name: "Nome da tour",
  album_name: "Nome do álbum",
  event_name: "Nome do evento",
  event_date: "Data do evento",
  venue: "Venue / Local",
  city: "Cidade",
  date: "Data",
  date_range: "Período (datas)",
  brand_name: "Marca",
  product: "Produto",
  campaign: "Campanha",
  title: "Título",
  subtitle: "Subtítulo",
  tagline: "Slogan",
  topic: "Tema",
  category: "Categoria",
  additional_text: "Texto adicional",
  before_label: "Texto 'antes'",
  after_label: "Texto 'depois'",
};

const labelFor = (k) => FIELD_LABELS[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isLong = (k) => /text|description|tagline|story|notes|additional/i.test(k);

export default function Posters() {
  useTitle("Pôsteres");
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState("music");
  const [picked, setPicked] = useState(null);
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/public/poster-templates").then((r) => setTemplates(r.data.templates || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => templates.filter((t) => t.category === category), [templates, category]);
  const cost = 15;

  const missing = picked ? picked.placeholders.filter((p) => !(values[p] || "").trim()) : [];

  const generate = async () => {
    if (!picked) { toast.error("Escolhe um template."); return; }
    if (missing.length) { toast.error(`Preenche: ${missing.map(labelFor).join(", ")}`); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/generate/poster", { template_id: picked.id, placeholders: values }, { timeout: 180000 });
      setResult(data.creation);
      toast.success(`Pôster pronto · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      const m = err?.response?.data?.detail || err?.message || "Falhou.";
      toast.error(typeof m === "string" ? m : "Falhou.");
    } finally { setBusy(false); }
  };

  if (picked) {
    // ──────── EDITOR (after picking a template) ────────
    return (
      <div className="max-w-[1400px] mx-auto pb-32" data-testid="posters-editor">
        <button onClick={() => setPicked(null)} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium" data-testid="posters-back-to-grid">
          <ArrowLeft className="w-4 h-4" /> Voltar aos templates
        </button>

        <h1 className="text-[#F4F1EA] text-[32px] md:text-[40px] font-light tracking-[-0.02em] mb-3 font-['Inter_Tight']">{picked.label || picked.id}</h1>
        <p className="text-[#8A8A8E] text-[15px] mb-10 max-w-[640px]">Preenche os campos abaixo. O pôster é gerado em alta qualidade pronto a partilhar.</p>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
          <div className="space-y-5">
            <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em]">Detalhes do pôster</p>
            {picked.placeholders.map((p) => (
              <div key={p}>
                <label className="block text-[#F4F1EA] text-[13px] font-medium mb-2 font-['Inter_Tight']">
                  {labelFor(p)} <span className="text-[#7C3AED]">*</span>
                </label>
                {isLong(p) ? (
                  <textarea
                    rows={3}
                    value={values[p] || ""}
                    onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                    placeholder={`Ex: ${labelFor(p)}...`}
                    className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-md focus:outline-none resize-none font-['Inter_Tight']"
                    data-testid={`field-${p}`}
                  />
                ) : (
                  <input
                    value={values[p] || ""}
                    onChange={(e) => setValues({ ...values, [p]: e.target.value })}
                    placeholder={`Ex: ${labelFor(p)}...`}
                    className="w-full bg-[#13131A] border border-[#2E2E30] focus:border-[#7C3AED] text-[#F4F1EA] text-[14px] placeholder:text-[#5A5A5E] px-4 py-3 rounded-md focus:outline-none font-['Inter_Tight']"
                    data-testid={`field-${p}`}
                  />
                )}
              </div>
            ))}
          </div>

          <aside className="xl:sticky xl:top-[80px] self-start">
            <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">Preview</p>
            <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="O pôster aparece aqui." />
          </aside>
        </div>

        <motion.div className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C] to-[#0B0B0C]/95 backdrop-blur-xl border-t border-[#2E2E30] z-30 px-4 sm:px-6 md:px-10 py-4">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:flex items-center gap-3 text-[12px]">
              <span className="text-[#8A8A8E]">Credits required:</span>
              <span className="text-[#C4B5FD] font-medium text-[16px]">{cost}</span>
              <span className="text-[#5A5A5E] mx-2">·</span>
              <span className="text-[#8A8A8E]">Saldo:</span>
              <span className="text-[#F4F1EA] font-medium">{user?.credits ?? 0}</span>
            </div>
            <button
              onClick={generate}
              disabled={busy || missing.length > 0}
              className="flex-1 sm:flex-initial sm:min-w-[220px] bg-[#7C3AED] hover:bg-[#9333EA] disabled:bg-[#2E2E30] disabled:text-[#5A5A5E] text-white py-3.5 rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/20"
              data-testid="poster-generate"
            >
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> A gerar...</> : <><Sparkles className="w-4 h-4" /> Gerar pôster · {cost} créditos</>}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ──────── GRID (default) ────────
  return (
    <div className="max-w-[1400px] mx-auto" data-testid="posters-page">
      <button onClick={() => navigate("/app/tools")} className="inline-flex items-center gap-2 text-[#8A8A8E] hover:text-[#F4F1EA] mb-6 text-[12px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar às ferramentas
      </button>

      <header className="mb-10">
        <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-3">Pôsteres</p>
        <h1 className="text-[#F4F1EA] text-[36px] md:text-[48px] font-light tracking-[-0.02em] leading-[1.05] mb-3 font-['Inter_Tight']">
          44 templates profissionais.
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[600px]">Escolhe um template e preenche os campos. Gerado em alta resolução com GPT Image 1.</p>
      </header>

      <div className="inline-flex flex-wrap gap-1.5 bg-[#13131A] border border-[#2E2E30] rounded-full p-1 mb-10" data-testid="poster-cats">
        {Object.keys(CAT_LABELS).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-5 py-2 rounded-full text-[12px] font-medium transition-all ${
              category === c ? "bg-[#F4F1EA] text-[#0B0B0C]" : "text-[#8A8A8E] hover:text-[#F4F1EA]"
            }`}
            data-testid={`postercat-${c}`}
          >
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="poster-templates-grid">
        {filtered.map((tpl, i) => (
          <motion.button
            key={tpl.id}
            onClick={() => { setPicked(tpl); setValues({}); }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.025, ease: [0.16, 1, 0.3, 1] }}
            className="group bg-[#13131A] border border-[#2E2E30] hover:border-[#7C3AED]/60 rounded-lg overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.4)]"
            data-testid={`tpl-${tpl.id}`}
          >
            <div className="relative aspect-[3/4] bg-gradient-to-br from-[#1A1A1C] to-[#0B0B0C] overflow-hidden flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7C3AED] mb-2">{CAT_LABELS[tpl.category]}</div>
                <p className="text-[#F4F1EA] text-[16px] font-medium font-['Inter_Tight'] leading-tight">{tpl.label || tpl.id}</p>
                <p className="text-[#5A5A5E] text-[11px] mt-3">{tpl.placeholders.length} campos</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[#7C3AED]/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[12px] font-medium uppercase tracking-[0.15em] px-5 py-2.5 border border-white/50 rounded-full">
                  Open Editor →
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
