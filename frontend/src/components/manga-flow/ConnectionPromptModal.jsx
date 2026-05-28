import { useState } from "react";
import { Link2, X, ArrowRight } from "lucide-react";

export default function ConnectionPromptModal({ source, target, onConfirm, onCancel }) {
  const [prompt, setPrompt] = useState("");
  const sourceName = source?.data?.name || source?.type || "?";
  const targetName = target?.data?.name || target?.type || "?";

  const suggestions = getSuggestions(source?.type, target?.type);

  return (
    <div className="manga-flow-modal-overlay" onClick={onCancel} data-testid="connection-prompt-modal">
      <div className="manga-flow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="manga-flow-modal__header">
          <Link2 className="w-5 h-5 text-[#A855F7]" />
          <h3 className="manga-flow-modal__title">Describe the connection</h3>
          <button onClick={onCancel} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
        </div>

        <div className="manga-flow-modal__connection">
          <span className={`manga-flow-modal__node-badge manga-flow-modal__node-badge--${source?.type}`}>{sourceName}</span>
          <ArrowRight className="w-4 h-4 text-[#5A5A5E]" />
          <span className={`manga-flow-modal__node-badge manga-flow-modal__node-badge--${target?.type}`}>{targetName}</span>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What is happening? e.g. 'They are talking', 'She is holding it', 'He is standing here'..."
          className="manga-flow-modal__textarea"
          rows={3}
          autoFocus
          data-testid="connection-prompt-input"
        />

        {suggestions.length > 0 && (
          <div className="manga-flow-modal__suggestions">
            <p className="manga-flow-modal__suggestions-label">Quick suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setPrompt(s)} className="manga-flow-modal__suggestion-chip">{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="manga-flow-modal__actions">
          <button onClick={onCancel} className="manga-flow-btn">Cancel</button>
          <button onClick={() => onConfirm(prompt)} className="manga-flow-btn manga-flow-btn-primary" data-testid="connection-prompt-confirm">
            <Link2 className="w-4 h-4" /> Connect
          </button>
        </div>
      </div>
    </div>
  );
}

function getSuggestions(sourceType, targetType) {
  if (sourceType === "person" && targetType === "person") {
    return ["They are talking", "They are fighting", "They are hugging", "They are walking together", "One is chasing the other", "They are arguing"];
  }
  if (sourceType === "person" && targetType === "scenario") {
    return ["Standing here", "Walking through", "Running away from", "Arriving at", "Hiding in", "Looking at the view"];
  }
  if (sourceType === "person" && targetType === "object") {
    return ["Holding it", "Using it", "Looking at it", "Throwing it", "Reaching for it", "Dropping it"];
  }
  if (sourceType === "scenario" && targetType === "person") {
    return ["Person is inside", "Person is entering", "Person is leaving"];
  }
  return ["Connected", "Related to", "Part of the scene"];
}
