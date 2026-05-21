import { BaseEdge, getBezierPath } from "@xyflow/react";
import { edgeColor } from "./types";

export default function FlowEdge({
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
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const stroke = edgeColor(data?.sourceType, data?.targetType);

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke,
        strokeWidth: selected ? 3 : 2,
        strokeDasharray: data?.generating ? "6 4" : undefined,
      }}
    />
  );
}
