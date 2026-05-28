import { Handle, Position } from "@xyflow/react";
import { MapPin, GripVertical } from "lucide-react";

export default function ScenarioNode({ data, selected }) {
  const hasRef = Boolean(data.refImageUrl || data.refImage);
  return (
    <div className={`manga-flow-node manga-flow-node--scenario ${selected ? "manga-flow-node--selected" : ""}`} data-testid="scenario-node">
      <Handle type="target" position={Position.Left} className="manga-flow-handle manga-flow-handle--scenario" />
      <Handle type="source" position={Position.Right} className="manga-flow-handle manga-flow-handle--scenario" />
      <Handle type="target" position={Position.Top} className="manga-flow-handle manga-flow-handle--scenario" />
      <Handle type="source" position={Position.Bottom} className="manga-flow-handle manga-flow-handle--scenario" />
      <div className="manga-flow-node__header manga-flow-node__header--scenario">
        <MapPin className="w-3.5 h-3.5" />
        <span className="manga-flow-node__type">Scenario</span>
        <GripVertical className="w-3 h-3 ml-auto opacity-40" />
      </div>
      <div className="manga-flow-node__body">
        {hasRef && (
          <div className="manga-flow-node__thumb">
            <img src={data.refImageUrl || data.refImage} alt="" className="w-full h-full object-cover rounded" />
          </div>
        )}
        <p className="manga-flow-node__name">{data.name || "Unnamed place"}</p>
        {data.timeOfDay && <span className="manga-flow-node__tag manga-flow-node__tag--scenario">{data.timeOfDay}</span>}
        {data.weather && data.weather !== "clear" && <span className="manga-flow-node__tag manga-flow-node__tag--scenario">{data.weather}</span>}
        {data.description && <p className="manga-flow-node__desc">{data.description.slice(0, 50)}{data.description.length > 50 ? "…" : ""}</p>}
      </div>
    </div>
  );
}
