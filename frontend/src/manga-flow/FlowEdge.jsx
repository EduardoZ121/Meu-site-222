import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import { edgeColor } from "./types";
import { useFlowStore } from "./useFlowStore";

function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const selectEdge = useFlowStore((s) => s.selectEdge);
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const stroke = edgeColor(data?.sourceType, data?.targetType);
  const label = (data?.promptEnhancement || "").trim();
  const short = label.length > 28 ? `${label.slice(0, 28)}…` : label || "Ligação";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={20}
        style={{
          stroke,
          strokeWidth: selected ? 3.5 : 2,
          strokeDasharray: data?.generating ? "8 6" : undefined,
          animation: data?.generating ? "mf-flow-dash 0.6s linear infinite" : undefined,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className={`mf-edge-label ${selected ? "mf-edge-label--on" : ""}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              selectEdge(id);
            }}
          >
            🔗 {short}
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(FlowEdge);
