import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Sparkles } from "lucide-react";

export default function EffectNode({ data, selected }) {
  return (
    <div className={`mfn mfn--effect ${selected ? "mfn--sel" : ""}`} data-testid="effect-node">
      <NodeResizer minWidth={140} minHeight={70} maxWidth={320} maxHeight={300} isVisible={selected} lineClassName="mfn-resize-line mfn-resize-line--effect" handleClassName="mfn-resize-handle mfn-resize-handle--effect" />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--effect" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--effect" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--effect" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--effect" />
      <div className="mfn__head mfn__head--effect"><Sparkles className="w-3.5 h-3.5" /><span>Effect</span></div>
      <div className="mfn__body">
        <p className="mfn__name">{(data.effectType||"motion_lines").replace(/_/g," ")}</p>
        <div className="mfn__tags"><span className="mfn__tag mfn__tag--effect">{data.intensity||"medium"}</span>{data.color&&data.color!=="#FFFFFF"&&<span className="mfn__tag mfn__tag--effect" style={{color:data.color}}>● {data.color}</span>}</div>
      </div>
    </div>
  );
}
