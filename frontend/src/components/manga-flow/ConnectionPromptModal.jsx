import { useState, useMemo } from "react";
import { Link2, X, Pencil, Zap, GitBranch } from "lucide-react";
import { getDefaultSemanticPrompt } from "../../lib/mangaFlowSemantics";

const CONDITION_FIELDS = ["emotion", "pose", "state", "timeOfDay", "weather", "mood", "visible"];
const CONDITION_OPS = ["=", "!=", "contains"];

export default function ConnectionPromptModal({ source, target, initialPrompt, initialCondition, isEditing, onConfirm, onCancel }) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [showCondition, setShowCondition] = useState(Boolean(initialCondition?.field));
  const [condition, setCondition] = useState(initialCondition || { field: "emotion", op: "=", value: "" });
  const sourceName = source?.data?.name || source?.data?.text || source?.type || "?";
  const targetName = target?.data?.name || target?.data?.text || target?.type || "?";
  const suggestions = getSuggestions(source?.type, target?.type);
  const defaultSemantic = useMemo(
    () => (source && target ? getDefaultSemanticPrompt(source, target) : ""),
    [source, target],
  );

  const handleConfirm = () => {
    onConfirm(prompt, showCondition && condition.value ? condition : null);
  };

  return (
    <div className="manga-flow-modal-overlay" onClick={onCancel} data-testid="connection-prompt-modal">
      <div className="manga-flow-modal manga-flow-modal--connection" onClick={(e) => e.stopPropagation()}>
        <div className="manga-flow-modal__header">
          {isEditing ? <Pencil className="w-5 h-5 text-[#A855F7]" /> : <Link2 className="w-5 h-5 text-[#A855F7]" />}
          <h3 className="manga-flow-modal__title">{isEditing ? "Edit interaction" : "Describe the interaction"}</h3>
          <button onClick={onCancel} className="manga-flow-modal__close"><X className="w-4 h-4" /></button>
        </div>

        <div className="manga-flow-conn-visual">
          <div className={`manga-flow-conn-badge manga-flow-conn-badge--${source?.type}`}>
            <span className="manga-flow-conn-badge__type">{source?.type}</span>
            <span className="manga-flow-conn-badge__name">{sourceName}</span>
          </div>
          <div className="manga-flow-conn-arrow">
            <div className="manga-flow-conn-arrow__line" />
            <Zap className="w-4 h-4 text-[#A855F7]" />
            <div className="manga-flow-conn-arrow__line" />
          </div>
          <div className={`manga-flow-conn-badge manga-flow-conn-badge--${target?.type}`}>
            <span className="manga-flow-conn-badge__type">{target?.type}</span>
            <span className="manga-flow-conn-badge__name">{targetName}</span>
          </div>
        </div>

        <div className="manga-flow-conn-input-wrap">
          <label className="manga-flow-conn-input-label">What is happening between them? (optional)</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 'They are hugging under the rain'..."
            className="manga-flow-conn-textarea" rows={3} autoFocus data-testid="connection-prompt-input" />
        </div>

        {defaultSemantic && (
          <div className="manga-flow-conn-semantic">
            <p className="manga-flow-conn-semantic__label">AI semantic layer (always applied)</p>
            <p className="manga-flow-conn-semantic__text">{defaultSemantic}</p>
            <p className="manga-flow-conn-semantic__hint">Even if you leave the box empty, the AI receives this hidden instruction.</p>
          </div>
        )}

        {/* Condition */}
        <div className="manga-flow-conn-cond-wrap">
          <button onClick={() => setShowCondition(!showCondition)} className="manga-flow-conn-cond-toggle" type="button">
            <GitBranch className="w-3.5 h-3.5" />
            <span>{showCondition ? "Remove condition" : "Add condition"}</span>
          </button>
          {showCondition && (
            <div className="manga-flow-conn-cond">
              <p className="manga-flow-conn-cond__label">If condition is met:</p>
              <div className="manga-flow-conn-cond__row">
                <select value={condition.field} onChange={(e) => setCondition({ ...condition, field: e.target.value })} className="manga-flow-conn-cond__select">
                  {CONDITION_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={condition.op} onChange={(e) => setCondition({ ...condition, op: e.target.value })} className="manga-flow-conn-cond__select manga-flow-conn-cond__select--sm">
                  {CONDITION_OPS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <input value={condition.value} onChange={(e) => setCondition({ ...condition, value: e.target.value })}
                  placeholder="angry, happy..." className="manga-flow-conn-cond__input" />
              </div>
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="manga-flow-conn-suggestions">
            <p className="manga-flow-conn-suggestions__label">Quick suggestions:</p>
            <div className="manga-flow-conn-suggestions__grid">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setPrompt(s)} className={`manga-flow-conn-chip ${prompt === s ? "manga-flow-conn-chip--active" : ""}`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="manga-flow-modal__actions">
          <button onClick={onCancel} className="manga-flow-btn">Cancel</button>
          <button onClick={handleConfirm} className="manga-flow-btn manga-flow-btn-primary" data-testid="connection-prompt-confirm">
            {isEditing ? <><Pencil className="w-4 h-4" /> Update</> : <><Link2 className="w-4 h-4" /> Connect</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function getSuggestions(sourceType, targetType) {
  const s = sourceType; const t = targetType;
  if (s === "person" && t === "person") return ["They are talking","They are fighting","They are hugging","Walking together","Chasing the other","Arguing intensely","Looking at each other","Standing back to back","Shaking hands","Protecting the other"];
  if (s === "person" && t === "scenario") return ["Standing here","Walking through","Running away from","Arriving at","Hiding in","Looking at the view","Sitting inside","Falling from","Flying over"];
  if (s === "person" && t === "object") return ["Holding it","Using it","Looking at it","Throwing it","Reaching for it","Dropping it","Breaking it","Receiving it","Hiding it"];
  if (s === "person" && t === "speech") return ["Saying this","Thinking this","Screaming this","Whispering this"];
  if (s === "person" && t === "effect") return ["Surrounded by effect","Generating this effect","Hit by this effect"];
  if (s === "person" && t === "camera") return ["Is the focus of this shot","Framed by this angle"];
  if (s === "scenario" && t === "person") return ["Person is inside","Person is entering","Person is leaving","Person is trapped here"];
  if (s === "effect" && t === "person") return ["Hitting the character","Surrounding the character","Following the character"];
  if (s === "camera" && t === "person") return ["Focusing on this character","Following this character"];
  if (s === "panel" || t === "panel") return ["Belongs to this panel","Placed inside this frame","Fills this panel"];
  return ["Connected","Related to","Part of the scene","Interacting with"];
}
