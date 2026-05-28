import { useRef } from "react";
import { X, Trash2, Upload, User, MapPin, Box, Link2, ImagePlus } from "lucide-react";

const POSES = ["talk", "run", "think", "surprise", "attack", "sit", "stand", "crouch", "jump", "lean"];
const EMOTIONS = ["normal", "happy", "sad", "angry", "fear", "shy", "determined", "shocked", "smirk", "crying"];
const SPEECH_TYPES = ["speech", "thought", "shout", "whisper", "narration"];
const TIMES = ["day", "night", "sunset", "dawn", "midnight", "noon"];
const WEATHER = ["clear", "rain", "snow", "fog", "storm", "wind"];
const MOODS = ["neutral", "tense", "romantic", "mysterious", "epic", "calm", "chaotic", "melancholic"];
const SIZES = ["tiny", "small", "medium", "large", "huge"];

function ImageUpload({ value, onChange, label }) {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ refImage: file, refImageUrl: url });
  };
  return (
    <div className="manga-flow-inspector__field">
      <label className="manga-flow-inspector__label">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="manga-flow-inspector__img-wrap">
          <img src={value} alt="" className="manga-flow-inspector__img" />
          <button onClick={() => { onChange({ refImage: null, refImageUrl: null }); }} className="manga-flow-inspector__img-clear"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className="manga-flow-inspector__upload-btn" data-testid="inspector-upload-ref">
          <ImagePlus className="w-5 h-5" />
          <span>Upload reference</span>
        </button>
      )}
    </div>
  );
}

function ChipSelect({ label, options, value, onChange }) {
  return (
    <div className="manga-flow-inspector__field">
      <label className="manga-flow-inspector__label">{label}</label>
      <div className="manga-flow-inspector__chips">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`manga-flow-chip ${value === opt ? "manga-flow-chip--active" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className="manga-flow-inspector__field">
      <label className="manga-flow-inspector__label">{label}</label>
      <Tag
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="manga-flow-inspector__input"
        rows={multiline ? 3 : undefined}
      />
    </div>
  );
}

function PersonInspector({ data, onUpdate }) {
  return (
    <>
      <TextField label="Character name" value={data.name} onChange={(v) => onUpdate({ name: v })} placeholder="e.g. Hiro, Sakura..." />
      <ImageUpload label="Reference photo" value={data.refImageUrl} onChange={onUpdate} />
      <ChipSelect label="Pose" options={POSES} value={data.pose} onChange={(v) => onUpdate({ pose: v })} />
      <ChipSelect label="Emotion" options={EMOTIONS} value={data.emotion} onChange={(v) => onUpdate({ emotion: v })} />
      <TextField label="Speech bubble" value={data.speech} onChange={(v) => onUpdate({ speech: v })} placeholder="What are they saying?" multiline />
      <ChipSelect label="Bubble type" options={SPEECH_TYPES} value={data.speechType} onChange={(v) => onUpdate({ speechType: v })} />
      <TextField label="Clothing" value={data.clothing} onChange={(v) => onUpdate({ clothing: v })} placeholder="School uniform, armor, casual..." />
    </>
  );
}

function ScenarioInspector({ data, onUpdate }) {
  return (
    <>
      <TextField label="Place name" value={data.name} onChange={(v) => onUpdate({ name: v })} placeholder="e.g. Tokyo street, dark forest..." />
      <ImageUpload label="Reference image" value={data.refImageUrl} onChange={onUpdate} />
      <ChipSelect label="Time of day" options={TIMES} value={data.timeOfDay} onChange={(v) => onUpdate({ timeOfDay: v })} />
      <ChipSelect label="Weather" options={WEATHER} value={data.weather} onChange={(v) => onUpdate({ weather: v })} />
      <ChipSelect label="Mood" options={MOODS} value={data.mood} onChange={(v) => onUpdate({ mood: v })} />
      <TextField label="Description" value={data.description} onChange={(v) => onUpdate({ description: v })} placeholder="Describe the environment..." multiline />
    </>
  );
}

function ObjectInspector({ data, onUpdate }) {
  return (
    <>
      <TextField label="Object name" value={data.name} onChange={(v) => onUpdate({ name: v })} placeholder="e.g. Katana, letter, phone..." />
      <ImageUpload label="Reference image" value={data.refImageUrl} onChange={onUpdate} />
      <ChipSelect label="Size" options={SIZES} value={data.size} onChange={(v) => onUpdate({ size: v })} />
      <TextField label="Description" value={data.description} onChange={(v) => onUpdate({ description: v })} placeholder="Describe the object..." multiline />
    </>
  );
}

export default function NodeInspector({ node, edges, allNodes, onUpdate, onDelete, onClose }) {
  const typeIcon = node.type === "person" ? <User className="w-4 h-4" /> : node.type === "scenario" ? <MapPin className="w-4 h-4" /> : <Box className="w-4 h-4" />;
  const typeLabel = node.type === "person" ? "Character" : node.type === "scenario" ? "Scenario" : "Object";
  const typeClass = `manga-flow-inspector--${node.type}`;

  return (
    <div className={`manga-flow-inspector ${typeClass}`} data-testid="node-inspector">
      <div className="manga-flow-inspector__header">
        <div className="flex items-center gap-2">
          {typeIcon}
          <span className="manga-flow-inspector__title">{typeLabel}</span>
          <span className="manga-flow-inspector__id">{node.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="manga-flow-inspector__action manga-flow-inspector__action--danger" data-testid="inspector-delete"><Trash2 className="w-4 h-4" /></button>
          <button onClick={onClose} className="manga-flow-inspector__action" data-testid="inspector-close"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="manga-flow-inspector__body">
        {node.type === "person" && <PersonInspector data={node.data} onUpdate={onUpdate} />}
        {node.type === "scenario" && <ScenarioInspector data={node.data} onUpdate={onUpdate} />}
        {node.type === "object" && <ObjectInspector data={node.data} onUpdate={onUpdate} />}
        {edges.length > 0 && (
          <div className="manga-flow-inspector__field">
            <label className="manga-flow-inspector__label flex items-center gap-1"><Link2 className="w-3 h-3" /> Connections</label>
            <div className="space-y-1.5">
              {edges.map((e) => {
                const otherId = e.source === node.id ? e.target : e.source;
                const other = allNodes.find((n) => n.id === otherId);
                return (
                  <div key={e.id} className="manga-flow-inspector__conn">
                    <span className="manga-flow-inspector__conn-name">{other?.data?.name || otherId}</span>
                    {e.data?.prompt && <span className="manga-flow-inspector__conn-prompt">{e.data.prompt}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
