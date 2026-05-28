import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Box } from "lucide-react";

export default function ObjectNode({ data, selected }) {
  const hasRef = Boolean(data.refImageUrl || data.refImage);
  return (
    <div className={`mfn mfn--object ${selected ? "mfn--sel" : ""}`} data-testid="object-node">
      <NodeResizer minWidth={150} minHeight={80} maxWidth={350} maxHeight={400} isVisible={selected} lineClassName="mfn-resize-line mfn-resize-line--object" handleClassName="mfn-resize-handle mfn-resize-handle--object" />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--object" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--object" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--object" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--object" />
      <div className="mfn__head mfn__head--object"><Box className="w-3.5 h-3.5" /><span>Object</span></div>
      {hasRef && <div className="mfn__img"><img src={data.refImageUrl||data.refImage} alt="" /></div>}
      <div className="mfn__body">
        <p className="mfn__name">{data.name||"Unnamed object"}</p>
        <div className="mfn__tags">
          {data.size && data.size!=="medium" && <span className="mfn__tag mfn__tag--object">{data.size}</span>}
          {data.state && data.state!=="normal" && <span className="mfn__tag mfn__tag--object">{data.state.replace(/_/g," ")}</span>}
        </div>
        {data.description && <p className="mfn__desc">{data.description.slice(0,50)}{data.description.length>50?"…":""}</p>}
      </div>
    </div>
  );
}
