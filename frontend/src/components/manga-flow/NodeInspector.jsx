import { useRef, useState } from "react";
import {
  X, Trash2, ImagePlus, Link2, User, MapPin, Box, MessageCircle,
  Sparkles, Camera, Square, ChevronDown, Plus, Eye, EyeOff, Variable,
} from "lucide-react";
import {
  PERSON_POSES, PERSON_EMOTIONS, PERSON_CAMERA,
  SCENARIO_TIME, SCENARIO_WEATHER, SCENARIO_MOOD, SCENARIO_LIGHTING,
  OBJECT_SIZES, OBJECT_STATES,
  SPEECH_TYPES, SPEECH_STYLES, SPEECH_TAILS,
  EFFECT_TYPES, EFFECT_INTENSITY,
  CAMERA_SHOTS, CAMERA_ANGLES,
  PANEL_SIZES, PANEL_FORMATS, PANEL_BORDERS,
} from "./nodeDefaults";

const LAYERS = ["foreground", "midground", "background"];
const ACTION_SPEEDS = ["slow", "normal", "fast", "instant"];
const AMBIENT_FX = ["none", "particles", "fog", "rain_drops", "falling_leaves", "fireflies", "dust", "snow_flakes", "sakura_petals"];
const ENTRY_CONDITIONS = ["none", "fade_in", "slide_left", "slide_right", "zoom_in", "drop"];
const EXIT_CONDITIONS = ["none", "fade_out", "slide_left", "slide_right", "zoom_out", "dissolve"];

/* ======== Shared field components ======== */

function Section({ title, icon, defaultOpen = true, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mfi-section">
      <button onClick={() => setOpen(!open)} className="mfi-section__head" type="button">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          <span className="mfi-section__title">{title}</span>
          {badge && <span className="mfi-section__badge">{badge}</span>}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#5A5A5E] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mfi-section__body">{children}</div>}
    </div>
  );
}

function ImageUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ refImage: file, refImageUrl: URL.createObjectURL(file) });
  };
  return (
    <div className="mfi-field">
      <label className="mfi-label">Reference image</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="mfi-ref-preview">
          <img src={value} alt="" className="mfi-ref-preview__img" />
          <div className="mfi-ref-preview__actions">
            <button onClick={() => inputRef.current?.click()} className="mfi-ref-preview__btn" type="button">Change</button>
            <button onClick={() => onChange({ refImage: null, refImageUrl: null })} className="mfi-ref-preview__btn mfi-ref-preview__btn--danger" type="button">Remove</button>
          </div>
          <p className="mfi-ref-preview__hint">AI will use this as identity/style reference</p>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className="mfi-upload-btn" data-testid="inspector-upload-ref">
          <ImagePlus className="w-5 h-5" /><span>Upload reference</span>
        </button>
      )}
    </div>
  );
}

function Chips({ label, options, value, onChange, hint }) {
  return (
    <div className="mfi-field">
      <label className="mfi-label">{label}</label>
      {hint && <p className="mfi-hint">{hint}</p>}
      <div className="mfi-chips">
        {options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)} className={`manga-flow-chip ${value === opt ? "manga-flow-chip--active" : ""}`}>
            {opt.replace(/_/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline, hint, mono }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className="mfi-field">
      <label className="mfi-label">{label}</label>
      {hint && <p className="mfi-hint">{hint}</p>}
      <Tag value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`mfi-input ${mono ? "font-mono text-[12px]" : ""}`}
        rows={multiline ? 3 : undefined} />
    </div>
  );
}

function Toggle({ label, value, onChange, hint }) {
  return (
    <div className="mfi-field">
      <button onClick={() => onChange(!value)} className="mfi-toggle" type="button">
        <div className={`mfi-toggle__track ${value ? "mfi-toggle__track--on" : ""}`}>
          <div className="mfi-toggle__thumb" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="mfi-toggle__label">{label}</span>
          {hint && <span className="mfi-toggle__hint">{hint}</span>}
        </div>
      </button>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, max = 999, hint }) {
  return (
    <div className="mfi-field">
      <label className="mfi-label">{label}</label>
      {hint && <p className="mfi-hint">{hint}</p>}
      <input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} className="mfi-input mfi-input--num" />
    </div>
  );
}

function ColorPick({ label, value, onChange }) {
  return (
    <div className="mfi-field">
      <label className="mfi-label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#FFFFFF"} onChange={(e) => onChange(e.target.value)} className="mfi-color" />
        <span className="text-[11px] text-[#6B7280] font-mono">{value}</span>
      </div>
    </div>
  );
}

function SubItemList({ label, items, onAdd, onRemove, onUpdate, renderItem }) {
  return (
    <div className="mfi-field">
      <div className="flex items-center justify-between mb-2">
        <label className="mfi-label !mb-0">{label}</label>
        <button onClick={onAdd} className="mfi-sub-add" type="button"><Plus className="w-3 h-3" /> Add</button>
      </div>
      {(items || []).map((item, i) => (
        <div key={i} className="mfi-sub-item">
          {renderItem(item, i, (v) => onUpdate(i, v))}
          <button onClick={() => onRemove(i)} className="mfi-sub-remove" type="button"><X className="w-3 h-3" /></button>
        </div>
      ))}
    </div>
  );
}

/* ======== Type-specific inspectors ======== */

function PersonInspector({ data, onUpdate }) {
  const dialogues = data.dialogues || [];
  return (<>
    <Section title="Identity" icon={<User className="w-3.5 h-3.5 text-[#C4B5FD]" />}>
      <Field label="Name" value={data.name} onChange={(v) => onUpdate({ name: v })} placeholder="Hiro, Sakura, Kai..." />
      <ImageUpload value={data.refImageUrl} onChange={onUpdate} />
      {data.refImageUrl && (
        <Field label="Reference instructions" value={data.refInstructions} onChange={(v) => onUpdate({ refInstructions: v })}
          placeholder="e.g. keep pink hair, scar on left cheek, torn sleeve on left arm..." multiline
          hint="Extra details the AI must preserve from the reference photo" />
      )}
      <Field label="Clothing / Outfit" value={data.clothing} onChange={(v) => onUpdate({ clothing: v })} placeholder="School uniform, armor, casual..." />
    </Section>
    <Section title="Appearance" icon={<Eye className="w-3.5 h-3.5 text-[#C4B5FD]" />}>
      <Chips label="Pose" options={PERSON_POSES} value={data.pose} onChange={(v) => onUpdate({ pose: v })} hint="Body position" />
      <Chips label="Emotion" options={PERSON_EMOTIONS} value={data.emotion} onChange={(v) => onUpdate({ emotion: v })} />
      <Chips label="Camera angle" options={PERSON_CAMERA} value={data.cameraAngle} onChange={(v) => onUpdate({ cameraAngle: v })} />
    </Section>
    <Section title="Action" icon={<Sparkles className="w-3.5 h-3.5 text-[#C4B5FD]" />} defaultOpen={false}>
      <Field label="Action description" value={data.actionDesc} onChange={(v) => onUpdate({ actionDesc: v })} placeholder="Running towards enemy, looking at sky..." multiline />
      <Chips label="Action speed" options={ACTION_SPEEDS} value={data.actionSpeed || "normal"} onChange={(v) => onUpdate({ actionSpeed: v })} />
    </Section>
    <Section title="Dialogue" icon={<MessageCircle className="w-3.5 h-3.5 text-[#C4B5FD]" />} badge={dialogues.length || null} defaultOpen={false}>
      <Field label="Primary speech" value={data.speech} onChange={(v) => onUpdate({ speech: v })} placeholder="What are they saying?" multiline />
      <Chips label="Bubble type" options={SPEECH_TYPES} value={data.speechType} onChange={(v) => onUpdate({ speechType: v })} />
      <SubItemList
        label="Extra dialogues"
        items={dialogues}
        onAdd={() => onUpdate({ dialogues: [...dialogues, { text: "", type: "speech" }] })}
        onRemove={(i) => onUpdate({ dialogues: dialogues.filter((_, idx) => idx !== i) })}
        onUpdate={(i, v) => onUpdate({ dialogues: dialogues.map((d, idx) => idx === i ? { ...d, ...v } : d) })}
        renderItem={(item, i, set) => (
          <div className="flex-1 space-y-1.5">
            <input value={item.text} onChange={(e) => set({ text: e.target.value })} placeholder={`Line ${i + 2}...`} className="mfi-input !py-1.5 !text-[12px]" />
            <div className="mfi-chips">{SPEECH_TYPES.map((t) => <button key={t} onClick={() => set({ type: t })} className={`manga-flow-chip !text-[9px] !py-0.5 !px-2 ${item.type === t ? "manga-flow-chip--active" : ""}`}>{t}</button>)}</div>
          </div>
        )}
      />
    </Section>
    <Section title="Advanced" icon={<Variable className="w-3.5 h-3.5 text-[#5A5A5E]" />} defaultOpen={false}>
      <Chips label="Layer" options={LAYERS} value={data.layer || "midground"} onChange={(v) => onUpdate({ layer: v })} hint="Depth in the panel" />
      <NumberField label="Z-Index" value={data.zIndex ?? 10} onChange={(v) => onUpdate({ zIndex: v })} min={0} max={100} hint="Higher = in front" />
      <Toggle label="Visible in preview" value={data.visible !== false} onChange={(v) => onUpdate({ visible: v })} />
      <Field label="Custom variable" value={data.customVar} onChange={(v) => onUpdate({ customVar: v })} placeholder="estado_sakura = feliz" mono hint="For tracking state across panels" />
      <Field label="AI Prompt override" value={data.promptOverride} onChange={(v) => onUpdate({ promptOverride: v })} placeholder="Specific instructions for AI generation..." multiline hint="Overrides auto-generated prompt for this card" />
    </Section>
  </>);
}

function ScenarioInspector({ data, onUpdate }) {
  return (<>
    <Section title="Place" icon={<MapPin className="w-3.5 h-3.5 text-[#5EEAD4]" />}>
      <Field label="Place name" value={data.name} onChange={(v) => onUpdate({ name: v })} placeholder="Tokyo street, dark forest..." />
      <ImageUpload value={data.refImageUrl} onChange={onUpdate} />
      {data.refImageUrl && (
        <Field label="Reference instructions" value={data.refInstructions} onChange={(v) => onUpdate({ refInstructions: v })}
          placeholder="e.g. same color palette, keep the broken bridge, maintain fog density..." multiline
          hint="Details the AI must preserve from the reference image" />
      )}
      <Field label="Description" value={data.description} onChange={(v) => onUpdate({ description: v })} placeholder="Describe the environment..." multiline />
    </Section>
    <Section title="Atmosphere" icon={<Sparkles className="w-3.5 h-3.5 text-[#5EEAD4]" />}>
      <Chips label="Time of day" options={SCENARIO_TIME} value={data.timeOfDay} onChange={(v) => onUpdate({ timeOfDay: v })} />
      <Chips label="Weather" options={SCENARIO_WEATHER} value={data.weather} onChange={(v) => onUpdate({ weather: v })} />
      <Chips label="Mood" options={SCENARIO_MOOD} value={data.mood} onChange={(v) => onUpdate({ mood: v })} />
      <Chips label="Lighting" options={SCENARIO_LIGHTING} value={data.lighting} onChange={(v) => onUpdate({ lighting: v })} />
    </Section>
    <Section title="Effects & Layers" icon={<Eye className="w-3.5 h-3.5 text-[#5EEAD4]" />} defaultOpen={false}>
      <Chips label="Ambient effect" options={AMBIENT_FX} value={data.ambientFx || "none"} onChange={(v) => onUpdate({ ambientFx: v })} hint="Particle/weather effects overlay" />
      <Field label="Background layer desc." value={data.bgLayerDesc} onChange={(v) => onUpdate({ bgLayerDesc: v })} placeholder="Distant mountains, sky gradient..." hint="Far background elements" />
      <Field label="Midground layer desc." value={data.mgLayerDesc} onChange={(v) => onUpdate({ mgLayerDesc: v })} placeholder="Buildings, trees, furniture..." hint="Middle distance elements" />
      <Field label="Foreground layer desc." value={data.fgLayerDesc} onChange={(v) => onUpdate({ fgLayerDesc: v })} placeholder="Leaves, rain, sparks..." hint="Close to camera elements" />
    </Section>
    <Section title="Conditions" icon={<Variable className="w-3.5 h-3.5 text-[#5A5A5E]" />} defaultOpen={false}>
      <Chips label="Entry transition" options={ENTRY_CONDITIONS} value={data.entryCondition || "none"} onChange={(v) => onUpdate({ entryCondition: v })} />
      <Chips label="Exit transition" options={EXIT_CONDITIONS} value={data.exitCondition || "none"} onChange={(v) => onUpdate({ exitCondition: v })} />
      <NumberField label="Z-Index" value={data.zIndex ?? 0} onChange={(v) => onUpdate({ zIndex: v })} min={0} max={100} />
      <Toggle label="Visible in preview" value={data.visible !== false} onChange={(v) => onUpdate({ visible: v })} />
      <Field label="AI Prompt override" value={data.promptOverride} onChange={(v) => onUpdate({ promptOverride: v })} placeholder="Specific instructions..." multiline />
    </Section>
  </>);
}

function ObjectInspector({ data, onUpdate }) {
  return (<>
    <Section title="Object" icon={<Box className="w-3.5 h-3.5 text-[#FDE68A]" />}>
      <Field label="Name" value={data.name} onChange={(v) => onUpdate({ name: v })} placeholder="Katana, letter, phone..." />
      <ImageUpload value={data.refImageUrl} onChange={onUpdate} />
      <Chips label="Size" options={OBJECT_SIZES} value={data.size} onChange={(v) => onUpdate({ size: v })} />
      <Chips label="State" options={OBJECT_STATES} value={data.state} onChange={(v) => onUpdate({ state: v })} />
      <Field label="Description" value={data.description} onChange={(v) => onUpdate({ description: v })} placeholder="Describe..." multiline />
      <Field label="Interaction" value={data.interaction} onChange={(v) => onUpdate({ interaction: v })} placeholder="Can be held, thrown..." />
    </Section>
    <Section title="Advanced" icon={<Variable className="w-3.5 h-3.5 text-[#5A5A5E]" />} defaultOpen={false}>
      <Chips label="Layer" options={LAYERS} value={data.layer || "midground"} onChange={(v) => onUpdate({ layer: v })} />
      <NumberField label="Z-Index" value={data.zIndex ?? 5} onChange={(v) => onUpdate({ zIndex: v })} min={0} max={100} />
      <Toggle label="Visible in preview" value={data.visible !== false} onChange={(v) => onUpdate({ visible: v })} />
      <Field label="AI Prompt override" value={data.promptOverride} onChange={(v) => onUpdate({ promptOverride: v })} placeholder="Specific instructions..." multiline />
    </Section>
  </>);
}

function SpeechInspector({ data, onUpdate }) {
  return (<>
    <Section title="Dialogue" icon={<MessageCircle className="w-3.5 h-3.5 text-[#93C5FD]" />}>
      <Field label="Text" value={data.text} onChange={(v) => onUpdate({ text: v })} placeholder="Write the dialogue..." multiline />
      <Chips label="Bubble type" options={SPEECH_TYPES} value={data.bubbleType} onChange={(v) => onUpdate({ bubbleType: v })} />
      <Chips label="Style" options={SPEECH_STYLES} value={data.style} onChange={(v) => onUpdate({ style: v })} />
      <Chips label="Tail direction" options={SPEECH_TAILS} value={data.tailDirection} onChange={(v) => onUpdate({ tailDirection: v })} />
    </Section>
    <Section title="Advanced" icon={<Variable className="w-3.5 h-3.5 text-[#5A5A5E]" />} defaultOpen={false}>
      <NumberField label="Z-Index" value={data.zIndex ?? 20} onChange={(v) => onUpdate({ zIndex: v })} min={0} max={100} />
      <Toggle label="Visible in preview" value={data.visible !== false} onChange={(v) => onUpdate({ visible: v })} />
    </Section>
  </>);
}

function EffectInspector({ data, onUpdate }) {
  return (<>
    <Section title="Effect" icon={<Sparkles className="w-3.5 h-3.5 text-[#FDBA74]" />}>
      <Chips label="Type" options={EFFECT_TYPES} value={data.effectType} onChange={(v) => onUpdate({ effectType: v })} />
      <Chips label="Intensity" options={EFFECT_INTENSITY} value={data.intensity} onChange={(v) => onUpdate({ intensity: v })} />
      <ColorPick label="Color" value={data.color} onChange={(v) => onUpdate({ color: v })} />
      <ImageUpload value={data.refImageUrl} onChange={onUpdate} />
    </Section>
    <Section title="Advanced" icon={<Variable className="w-3.5 h-3.5 text-[#5A5A5E]" />} defaultOpen={false}>
      <NumberField label="Z-Index" value={data.zIndex ?? 15} onChange={(v) => onUpdate({ zIndex: v })} min={0} max={100} />
      <Toggle label="Visible in preview" value={data.visible !== false} onChange={(v) => onUpdate({ visible: v })} />
      <Field label="AI Prompt override" value={data.promptOverride} onChange={(v) => onUpdate({ promptOverride: v })} placeholder="Specific effect instructions..." multiline />
    </Section>
  </>);
}

function CameraInspector({ data, onUpdate }) {
  return (<>
    <Section title="Camera" icon={<Camera className="w-3.5 h-3.5 text-[#F9A8D4]" />}>
      <Chips label="Shot type" options={CAMERA_SHOTS} value={data.shotType} onChange={(v) => onUpdate({ shotType: v })} />
      <Chips label="Angle" options={CAMERA_ANGLES} value={data.angle} onChange={(v) => onUpdate({ angle: v })} />
      <Field label="Focus target" value={data.focusTarget} onChange={(v) => onUpdate({ focusTarget: v })} placeholder="Character or element..." />
      <ImageUpload value={data.refImageUrl} onChange={onUpdate} />
    </Section>
  </>);
}

function PanelInspector({ data, onUpdate }) {
  return (<>
    <Section title="Frame" icon={<Square className="w-3.5 h-3.5 text-[#D4D4D4]" />}>
      <Chips label="Size" options={PANEL_SIZES} value={data.panelSize} onChange={(v) => onUpdate({ panelSize: v })} />
      <Chips label="Format" options={PANEL_FORMATS} value={data.format} onChange={(v) => onUpdate({ format: v })} />
      <Chips label="Borders" options={PANEL_BORDERS} value={data.borderStyle} onChange={(v) => onUpdate({ borderStyle: v })} />
      <ImageUpload value={data.refImageUrl} onChange={onUpdate} />
    </Section>
    <Section title="Advanced" icon={<Variable className="w-3.5 h-3.5 text-[#5A5A5E]" />} defaultOpen={false}>
      <NumberField label="Z-Index" value={data.zIndex ?? 0} onChange={(v) => onUpdate({ zIndex: v })} min={0} max={100} />
      <Field label="AI Prompt override" value={data.promptOverride} onChange={(v) => onUpdate({ promptOverride: v })} placeholder="Panel-specific instructions..." multiline />
    </Section>
  </>);
}

/* ======== Main Inspector ======== */

const TYPE_META = {
  person:   { icon: User, label: "Character", color: "#C4B5FD" },
  scenario: { icon: MapPin, label: "Scenario", color: "#5EEAD4" },
  object:   { icon: Box, label: "Object", color: "#FDE68A" },
  speech:   { icon: MessageCircle, label: "Speech", color: "#93C5FD" },
  effect:   { icon: Sparkles, label: "Effect", color: "#FDBA74" },
  camera:   { icon: Camera, label: "Camera", color: "#F9A8D4" },
  panel:    { icon: Square, label: "Panel", color: "#D4D4D4" },
};

const INSPECTORS = {
  person: PersonInspector, scenario: ScenarioInspector, object: ObjectInspector,
  speech: SpeechInspector, effect: EffectInspector, camera: CameraInspector, panel: PanelInspector,
};

export default function NodeInspector({ node, edges, allNodes, onUpdate, onDelete, onClose }) {
  const meta = TYPE_META[node.type] || TYPE_META.object;
  const Icon = meta.icon;
  const Inspector = INSPECTORS[node.type];

  return (
    <div className={`manga-flow-inspector manga-flow-inspector--${node.type}`} data-testid="node-inspector">
      <div className="manga-flow-inspector__header">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
          <span className="manga-flow-inspector__title">{meta.label}</span>
          <span className="manga-flow-inspector__id">{node.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="manga-flow-inspector__action manga-flow-inspector__action--danger" title="Delete" data-testid="inspector-delete"><Trash2 className="w-4 h-4" /></button>
          <button onClick={onClose} className="manga-flow-inspector__action" title="Close" data-testid="inspector-close"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="manga-flow-inspector__body">
        {Inspector && <Inspector data={node.data} onUpdate={onUpdate} />}
        {edges.length > 0 && (
          <Section title="Connections" icon={<Link2 className="w-3.5 h-3.5 text-[#A855F7]" />} badge={edges.length}>
            <div className="space-y-1.5">
              {edges.map((e) => {
                const otherId = e.source === node.id ? e.target : e.source;
                const other = allNodes.find((n) => n.id === otherId);
                const otherMeta = TYPE_META[other?.type] || {};
                return (
                  <div key={e.id} className="manga-flow-inspector__conn">
                    <span className="manga-flow-inspector__conn-name" style={{ color: otherMeta.color }}>{other?.data?.name || other?.data?.text || other?.type || otherId}</span>
                    {e.data?.prompt && <span className="manga-flow-inspector__conn-prompt">{e.data.prompt}</span>}
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
