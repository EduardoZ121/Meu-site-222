import { useCallback, useEffect, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";

const ENGINES = [
  {
    id: "replicate",
    label: "Replicate",
    desc: "Produção — igual ao que os clientes usam hoje.",
    color: "border-violet-500/40 bg-violet-500/10",
  },
  {
    id: "runpod",
    label: "RunPod",
    desc: "Desenvolvimento — ComfyUI Serverless (só imagens, só admin).",
    color: "border-emerald-500/40 bg-emerald-500/10",
  },
];

export default function AdminEnginePanel() {
  const [settings, setSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [runpodAction, setRunpodAction] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/engine");
      setSettings(data);
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível carregar o motor de IA."));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const { data } = await api.get("/admin/engine/health");
      setHealth(data);
    } catch (err) {
      toast.error(formatApiError(err, "Health check falhou."));
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    refreshHealth();
  }, [load, refreshHealth]);

  const selectEngine = async (engineId) => {
    if (settings?.engine === engineId) return;
    setSaving(true);
    try {
      const { data } = await api.patch("/admin/engine", { engine: engineId });
      setSettings(data);
      toast.success(engineId === "runpod" ? "RunPod activo para as tuas gerações de imagem." : "Replicate activo.");
      await refreshHealth();
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível alterar o motor."));
    } finally {
      setSaving(false);
    }
  };

  const pauseRunpod = async () => {
    setRunpodAction(true);
    try {
      const { data } = await api.post("/admin/engine/runpod/pause");
      setHealth(data);
      toast.success("RunPod pausado — não arranca GPUs novas.");
      await refreshHealth();
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível pausar o RunPod."));
    } finally {
      setRunpodAction(false);
    }
  };

  const purgeRunpodQueue = async () => {
    setRunpodAction(true);
    try {
      const { data } = await api.post("/admin/engine/runpod/purge-queue");
      setHealth(data);
      const removed = data?.purged?.removed ?? 0;
      toast.success(removed ? `Fila limpa (${removed} jobs cancelados).` : "Fila já estava vazia.");
      await refreshHealth();
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível limpar a fila."));
    } finally {
      setRunpodAction(false);
    }
  };

  const resumeRunpod = async () => {
    setRunpodAction(true);
    try {
      const { data } = await api.post("/admin/engine/runpod/resume");
      setHealth(data);
      toast.success("RunPod activo — fila limpa. 1ª imagem pode demorar ~1–3 min.");
      await refreshHealth();
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível activar o RunPod."));
    } finally {
      setRunpodAction(false);
    }
  };

  if (loading && !settings) {
    return (
      <p className="text-sm text-rp-mute py-8 text-center">A carregar motor de IA…</p>
    );
  }

  const runpodOk = settings?.providers?.runpod?.configured;
  const replicateOk = settings?.providers?.replicate?.configured;
  const runpodHealthOk = health?.runpod?.ok;
  const runpodPaused = health?.runpod?.paused === true;
  const runpodStaleQueue = health?.runpod?.stale_queue === true;
  const runpodQueue = health?.runpod?.jobs_in_queue;

  return (
    <section data-testid="admin-engine-panel" className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-rp-text">Motor de IA (admin)</h2>
        <p className="text-sm text-rp-mute mt-1">
          Escolhe o fornecedor para as tuas gerações de imagem. Os clientes continuam sempre no Replicate.
          Vídeos ficam sempre no Replicate.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ENGINES.map((eng) => {
          const active = settings?.engine === eng.id;
          const disabled = eng.id === "runpod" && !runpodOk;
          return (
            <button
              key={eng.id}
              type="button"
              disabled={saving || disabled}
              onClick={() => selectEngine(eng.id)}
              className={[
                "rounded-xl border p-4 text-left transition",
                active ? eng.color : "border-rp-border bg-rp-surface/50 hover:border-rp-mute/40",
                disabled ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-rp-text">{eng.label}</span>
                {active && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-emerald-400">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-rp-mute mt-2 leading-relaxed">{eng.desc}</p>
              {eng.id === "runpod" && !runpodOk && (
                <p className="text-xs text-amber-400 mt-2">
                  Configura RUNPOD_API_KEY e RUNPOD_ENDPOINT_ID na Vercel.
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-rp-border bg-rp-surface/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-rp-text">Estado da ligação</h3>
          <button
            type="button"
            onClick={refreshHealth}
            disabled={healthLoading}
            className="text-xs px-3 py-1.5 rounded-lg border border-rp-border text-rp-mute hover:text-rp-text disabled:opacity-50"
          >
            {healthLoading ? "A verificar…" : "Actualizar"}
          </button>
        </div>

        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-rp-mute">Fornecedor seleccionado</dt>
            <dd className="font-medium text-rp-text capitalize">{settings?.engine || "replicate"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-rp-mute">Replicate</dt>
            <dd className={replicateOk ? "text-emerald-400" : "text-amber-400"}>
              {replicateOk ? "Configurado" : "Token em falta"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-rp-mute">RunPod endpoint</dt>
            <dd className="font-mono text-xs text-rp-text truncate max-w-[200px]">
              {settings?.providers?.runpod?.endpoint_id || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-rp-mute">RunPod health</dt>
            <dd className={runpodHealthOk ? "text-emerald-400" : "text-rp-mute"}>
              {healthLoading
                ? "…"
                : runpodHealthOk
                  ? "Online"
                  : health?.runpod?.message || "Offline / não configurado"}
            </dd>
          </div>
          {runpodHealthOk && health?.runpod?.workers_running != null && (
            <div className="flex justify-between gap-4">
              <dt className="text-rp-mute">Workers RunPod</dt>
              <dd className="text-rp-text">
                {health.runpod.workers_running} activos
                {runpodQueue != null ? ` · ${runpodQueue} em fila` : ""}
              </dd>
            </div>
          )}
          {runpodStaleQueue && (
            <p className="text-xs text-amber-400 leading-relaxed">
              Fila presa com jobs antigos — clica <strong>Limpar fila</strong> e espera ~1 min antes de gerar.
            </p>
          )}
          {runpodOk && (
            <div className="flex justify-between gap-4">
              <dt className="text-rp-mute">Endpoint RunPod</dt>
              <dd className={runpodPaused ? "text-amber-400" : "text-emerald-400"}>
                {runpodPaused ? "Pausado" : "Pronto a gerar"}
              </dd>
            </div>
          )}
        </dl>

        {runpodOk && (
          <div className="flex flex-wrap gap-2 border-t border-rp-border pt-3">
            <button
              type="button"
              onClick={purgeRunpodQueue}
              disabled={runpodAction || healthLoading}
              className="text-xs px-3 py-1.5 rounded-lg border border-rp-border text-rp-mute hover:text-rp-text disabled:opacity-50"
            >
              {runpodAction ? "A limpar…" : "Limpar fila"}
            </button>
            {runpodPaused ? (
              <button
                type="button"
                onClick={resumeRunpod}
                disabled={runpodAction || healthLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/90 text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {runpodAction ? "A activar…" : "Continuar RunPod"}
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRunpod}
                disabled={runpodAction || healthLoading}
                className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/50 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
              >
                {runpodAction ? "A pausar…" : "Pausar RunPod"}
              </button>
            )}
            <span className="text-xs text-rp-mute self-center">
              1ª geração após pausa: ~1–3 min (cold start). Depois ~10s por imagem.
            </span>
          </div>
        )}

        <p className="text-xs text-rp-mute border-t border-rp-border pt-3 leading-relaxed">
          Escolhe <strong className="text-rp-text font-medium">RunPod</strong> em cima para gastar no RunPod em vez do Replicate (só imagens).
          Quando não testas, clica <strong className="text-rp-text font-medium">Pausar RunPod</strong> ou volta ao Replicate.
        </p>
      </div>
    </section>
  );
}
