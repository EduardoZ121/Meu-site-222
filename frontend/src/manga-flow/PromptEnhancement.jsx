import { useFlowStore } from "./useFlowStore";

export default function PromptEnhancement() {
  const show = useFlowStore((s) => s.showEnhancement);
  const draft = useFlowStore((s) => s.enhancementDraft);
  const pending = useFlowStore((s) => s.pendingConnection);
  const confirm = useFlowStore((s) => s.confirmConnection);
  const cancel = useFlowStore((s) => s.cancelConnection);
  const setDraft = (patch) =>
    useFlowStore.setState({ enhancementDraft: { ...useFlowStore.getState().enhancementDraft, ...patch } });

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
        <p className="text-[0.7rem] text-[#5a5a5e] mt-2 p-2 bg-[#0b0b0c] rounded">
          Prompt: {draft.promptEnhancement || "(automático se vazio)"}
        </p>
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
