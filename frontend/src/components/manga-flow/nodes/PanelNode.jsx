import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Square } from "lucide-react";

export default function PanelNode({ data, selected }) {
  return (
    <div className={`mfn mfn--panel ${selected ? "mfn--sel" : ""}`} data-testid="panel-node">
      <NodeResizer minWidth={180} minHeight={120} maxWidth={700} maxHeight={800} isVisible={selected} lineClassName="mfn-resize-line mfn-resize-line--panel" handleClassName="mfn-resize-handle mfn-resize-handle--panel" />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--panel" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--panel" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--panel" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--panel" />
      <div className="mfn__head mfn__head--panel"><Square className="w-3.5 h-3.5" /><span>Panel / Frame</span></div>
      <div className="mfn__body">
        <p className="mfn__name">{(data.panelSize||"medium").replace(/_/g," ")} panel</p>
        <div className="mfn__tags">
          <span className="mfn__tag mfn__tag--panel">{data.format||"rectangle"}</span>
          <span className="mfn__tag mfn__tag--panel">{data.borderStyle||"thin"}</span>
        </div>
      </div>
    </div>
  );
}
