import { Handle, Position, NodeResizer } from "@xyflow/react";
import { MessageCircle } from "lucide-react";

export default function SpeechNode({ data, selected }) {
  return (
    <div className={`mfn mfn--speech ${selected ? "mfn--sel" : ""}`} data-testid="speech-node">
      <NodeResizer minWidth={140} minHeight={70} maxWidth={350} maxHeight={300} isVisible={selected} lineClassName="mfn-resize-line mfn-resize-line--speech" handleClassName="mfn-resize-handle mfn-resize-handle--speech" />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--speech" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--speech" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--speech" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--speech" />
      <div className="mfn__head mfn__head--speech"><MessageCircle className="w-3.5 h-3.5" /><span>Speech</span></div>
      <div className="mfn__body">
        {data.text ? <p className="mfn__speech">“{data.text.slice(0,50)}{data.text.length>50?"…":""}”</p> : <p className="mfn__desc">Empty bubble</p>}
        <div className="mfn__tags"><span className="mfn__tag mfn__tag--speech">{data.bubbleType||"speech"}</span>{data.style&&data.style!=="normal"&&<span className="mfn__tag mfn__tag--speech">{data.style}</span>}</div>
      </div>
    </div>
  );
}
