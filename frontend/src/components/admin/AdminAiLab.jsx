import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";

const POLL_MS = 4000;
const POLL_MAX_MS = 1200000;
const GENERATE_TIMEOUT_MS = 180000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function fmtDuration(ms) {
  if (ms == null) return "—";
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/** Upload zone: drag/drop, click, preview, remove. */
function UploadZone({ image, onPick, onClear, disabled }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Só imagens."); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error("Imagem demasiado grande (máx 8MB)."); return; }
    try {
      const dataUrl = await fileToDataUrl(file);
      onPick({ dataUrl, name: file.name });
    } catch { toast.error("Não foi possível ler a imagem."); }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) handleFiles(e.dataTransfer.files); }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={[
        "relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition min-h-[160px] flex items-center justify-center",
        drag ? "border-rp-purple bg-rp-surface" : "border-rp-border hover:border-rp-mute/60 bg-rp-surface/30",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {image ? (
        <div className="w-full">
          <img src={image.dataUrl} alt="ref" className="max-h-48 mx-auto rounded-lg object-contain" />
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-[11px] font-mono text-rp-mute2 truncate max-w-[160px]">{image.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-[11px] px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="text-rp-mute">
          <p className="text-sm">Arrasta uma imagem ou <span className="text-rp-lavender">clica para escolher</span></p>
          <p className="text-[11px] font-mono text-rp-mute2 mt-1">PNG, JPG, WEBP · máx 8MB · opcional (img2img)</p>
        </div>
      )}
    </div>
  );
}

/** A single advanced parameter control. */
function ParamField({ def, value, onChange }) {
  if (def.type === "select") {
    return (
      <label className="block">
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2 block mb-1">{def.label}</span>
        <select
          value={value ?? def.default}
          onChange={(e) => onChange(def.id, e.target.value)}
          className="field-input w-full !py-2 text-sm"
        >
          {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2 block mb-1">
        {def.label}{def.hint ? <span className="text-rp-mute2/70 normal-case tracking-normal"> · {def.hint}</span> : null}
      </span>
      <input
        type="number"
        value={value ?? def.default}
        min={def.min}
        max={def.max}
        step={def.step}
        onChange={(e) => onChange(def.id, e.target.value)}
        className="field-input w-full !py-2 text-sm"
      />
    </label>
  );
}

export default function AdminAiLab() {
  const [catalog, setCatalog] = useState(null);
  const [pipelineId, setPipelineId] = useState("txt2img");
  const [modelId, setModelId] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [image, setImage] = useState(null);
  const [params, setParams] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null); // { status, elapsed, model, workflow }
  const [session, setSession] = useState([]); // comparison grid (this session)
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const pollStartedRef = useRef(null);

  const loadCatalog = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/lab/catalog");
      setCatalog(data);
      const firstReady = data.models.find((m) => m.ready) || data.models[0];
      if (firstReady) {
        setPipelineId(firstReady.pipeline);
        setModelId(firstReady.id);
        setWorkflowId(firstReady.workflows[0]?.id || null);
      }
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível carregar o catálogo."));
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const [{ data: h }, { data: s }] = await Promise.all([
        api.get("/admin/lab/history"),
        api.get("/admin/lab/stats"),
      ]);
      setHistory(h.generations || []);
      setStats(s);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadCatalog(); loadHistory(); }, [loadCatalog, loadHistory]);

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const pipelineModels = useMemo(
    () => (catalog?.models || []).filter((m) => m.pipeline === pipelineId),
    [catalog, pipelineId],
  );
  const model = useMemo(() => catalog?.models.find((m) => m.id === modelId) || null, [catalog, modelId]);
  const workflow = useMemo(() => model?.workflows.find((w) => w.id === workflowId) || null, [model, workflowId]);
  const activeParams = useMemo(() => workflow?.param_defs || [], [workflow]);
  const needsImage = useMemo(
    () => (workflow?.requires || []).some((r) => ["image", "face_ref", "mask"].includes(r)),
    [workflow],
  );

  const onSelectPipeline = (pid) => {
    setPipelineId(pid);
    const first = (catalog?.models || []).filter((m) => m.pipeline === pid);
    const pick = first.find((m) => m.ready) || first[0];
    if (pick) {
      setModelId(pick.id);
      setWorkflowId(pick.workflows[0]?.id || null);
    } else {
      setModelId(null);
      setWorkflowId(null);
    }
  };

  const onSelectModel = (m) => {
    setModelId(m.id);
    setWorkflowId(m.workflows[0]?.id || null);
  };

  const setParam = (id, value) => setParams((p) => ({ ...p, [id]: value }));

  // When the workflow changes, reset params to that workflow's tuned defaults.
  useEffect(() => {
    if (!workflow?.param_defs?.length) {
      setParams({});
      return;
    }
    const next = {};
    for (const def of workflow.param_defs) {
      next[def.id] = def.default;
    }
    setParams(next);
  }, [workflowId, workflow]);

  const restoreFrom = (gen) => {
    setPrompt(gen.prompt || "");
    setNegative(gen.negative_prompt || "");
    setParams(gen.params || {});
    if (gen.model_id && catalog?.models.some((m) => m.id === gen.model_id)) {
      setModelId(gen.model_id);
      setWorkflowId(gen.workflow_id);
    }
    toast.success("Configurações restauradas.");
  };

  const stopTimers = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const generate = async () => {
    if (catalog?.lab_paused) { toast.error(catalog.lab_message || "Laboratório pausado."); return; }
    if (!workflow) { toast.error("Escolhe um modelo e workflow."); return; }
    if (!model?.ready || !workflow?.ready) { toast.error("Este modelo ainda não está disponível."); return; }
    if (!prompt.trim()) { toast.error("Escreve um prompt."); return; }
    if (needsImage && !image) { toast.error("Este workflow precisa de uma imagem de referência."); return; }

    setGenerating(true);
    const startedAt = Date.now();
    pollStartedRef.current = startedAt;
    setProgress({ status: "A enviar para ComfyUI (Vast)…", elapsed: 0, model: model.label, workflow: workflow.label });

    timerRef.current = setInterval(() => {
      setProgress((p) => p ? { ...p, elapsed: Math.round((Date.now() - startedAt) / 1000) } : p);
    }, 1000);

    try {
      const { data: gen } = await api.post("/admin/lab/generate", {
        model_id: modelId,
        workflow_id: workflowId,
        prompt: prompt.trim(),
        negative_prompt: negative.trim(),
        params,
        image: needsImage ? image?.dataUrl : undefined,
      }, { timeout: GENERATE_TIMEOUT_MS });

      setProgress((p) => ({ ...p, status: "Na fila ComfyUI…" }));

      const meta = {
        model_id: modelId,
        model_label: model.label,
        workflow_id: workflowId,
        workflow_label: workflow.label,
        prompt: prompt.trim(),
        negative_prompt: negative.trim(),
        params: gen.resolved_params || params,
        started_at: startedAt,
      };

      const poll = async () => {
        try {
          const elapsed = Date.now() - (pollStartedRef.current || startedAt);
          if (elapsed > POLL_MAX_MS) {
            stopTimers();
            setGenerating(false);
            setProgress(null);
            toast.error("Demorou demasiado. Verifica se o pod Vast está ligado e tenta de novo.");
            return;
          }
          const { data } = await api.post("/admin/lab/poll", { job_id: gen.job_id, meta }, { timeout: 60000 });
          if (data.status === "processing") {
            const statusText = data.status_text
              || (data.queue_position != null ? `Na fila (#${data.queue_position})` : "A gerar na GPU…");
            setProgress((p) => ({ ...p, status: statusText }));
            pollRef.current = setTimeout(poll, POLL_MS);
            return;
          }
          stopTimers();
          setGenerating(false);
          setProgress(null);
          if (data.status === "failed") {
            toast.error(`Geração falhou: ${data.error || "erro"}`);
          } else {
            const card = {
              ...(data.saved || {}),
              result_urls: data.result_urls || [],
              duration_ms: data.duration_ms,
              resolved_params: meta.params,
            };
            setSession((prev) => [card, ...prev]);
            toast.success(`Imagem gerada em ${fmtDuration(data.duration_ms)}.`);
          }
          loadHistory();
          loadCatalog();
        } catch (err) {
          stopTimers();
          setGenerating(false);
          setProgress(null);
          toast.error(formatApiError(err, "Erro ao consultar a geração."));
        }
      };
      pollRef.current = setTimeout(poll, POLL_MS);
    } catch (err) {
      stopTimers();
      setGenerating(false);
      setProgress(null);
      toast.error(formatApiError(err, "Não foi possível iniciar a geração."));
    }
  };

  const toggleFavorite = async (gen) => {
    try {
      await api.post("/admin/lab/favorite", { id: gen.id, favorite: !gen.favorite });
      loadHistory();
    } catch (err) { toast.error(formatApiError(err, "Falhou.")); }
  };

  const removeHistory = async (gen) => {
    try {
      await api.delete(`/admin/lab/history/${gen.id}`);
      setHistory((h) => h.filter((x) => x.id !== gen.id));
      loadHistory();
    } catch (err) { toast.error(formatApiError(err, "Falhou.")); }
  };

  const removeSessionCard = (idx) => setSession((prev) => prev.filter((_, i) => i !== idx));

  if (!catalog) {
    return <p className="text-sm text-rp-mute py-8 text-center">A carregar laboratório…</p>;
  }

  return (
    <section data-testid="admin-ai-lab" className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl text-rp-text mb-1">AI Playground — Laboratório</h2>
        <p className="text-rp-mute text-sm max-w-2xl">
          Ambiente privado de testes (só admin) — motor Vast.ai RTX 4090 + ComfyUI + Flux.
          Clientes e produção continuam no Replicate — nada disso muda.
        </p>
        {catalog.lab_paused && (
          <div className="mt-3 border border-amber-500/40 bg-amber-500/10 text-amber-100 text-sm p-4 rounded-xl">
            <strong className="text-amber-50">Laboratório pausado</strong>
            <p className="mt-1 text-xs text-amber-100/90">{catalog.lab_message}</p>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-rp-border rounded-xl overflow-hidden">
          {[
            { k: "Gerações", v: stats.total_generations },
            { k: "Sucesso", v: stats.succeeded },
            { k: "Tempo médio", v: fmtDuration(stats.avg_ms) },
            { k: "Mais rápido", v: stats.fastest_model ? `${stats.fastest_model.model} (${fmtDuration(stats.fastest_model.avg_ms)})` : "—" },
            { k: "Favoritos", v: stats.favorites },
          ].map((s) => (
            <div key={s.k} className="bg-rp-surface/60 p-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2">{s.k}</p>
              <p className="text-sm text-rp-text mt-1 truncate">{s.v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ---------- Left: controls ---------- */}
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">Pipeline</p>
            <div className="flex flex-wrap gap-2">
              {(catalog.pipelines || []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPipeline(p.id)}
                  title={p.hint}
                  className={[
                    "text-xs px-3 py-2 rounded-lg border transition text-left",
                    pipelineId === p.id ? "border-rp-purple text-rp-lavender bg-rp-surface" : "border-rp-border text-rp-mute hover:text-rp-text",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {catalog.pipelines?.find((p) => p.id === pipelineId)?.hint && (
              <p className="text-[11px] text-rp-mute2 mt-2">{catalog.pipelines.find((p) => p.id === pipelineId).hint}</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">Modelo</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {pipelineModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectModel(m)}
                  className={[
                    "border px-3 py-2 text-left rounded-lg transition",
                    modelId === m.id ? "border-rp-purple bg-rp-surface" : "border-rp-border hover:border-rp-mute/60",
                    m.ready ? "" : "opacity-70",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm text-rp-text">{m.label}</span>
                    <span className={`text-[9px] font-mono uppercase ${m.ready ? "text-emerald-400" : "text-amber-400"}`}>
                      {m.ready ? "pronto" : "em breve"}
                    </span>
                  </span>
                  <span className="block text-[10px] text-rp-mute2 mt-0.5">{m.note}</span>
                </button>
              ))}
            </div>
          </div>

          {model && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">Workflow</p>
              <div className="flex flex-wrap gap-2">
                {model.workflows.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWorkflowId(w.id)}
                    title={(w.requires || []).length ? `Precisa de: ${w.requires.join(", ")}` : "Só prompt"}
                    className={[
                      "text-xs px-3 py-1.5 rounded-lg border transition",
                      workflowId === w.id ? "border-rp-purple text-rp-lavender bg-rp-surface" : "border-rp-border text-rp-mute hover:text-rp-text",
                    ].join(" ")}
                  >
                    {w.label}{(w.requires || []).length ? ` · ${w.requires.join("+")}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {model && !model.ready && (
            <div className="border border-amber-500/40 bg-amber-500/10 text-amber-100 text-xs p-3 rounded-lg">
              <strong className="text-amber-50">{model.label}</strong> indisponível no pod.
              {model.note ? <span className="block mt-1 text-amber-100/90">{model.note}</span> : null}
            </div>
          )}

          {model?.family === "sd15" && model.ready && (
            <div className="border border-amber-500/40 bg-amber-500/10 text-amber-100 text-xs p-3 rounded-lg">
              <strong className="text-amber-50">SD 1.5 não é qualidade Flux.</strong>
              <span className="block mt-1">
                Só testa a ligação site→GPU. Usa <strong>máx. 512×512</strong> — resoluções maiores geram corpos distorcidos.
                Para imagens reais, activa <strong>Flux Dev</strong> (licença HuggingFace).
              </span>
            </div>
          )}

          {needsImage && (
            <UploadZone image={image} onPick={setImage} onClear={() => setImage(null)} disabled={generating} />
          )}

          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 block mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Descreve a imagem…"
              className="field-input w-full !py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 block mb-2">Negative prompt</label>
            <textarea
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
              rows={2}
              placeholder="O que evitar… (ex.: blurry, deformed)"
              className="field-input w-full !py-2 text-sm"
            />
          </div>

          <div className="border border-rp-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-rp-text bg-rp-surface/40 hover:bg-rp-surface/70"
            >
              <span>Configurações avançadas</span>
              <span className="text-rp-mute2 text-xs">{showAdvanced ? "▲" : "▼"}</span>
            </button>
            {showAdvanced && (
              <div className="p-4 grid grid-cols-2 gap-3">
                {activeParams.length === 0 && (
                  <p className="text-xs text-rp-mute col-span-2">Este workflow não expõe parâmetros ajustáveis.</p>
                )}
                {activeParams.map((def) => (
                  <ParamField key={def.id} def={def} value={params[def.id]} onChange={setParam} />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={generating || catalog.lab_paused || !model?.ready || !workflow?.ready}
            className="btn-primary w-full !py-3 text-base"
          >
            {catalog.lab_paused ? "Laboratório pausado" : generating ? "A gerar…" : !model?.ready ? "Modelo indisponível" : "Generate Image"}
          </button>

          {progress && (
            <div className="border border-rp-border rounded-xl p-4 bg-rp-surface/40 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-rp-text">{progress.status}</span>
                <span className="font-mono text-rp-lavender">{progress.elapsed}s</span>
              </div>
              <div className="h-1.5 bg-rp-border rounded-full overflow-hidden">
                <div className="h-full bg-rp-purple animate-pulse" style={{ width: "60%" }} />
              </div>
              <p className="text-[11px] font-mono text-rp-mute2">
                {progress.model} · {progress.workflow} · fila comunitária — pode demorar vários minutos
              </p>
            </div>
          )}
        </div>

        {/* ---------- Right: comparison grid ---------- */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-2">
            Resultados desta sessão {session.length ? `(${session.length})` : ""}
          </p>
          {session.length === 0 ? (
            <div className="border border-dashed border-rp-border rounded-xl p-8 text-center text-rp-mute2 text-sm">
              As imagens geradas aparecem aqui para comparares lado a lado.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {session.map((card, idx) => (
                <div key={card.id || idx} className="border border-rp-border rounded-xl overflow-hidden bg-rp-surface/40">
                  {card.result_urls?.[0] && (
                    <a href={card.result_urls[0]} target="_blank" rel="noopener noreferrer">
                      <img src={card.result_urls[0]} alt="result" className="w-full aspect-square object-cover" />
                    </a>
                  )}
                  <div className="p-3 space-y-1">
                    <p className="text-xs text-rp-text truncate">{card.model_label} · {card.workflow_label}</p>
                    <p className="text-[10px] font-mono text-rp-mute2">
                      {fmtDuration(card.duration_ms)}
                      {card.resolved_params?.seed != null ? ` · seed ${card.resolved_params.seed}` : ""}
                      {card.resolved_params?.steps != null ? ` · ${card.resolved_params.steps} steps` : ""}
                    </p>
                    <div className="flex gap-2 pt-1">
                      {card.id && (
                        <button type="button" onClick={() => toggleFavorite(card)} className="text-[11px] px-2 py-1 rounded border border-rp-border text-rp-mute hover:text-amber-300">
                          {card.favorite ? "★ Favorito" : "☆ Favoritar"}
                        </button>
                      )}
                      <button type="button" onClick={() => removeSessionCard(idx)} className="text-[11px] px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10">
                        Apagar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- History ---------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2">Histórico</p>
          <button type="button" onClick={loadHistory} className="text-xs px-3 py-1.5 rounded-lg border border-rp-border text-rp-mute hover:text-rp-text">
            Atualizar
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-rp-mute">Ainda sem gerações guardadas.</p>
        ) : (
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {history.map((gen) => (
              <div key={gen.id} className={`border rounded-xl overflow-hidden bg-rp-surface/40 ${gen.favorite ? "border-amber-500/50" : "border-rp-border"}`}>
                {gen.result_urls?.[0] ? (
                  <a href={gen.result_urls[0]} target="_blank" rel="noopener noreferrer">
                    <img src={gen.result_urls[0]} alt="" className="w-full aspect-square object-cover" />
                  </a>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-[11px] text-red-300 bg-red-500/5">
                    {gen.status === "failed" ? "falhou" : "sem imagem"}
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <p className="text-[11px] text-rp-text truncate" title={gen.prompt}>{gen.prompt || "—"}</p>
                  <p className="text-[9px] font-mono text-rp-mute2 truncate">
                    {gen.model_label} · {fmtDuration(gen.duration_ms)}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button type="button" onClick={() => restoreFrom(gen)} className="text-[10px] px-2 py-0.5 rounded border border-rp-border text-rp-mute hover:text-rp-text">
                      Reutilizar
                    </button>
                    <button type="button" onClick={() => toggleFavorite(gen)} className="text-[10px] px-2 py-0.5 rounded border border-rp-border text-rp-mute hover:text-amber-300">
                      {gen.favorite ? "★" : "☆"}
                    </button>
                    <button type="button" onClick={() => removeHistory(gen)} className="text-[10px] px-2 py-0.5 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
