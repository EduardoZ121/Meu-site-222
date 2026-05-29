import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Camera } from "lucide-react";

export default function CameraNode({ data, selected }) {
  return (
    <div className={`mfn mfn--camera ${selected ? "mfn--sel" : ""}`} data-testid="camera-node">
      <NodeResizer minWidth={140} minHeight={70} maxWidth={320} maxHeight={300} isVisible={selected} lineClassName="mfn-resize-line mfn-resize-line--camera" handleClassName="mfn-resize-handle mfn-resize-handle--camera" />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--camera" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--camera" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--camera" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--camera" />
      <div className="mfn__head mfn__head--camera"><Camera className="w-3.5 h-3.5" /><span>Camera</span></div>
      <div className="mfn__body">
        <p className="mfn__name">{(data.shotType||"medium").replace(/_/g," ")}</p>
        <div className="mfn__tags"><span className="mfn__tag mfn__tag--camera">{(data.angle||"eye_level").replace(/_/g," ")}</span></div>
        {data.focusTarget&&<p className="mfn__desc">Focus: {data.focusTarget}</p>}
      </div>
    </div>
  );
}
