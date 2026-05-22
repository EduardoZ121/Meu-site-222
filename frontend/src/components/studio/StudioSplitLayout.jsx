import { cn } from "../../lib/utils";

/**
 * Two-column studio layout: editor (left) + result preview (right, sticky on xl+).
 */
export default function StudioSplitLayout({
  editor,
  result,
  resultWidth = 400,
  breakpoint = "xl",
  gap = "gap-6 xl:gap-8",
  className,
}) {
  const bp = breakpoint === "lg" ? "lg" : "xl";
  const gridClass =
    bp === "lg"
      ? `grid grid-cols-1 lg:grid-cols-[1fr_${resultWidth}px]`
      : `grid grid-cols-1 xl:grid-cols-[1fr_${resultWidth}px]`;

  return (
    <div className={cn("rp-studio-split", gridClass, gap, className)}>
      <div className="rp-studio-split-editor min-w-0">{editor}</div>
      {result != null && <div className="rp-studio-split-result min-w-0">{result}</div>}
    </div>
  );
}
