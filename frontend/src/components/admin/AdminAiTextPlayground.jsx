import { useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";

const MODEL_CATALOG = [
  { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (grátis)", tier: "fraco", provider: "OpenRouter" },
  { id: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B", tier: "médio", provider: "OpenRouter" },
  { id: "qwen/qwen-2.5-7b-instruct", label: "Qwen 2.5 7B", tier: "médio", provider: "OpenRouter" },
  { id: "deepseek/deepseek-chat", label: "DeepSeek V3", tier: "forte", provider: "OpenRouter" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", tier: "forte", provider: "OpenRouter" },
  { id: "gpt-4o-mini", label: "GPT-4o mini (atual)", tier: "médio", provider: "OpenAI" },
  { id: "gpt-4o", label: "GPT-4o (Sofia)", tier: "forte", provider: "OpenAI" },
];

const DEFAULT_SELECTED = [
  "meta-llama/llama-3.1-8b-instruct",
  "gpt-4o-mini",
  "gpt-4o",
];

const TIER_COLOR = {
  fraco: "text-rp-mute",
  "médio": "text-amber-300",
  forte: "text-emerald-400",
};

export default function AdminAiTextPlayground() {
  const [prompt, setPrompt] = useState("");
  const [system, setSystem] = useState("");
  const [selected, setSelected] = useState(new Set(DEFAULT_SELECTED));
  const [customModel, setCustomModel] = useState("");
  const [customModels, setCustomModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [meta, setMeta] = useState(null);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCustom = () => {
    const id = customModel.trim();
    if (!id) return;
    if (!customModels.includes(id)) setCustomModels((p) => [...p, id]);
    setSelected((prev) => new Set(prev).add(id));
    setCustomModel("");
  };

  const run = async () => {
    const models = Array.from(selected);
    if (!prompt.trim()) { toast.error("Escreve uma mensagem."); return; }
    if (!models.length) { toast.error("Escolhe pelo menos um modelo."); return; }
    if (models.length > 6) { toast.error("Máximo 6 modelos de cada vez."); return; }
    setLoading(true);
    setResults(null);
    try {
      const { data } = await api.post(
        "/admin/ai-text/playground",
        { prompt: prompt.trim(), system: system.trim() || undefined, models },
        { timeout: 120000 },
      );
      setResults(data.results || []);
      setMeta({ openrouter: data.openrouter_configured, openai: data.openai_configured });
    } catch (err) {
      toast.error(formatApiError(err, "Falhou o teste."));
    } finally {
      setLoading(false);
    }
  };

  const allModels = [
    ...MODEL_CATALOG,
    ...customModels.map((id) => ({ id, label: id, tier: "custom", provider: id.includes("/") ? "OpenRouter" : "OpenAI" })),
  ];

  return (
    <section data-testid="admin-ai-playground" className="max-w-5xl">
      <h2 className="font-heading text-2xl text-rp-text mb-2">Playground de IA de Texto</h2>
      <p className="text-rp-mute text-sm mb-6 max-w-2xl">
        Testa o mesmo pedido em vários modelos (do fraco ao forte) e compara qualidade e velocidade.
        Só tu (admin) vês isto. A Sofia do site não é afetada. Modelos abertos via OpenRouter; GPT via OpenAI.
      </p>

      {meta && !meta.openrouter && (
        <div className="border border-amber-500/40 bg-amber-500/10 text-amber-100 text-xs p-4 mb-6 rounded">
          <p className="font-medium text-amber-50 mb-1">OpenRouter não configurado</p>
          <p>
            Para testar os modelos abertos (Llama, Qwen, DeepSeek…), cria uma chave grátis em{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a>{" "}
            e adiciona <span className="font-mono">OPENROUTER_API_KEY</span> nas Environment Variables da Vercel. Os modelos GPT já funcionam.
          </p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 block mb-2">System (opcional — personalidade/regras)</label>
          <textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            rows={2}
            placeholder="Ex.: És um assistente simpático da RemakePixel que responde em português."
            className="field-input w-full !py-2 text-sm"
            data-testid="ai-pg-system"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 block mb-2">Mensagem de teste</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Escreve aqui o que queres perguntar/testar…"
            className="field-input w-full !py-2 text-sm"
            data-testid="ai-pg-prompt"
          />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-3">Modelos (do fraco ao forte)</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {allModels.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className={`flex items-center justify-between gap-2 border px-3 py-2 text-left transition-colors ${
                selected.has(m.id) ? "border-rp-purple bg-rp-surface" : "border-rp-border hover:border-rp-mute"
              }`}
              data-testid={`ai-pg-model-${m.id}`}
            >
              <span className="min-w-0">
                <span className="block text-sm text-rp-text truncate">{m.label}</span>
                <span className="block text-[10px] font-mono text-rp-mute2 truncate">{m.id}</span>
              </span>
              <span className="flex flex-col items-end shrink-0">
                <span className="text-[9px] font-mono uppercase text-rp-mute2">{m.provider}</span>
                <span className={`text-[9px] font-mono uppercase ${TIER_COLOR[m.tier] || "text-rp-mute"}`}>{m.tier}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <input
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Adicionar modelo (ex.: google/gemini-flash-1.5)"
            className="field-input flex-1 !py-2 text-sm min-w-[220px]"
            data-testid="ai-pg-custom"
          />
          <button type="button" onClick={addCustom} className="btn-secondary !py-2 !px-4">Adicionar</button>
        </div>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="btn-primary !py-2.5 !px-8 mb-8"
        data-testid="ai-pg-run"
      >
        {loading ? "A testar…" : `Testar ${selected.size} modelo(s)`}
      </button>

      {results && (
        <div className="space-y-4" data-testid="ai-pg-results">
          {results
            .slice()
            .sort((a, b) => (a.latency_ms || 0) - (b.latency_ms || 0))
            .map((r) => (
              <div
                key={r.model}
                className={`border p-4 ${r.ok ? "border-rp-border bg-rp-surface/40" : "border-red-500/40 bg-red-500/5"}`}
              >
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-sm text-rp-text">{r.model}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase text-rp-mute2">{r.provider}</span>
                    <span className={`text-[11px] font-mono ${r.ok ? "text-emerald-400" : "text-red-400"}`}>
                      {((r.latency_ms || 0) / 1000).toFixed(1)}s
                    </span>
                  </span>
                </div>
                {r.ok ? (
                  <p className="text-sm text-rp-text whitespace-pre-wrap leading-relaxed">{r.reply || "(resposta vazia)"}</p>
                ) : (
                  <p className="text-sm text-red-300">{r.error}</p>
                )}
                {r.usage?.total_tokens != null && (
                  <p className="text-[10px] font-mono text-rp-mute2 mt-2">{r.usage.total_tokens} tokens</p>
                )}
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
