import { useMemo } from "react";
import { useFlowStore } from "./useFlowStore";
import { buildFlowPrompt } from "./buildFlowPrompt";

export default function PromptEnhancement() {
  const show = useFlowStore((s) => s.showEnhancement);
  const draft = useFlowStore((s) => s.enhancementDraft);
  const pending = useFlowStore((s) => s.pendingConnection);
  const nodes = useFlowStore((s) => s.nodes);
  const globalSettings = useFlowStore((s) => s.globalSettings);
  const confirm = useFlowStore((s) => s.confirmConnection);
  const cancel = useFlowStore((s) => s.cancelConnection);
  const setDraft = (patch) =>
    useFlowStore.setState({ enhancementDraft: { ...useFlowStore.getState().enhancementDraft, ...patch } });

  const previewPrompt = useMemo(() => {
    if (!pending?.connection) return draft.promptEnhancement;
    const src = nodes.find((n) => n.id === pending.connection.source);
    const tgt = nodes.find((n) => n.id === pending.connection.target);
    if (!src || !tgt) return draft.promptEnhancement;
    const edge = {
      id: "preview",
      source: src.id,
      target: tgt.id,
      data: { ...draft, promptEnhancement: draft.promptEnhancement },
    };
    return buildFlowPrompt([src, tgt], [edge], globalSettings);
  }, [pending, nodes, draft, globalSettings]);

  if (!show) return null;

  const sourceLabel = pending?.sourceType || "?";
  const targetLabel = pending?.targetType || "?";

  return (
    <div className="mf-modal-bg" role="dialog">
      <div className="mf-modal">
        <h3 className="text-white font-semibold mb-2">
          🔗 Ligação: {sourceLabel} → {targetLabel}
        </h3>
        <p className="text-[0.8rem] text-[#9ca3af] mb-2">Descreva a relação entre as caixas:</p>
        <textarea
          className="mf-field min-h-[100px]"
          value={draft.promptEnhancement}
          onChange={(e) => setDraft({ promptEnhancement: e.target.value })}
        />
        <label className="flex items-center gap-2 min-h-[44px] text-[0.85rem]">
          <input
            type="checkbox"
            checked={draft.autoEnhance}
            onChange={(e) => setDraft({ autoEnhance: e.target.checked })}
          />
          Enhancement automático
        </label>
        <label className="flex items-center gap-2 min-h-[44px] text-[0.85rem]">
          <input
            type="checkbox"
            checked={draft.useStoryInjection}
            onChange={(e) => setDraft({ useStoryInjection: e.target.checked })}
          />
          Story injection (painel anterior como ref)
        </label>
        <div className="mf-prompt-preview-box mt-2">
          <p className="text-[0.7rem] text-[#8b5cf6] mb-1">👁️ Preview do prompt gerado</p>
          <pre>{previewPrompt || draft.promptEnhancement || "(automático se vazio)"}</pre>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" className="mf-btn mf-btn--primary flex-1" onClick={confirm}>
            ✅ Confirmar
          </button>
          <button type="button" className="mf-btn flex-1" onClick={cancel}>
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
