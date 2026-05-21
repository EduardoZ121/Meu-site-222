import { Handle, Position } from "reactflow";
import { User, MapPin, Package, Sparkles, Camera, MessageSquare, Layers } from "lucide-react";

const TYPE_META = {
  personagem: { icon: User,          color: "#7C3AED", label: "Personagem" },
  cenario:    { icon: MapPin,        color: "#06B6D4", label: "Cenário" },
  objeto:     { icon: Package,       color: "#F59E0B", label: "Objeto" },
  efeito:     { icon: Sparkles,      color: "#EC4899", label: "Efeito" },
  camera:     { icon: Camera,        color: "#10B981", label: "Câmera" },
  texto:      { icon: MessageSquare, color: "#3B82F6", label: "Balão" },
  grupo:      { icon: Layers,        color: "#A855F7", label: "Grupo" },
};

function NodeShell({ type, data, selected }) {
  const meta = TYPE_META[type] || TYPE_META.personagem;
  const Icon = meta.icon;
  const previewLines = [];
  if (type === "personagem") {
    if (data.appearance) previewLines.push(data.appearance);
    if (data.pose) previewLines.push(`Pose: ${data.pose}`);
  } else if (type === "cenario") {
    previewLines.push(`${data.lighting || "natural"} · ${data.time || "day"}`);
    if (data.weather) previewLines.push(data.weather);
  } else if (type === "objeto") {
    if (data.state) previewLines.push(data.state);
  } else if (type === "efeito") {
    previewLines.push(`${data.kind || "smoke"} · ${data.intensity || 0}%`);
  } else if (type === "camera") {
    previewLines.push(`${data.shot || "medium"} · ${data.lens || "50mm"}`);
  } else if (type === "texto") {
    if (data.content) previewLines.push(`"${data.content.slice(0, 40)}"`);
  }

  return (
    <div
      className="rounded-xl bg-[#16161A] border min-w-[200px] max-w-[240px] shadow-lg overflow-hidden transition-all"
      style={{
        borderColor: selected ? meta.color : "#2E2E30",
        boxShadow: selected ? `0 0 0 2px ${meta.color}33, 0 8px 30px ${meta.color}22` : undefined,
      }}
      data-testid={`scene-node-${type}`}
    >
      <Handle type="target" position={Position.Left} style={{ background: meta.color, width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: meta.color, width: 10, height: 10 }} />

      <div
        className="px-3 py-2 flex items-center gap-2 border-b"
        style={{ background: `${meta.color}14`, borderColor: "#2E2E30" }}
      >
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>

      <div className="p-3">
        <div className="text-white text-sm font-medium truncate mb-1">{data.label || meta.label}</div>
        {previewLines.length > 0 ? (
          previewLines.slice(0, 2).map((line, i) => (
            <div key={i} className="text-[#9CA3AF] text-xs truncate">{line}</div>
          ))
        ) : (
          <div className="text-[#5A5A5E] text-xs italic">Clica para configurar</div>
        )}
      </div>
    </div>
  );
}

export const CharacterNode = (p) => <NodeShell type="personagem" {...p} />;
export const SceneNode     = (p) => <NodeShell type="cenario"    {...p} />;
export const ObjectNode    = (p) => <NodeShell type="objeto"     {...p} />;
export const EffectNode    = (p) => <NodeShell type="efeito"     {...p} />;
export const CameraNode    = (p) => <NodeShell type="camera"     {...p} />;
export const TextNode      = (p) => <NodeShell type="texto"      {...p} />;
export const GroupNode     = (p) => <NodeShell type="grupo"      {...p} />;

export const nodeTypes = {
  personagem: CharacterNode,
  cenario:    SceneNode,
  objeto:     ObjectNode,
  efeito:     EffectNode,
  camera:     CameraNode,
  texto:      TextNode,
  grupo:      GroupNode,
};

export { TYPE_META };
