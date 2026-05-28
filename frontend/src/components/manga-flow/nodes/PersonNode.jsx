import { Handle, Position } from "@xyflow/react";
import { User, GripVertical } from "lucide-react";

export default function PersonNode({ data, selected }) {
  const hasRef = Boolean(data.refImageUrl || data.refImage);
  return (
    <div className={`manga-flow-node manga-flow-node--person ${selected ? "manga-flow-node--selected" : ""}`} data-testid="person-node">
      <Handle type="target" position={Position.Left} className="manga-flow-handle manga-flow-handle--person" />
      <Handle type="source" position={Position.Right} className="manga-flow-handle manga-flow-handle--person" />
      <Handle type="target" position={Position.Top} className="manga-flow-handle manga-flow-handle--person" />
      <Handle type="source" position={Position.Bottom} className="manga-flow-handle manga-flow-handle--person" />
      <div className="manga-flow-node__header manga-flow-node__header--person">
        <User className="w-3.5 h-3.5" />
        <span className="manga-flow-node__type">Person</span>
        <GripVertical className="w-3 h-3 ml-auto opacity-40" />
      </div>
      <div className="manga-flow-node__body">
        {hasRef && (
          <div className="manga-flow-node__thumb">
            <img src={data.refImageUrl || data.refImage} alt="" className="w-full h-full object-cover rounded" />
          </div>
        )}
        <p className="manga-flow-node__name">{data.name || "Unnamed character"}</p>
        {data.emotion && <span className="manga-flow-node__tag manga-flow-node__tag--person">{data.emotion}</span>}
        {data.pose && data.pose !== "talk" && <span className="manga-flow-node__tag manga-flow-node__tag--person">{data.pose}</span>}
        {data.speech && <p className="manga-flow-node__speech">"{data.speech.slice(0, 40)}{data.speech.length > 40 ? "…" : ""}"</p>}
      </div>
    </div>
  );
}
