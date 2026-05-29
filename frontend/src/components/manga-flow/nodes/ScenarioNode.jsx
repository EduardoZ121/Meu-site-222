import { Handle, Position, NodeResizer } from "@xyflow/react";
import { MapPin } from "lucide-react";

export default function ScenarioNode({ data, selected }) {
  const hasRef = Boolean(data.refImageUrl || data.refImage);
  return (
    <div className={`mfn mfn--scenario ${selected ? "mfn--sel" : ""}`} data-testid="scenario-node">
      <NodeResizer minWidth={160} minHeight={100} maxWidth={400} maxHeight={500} isVisible={selected} lineClassName="mfn-resize-line mfn-resize-line--scenario" handleClassName="mfn-resize-handle mfn-resize-handle--scenario" />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--scenario" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--scenario" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--scenario" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--scenario" />
      <div className="mfn__head mfn__head--scenario"><MapPin className="w-3.5 h-3.5" /><span>Scenario</span></div>
      {hasRef && <div className="mfn__img"><img src={data.refImageUrl||data.refImage} alt="" /></div>}
      <div className="mfn__body">
        <p className="mfn__name">{data.name||"Unnamed place"}</p>
        <div className="mfn__tags">
          {data.timeOfDay && <span className="mfn__tag mfn__tag--scenario">{data.timeOfDay}</span>}
          {data.weather && data.weather!=="clear" && <span className="mfn__tag mfn__tag--scenario">{data.weather}</span>}
          {data.mood && data.mood!=="neutral" && <span className="mfn__tag mfn__tag--scenario">{data.mood}</span>}
        </div>
        {data.description && <p className="mfn__desc">{data.description.slice(0,50)}{data.description.length>50?"…":""}</p>}
      </div>
    </div>
  );
}
