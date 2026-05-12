import { useEffect, useMemo, useState } from "react";
import { Sparkles, Zap, Image as ImgIcon, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import PhotoUpload from "../../components/PhotoUpload";
import ResultPanel from "../../components/ResultPanel";
import useTitle from "../../lib/useTitle";

const ASPECT_RATIOS = ["1:1", "4:5", "3:4", "16:9", "9:16", "21:9"];

const CAT_LABELS = {
  men: "Homens", women: "Mulheres", unisex: "Unissex",
  flyer: "Flyers", couple: "Casais", comic: "Comics",
  stories: "Stories", sensual: "Sensual",
};

const PRO_CAT_LABELS = {
  realism: "Realismo", mood: "Estilo & Humor", enhance: "Enhancements",
};

const SUBJECTS = [
  { value: "the man", label: "Homem" },
  { value: "the woman", label: "Mulher" },
  { value: "the person", label: "Pessoa" },
];

export default function Generate() {
  const { t } = useI18n();
  useTitle(t("sidebar_generate"));
  const { refresh, user } = useAuth();
  const [searchParams] = useSearchParams();

  // tab: easy | advanced | poster
  const [tab, setTab] = useState("easy");
  const [aspect, setAspect] = useState("4:5");
  const [photo, setPhoto] = useState(null);
  const [extra, setExtra] = useState(searchParams.get("prompt") || "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Easy (PADRAO_STYLES)
  const [padrao, setPadrao] = useState([]);
  const [padraoCat, setPadraoCat] = useState("men");
  const [easyStyle, setEasyStyle] = useState(null);
  const [subject, setSubject] = useState("the man");

  // Advanced (PRO_PRESETS)
  const [presets, setPresets] = useState([]);
  const [proCat, setProCat] = useState("realism");
  const [proPreset, setProPreset] = useState(null);

  // Poster
  const [posters, setPosters] = useState([]);
  const [posterTpl, setPosterTpl] = useState(null);
  const [placeholders, setPlaceholders] = useState({});

  useEffect(() => {
    api.get("/public/padrao-styles").then((r) => setPadrao(r.data.styles || [])).catch(() => {});
    api.get("/public/pro-presets").then((r) => setPresets(r.data.presets || [])).catch(() => {});
    api.get("/public/poster-templates").then((r) => setPosters(r.data.templates || [])).catch(() => {});
  }, []);

  const padraoCats = useMemo(() => Array.from(new Set(padrao.map((s) => s.cat))), [padrao]);
  const padraoFiltered = padrao.filter((s) => s.cat === padraoCat);
  const proFiltered = presets.filter((p) => p.category === proCat);

  useEffect(() => {
    // pick a sensible default subject based on cat
    if (padraoCat === "women") setSubject("the woman");
    else if (padraoCat === "men") setSubject("the man");
    else setSubject("the person");
  }, [padraoCat]);

  const costFor = (mode) => mode === "easy" ? 11 : mode === "advanced" ? 18 : 15;
  const cost = costFor(tab);

  const generate = async () => {
    setBusy(true); setResult(null);
    try {
      let data;
      if (tab === "easy") {
        if (!photo) { toast.error("Envia uma foto."); setBusy(false); return; }
        if (!easyStyle) { toast.error("Escolhe um estilo."); setBusy(false); return; }
        const fd = new FormData();
        fd.append("photo", photo);
        fd.append("style_id", easyStyle);
        fd.append("subject", subject);
        fd.append("aspect_ratio", aspect);
        if (extra.trim()) fd.append("extra_prompt", extra.trim());
        ({ data } = await api.post("/generate/easy", fd, { headers: { "Content-Type": "multipart/form-data" } }));
      } else if (tab === "advanced") {
        if (!photo) { toast.error("Envia uma foto."); setBusy(false); return; }
        if (!proPreset) { toast.error("Escolhe um preset."); setBusy(false); return; }
        const fd = new FormData();
        fd.append("photo", photo);
        fd.append("preset_id", proPreset);
        fd.append("aspect_ratio", aspect);
        ({ data } = await api.post("/generate/pro", fd, { headers: { "Content-Type": "multipart/form-data" } }));
      } else {
        if (!posterTpl) { toast.error("Escolhe um template."); setBusy(false); return; }
        const tpl = posters.find((p) => p.id === posterTpl);
        const missing = (tpl?.placeholders || []).filter((k) => !(placeholders[k] || "").trim());
        if (missing.length) { toast.error(`Preenche: ${missing.join(", ")}`); setBusy(false); return; }
        ({ data } = await api.post("/generate/poster", { template_id: posterTpl, placeholders }));
      }
      setResult(data.creation);
      toast.success(`Gerado · ${data.creation.credits_spent} créditos`);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Falhou");
    } finally { setBusy(false); }
  };

  const TabBtn = ({ id, icon: Icon, label }) => (
    <button onClick={() => { setTab(id); setResult(null); }}
      className={`flex items-center gap-2.5 px-6 py-4 border-b-2 transition-colors text-[12px] font-mono uppercase tracking-[0.18em] ${tab === id ? "border-rp-purple text-rp-lavender" : "border-transparent text-rp-mute hover:text-rp-text"}`}
      data-testid={`tab-${id}`}>
      <Icon className="w-4 h-4" strokeWidth={1.5} /> {label}
    </button>
  );

  const currentTpl = posters.find((p) => p.id === posterTpl);

  return (
    <div className="max-w-[1200px] mx-auto" data-testid="generate-page">
      <div className="mb-10">
        <p className="eyebrow mb-3">Estúdio</p>
        <h1 className="heading-xl">Cria a tua imagem.</h1>
      </div>

      <div className="flex items-center border-b border-rp-border mb-10" data-testid="mode-tabs">
        <TabBtn id="easy" icon={Zap} label="Fácil" />
        <TabBtn id="advanced" icon={Sparkles} label="Avançado" />
        <TabBtn id="poster" icon={ImgIcon} label="Pôster" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          {/* Photo upload (easy + advanced) */}
          {(tab === "easy" || tab === "advanced") && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Foto de referência</label>
              <div className="max-w-[420px] mb-10">
                <PhotoUpload value={photo} onChange={setPhoto} testId="gen-photo" />
              </div>
            </>
          )}

          {/* EASY tab */}
          {tab === "easy" && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Sujeito</label>
              <div className="flex flex-wrap gap-2 mb-8" data-testid="subject-bar">
                {SUBJECTS.map((s) => (
                  <button key={s.value} onClick={() => setSubject(s.value)}
                    className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.12em] ${subject === s.value ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`}
                    data-testid={`subj-${s.value.replace(/\s/g, "-")}`}>{s.label}</button>
                ))}
              </div>

              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Categoria</label>
              <div className="flex flex-wrap gap-2 mb-5" data-testid="padrao-cats">
                {padraoCats.map((c) => (
                  <button key={c} onClick={() => { setPadraoCat(c); setEasyStyle(null); }}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.16em] border ${padraoCat === c ? "border-rp-purple text-rp-lavender" : "border-rp-border text-rp-mute hover:text-rp-text"}`}
                    data-testid={`pcat-${c}`}>{CAT_LABELS[c] || c}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10 max-h-[460px] overflow-y-auto pr-2" data-testid="padrao-grid">
                {padraoFiltered.map((s) => (
                  <button key={s.id} onClick={() => setEasyStyle(s.id)}
                    className={`text-left p-4 border transition-all ${easyStyle === s.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"} ${s.locked ? "opacity-80" : ""}`}
                    data-testid={`pstyle-${s.id}`}>
                    <p className="font-heading text-base text-rp-text mb-1 leading-tight">{s.nome}</p>
                    <p className="text-[10px] font-mono text-rp-mute2 uppercase tracking-[0.14em]">
                      {s.grp || s.cat}{s.locked ? " · Premium" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ADVANCED tab */}
          {tab === "advanced" && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Direção</label>
              <div className="flex flex-wrap gap-2 mb-5" data-testid="pro-cats">
                {["realism", "mood", "enhance"].map((c) => (
                  <button key={c} onClick={() => { setProCat(c); setProPreset(null); }}
                    className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.16em] ${proCat === c ? "border-rp-purple text-rp-lavender" : "border-rp-border text-rp-mute hover:text-rp-text"}`}
                    data-testid={`procat-${c}`}>{PRO_CAT_LABELS[c]}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10" data-testid="pro-grid">
                {proFiltered.map((p) => (
                  <button key={p.id} onClick={() => setProPreset(p.id)}
                    className={`text-left p-4 border transition-all ${proPreset === p.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`}
                    data-testid={`preset-${p.id}`}>
                    <p className="font-heading text-base text-rp-text mb-1 leading-tight">{p.nome}</p>
                    <p className="text-[10px] font-mono text-rp-mute2 uppercase tracking-[0.14em]">{PRO_CAT_LABELS[p.category]}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* POSTER tab */}
          {tab === "poster" && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8 max-h-[420px] overflow-y-auto pr-2" data-testid="poster-grid">
                {posters.map((p) => (
                  <button key={p.id} onClick={() => { setPosterTpl(p.id); setPlaceholders({}); }}
                    className={`text-left p-4 border transition-all ${posterTpl === p.id ? "border-rp-purple bg-rp-purple/10" : "border-rp-border hover:border-rp-mute"}`}
                    data-testid={`ptpl-${p.id}`}>
                    <p className="font-heading text-base text-rp-text mb-1 leading-tight">{p.label || p.nome || p.id}</p>
                    <p className="text-[10px] font-mono text-rp-mute2 uppercase tracking-[0.14em]">{p.category}</p>
                  </button>
                ))}
              </div>
              {currentTpl && (
                <div className="space-y-3 mb-10" data-testid="poster-fields">
                  {(currentTpl.placeholders || []).map((field) => (
                    <div key={field}>
                      <label className="block text-[11px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">{field}</label>
                      <input value={placeholders[field] || ""}
                        onChange={(e) => setPlaceholders({ ...placeholders, [field]: e.target.value })}
                        className="field-input" data-testid={`pl-${field}`} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Aspect ratio + extra prompt (easy + advanced) */}
          {tab !== "poster" && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Formato</label>
              <div className="flex flex-wrap gap-2 mb-8" data-testid="aspect-ratios">
                {ASPECT_RATIOS.map((a) => (
                  <button key={a} onClick={() => setAspect(a)}
                    className={`px-4 py-2 border text-[11px] font-mono uppercase tracking-[0.12em] ${aspect === a ? "border-rp-purple text-rp-lavender bg-rp-purple/10" : "border-rp-border text-rp-mute hover:text-rp-text"}`}
                    data-testid={`aspect-${a}`}>{a}</button>
                ))}
              </div>
            </>
          )}

          {tab === "easy" && (
            <>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">Detalhes extra (opcional)</label>
              <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} placeholder="Adiciona instruções específicas..." className="field-input resize-none mb-8" data-testid="extra-prompt" />
            </>
          )}

          <button onClick={generate} disabled={busy || (user?.credits ?? 0) < cost}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="generate-button">
            {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> A gerar...</>) : (`Gerar · ${cost} créditos`)}
          </button>
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <p className="eyebrow mb-4">Último resultado</p>
          <ResultPanel creation={result} loading={busy} onChange={setResult} emptyLabel="Sem resultado ainda." />
        </aside>
      </div>
    </div>
  );
}
