import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Users } from "lucide-react";

/**
 * SupportNode — secondary character ("suporte").
 * Same data shape as PersonNode but visually and semantically distinct so the
 * AI treats it as the SECONDARY character (always reference slot 2 when paired
 * with a primary Person). No conflicts with the primary node.
 */
export default function SupportNode({ data, selected }) {
  const hasRef = Boolean(data.refImageUrl || data.refImage);
  return (
    <div
      className={`mfn mfn--support ${selected ? "mfn--sel" : ""}`}
      data-testid="support-node"
    >
      <NodeResizer
        minWidth={160}
        minHeight={100}
        maxWidth={400}
        maxHeight={500}
        isVisible={selected}
        lineClassName="mfn-resize-line mfn-resize-line--support"
        handleClassName="mfn-resize-handle mfn-resize-handle--support"
      />
      <Handle type="target" position={Position.Left} className="mfn-h mfn-h--support" />
      <Handle type="source" position={Position.Right} className="mfn-h mfn-h--support" />
      <Handle type="target" position={Position.Top} className="mfn-h mfn-h--support" />
      <Handle type="source" position={Position.Bottom} className="mfn-h mfn-h--support" />
      <div className="mfn__head mfn__head--support">
        <Users className="w-3.5 h-3.5" />
        <span>Suporte</span>
      </div>
      {hasRef && (
        <div className="mfn__img">
          <img src={data.refImageUrl || data.refImage} alt="" />
        </div>
      )}
      <div className="mfn__body">
        <p className="mfn__name">{data.name || "Personagem secundário"}</p>
        <div className="mfn__tags">
          <span className="mfn__tag mfn__tag--support">support</span>
          {data.emotion && <span className="mfn__tag mfn__tag--support">{data.emotion}</span>}
          {data.pose && data.pose !== "standing" && (
            <span className="mfn__tag mfn__tag--support">{data.pose.replace(/_/g, " ")}</span>
          )}
        </div>
        {data.speech && (
          <p className="mfn__speech">
            “{data.speech.slice(0, 40)}{data.speech.length > 40 ? "…" : ""}”
          </p>
        )}
      </div>
    </div>
  );
}
