import { Handle, Position, NodeResizer } from "@xyflow/react";
import { User } from "lucide-react";

export default function PersonNode({ data, selected }) {
  const hasRef = Boolean(data.refImageUrl || data.refImage);
  return (
    <div className={`mfn mfn--person ${selected ? "mfn--sel" : ""}`} data-testid="person-node">
      <NodeResizer minWidth={160} minHeight={100} maxWidth={400} maxHeight={500} isVisible={selected} lineClassName="mfn-resize-line mfn-resize-line--person" handleClassName="mfn-resize-handle mfn-resize-handle--person" />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--person" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--person" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--person" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--person" />
      <div className="mfn__head mfn__head--person"><User className="w-3.5 h-3.5" /><span>Person</span></div>
      {hasRef && <div className="mfn__img"><img src={data.refImageUrl||data.refImage} alt="" /></div>}
      <div className="mfn__body">
        <p className="mfn__name">{data.name||"Unnamed character"}</p>
        <div className="mfn__tags">
          {data.emotion && <span className="mfn__tag mfn__tag--person">{data.emotion}</span>}
          {data.pose && data.pose!=="standing" && <span className="mfn__tag mfn__tag--person">{data.pose.replace(/_/g," ")}</span>}
        </div>
        {data.speech && <p className="mfn__speech">“{data.speech.slice(0,40)}{data.speech.length>40?"…":""}”</p>}
      </div>
    </div>
  );
}
