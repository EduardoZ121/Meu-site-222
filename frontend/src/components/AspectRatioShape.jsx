import { cn } from "../lib/utils";

/** Dimensões do ícone (px) dentro de uma caixa máxima, preservando proporção. */
export function aspectShapeDimensions(ratio, max = 22) {
  const [wR, hR] = String(ratio || "1:1")
    .split(":")
    .map((n) => parseFloat(n) || 1);
  const aspect = wR / hR;
  if (aspect >= 1) {
    const w = max;
    const h = Math.max(6, Math.round(max / aspect));
    return { w, h };
  }
  const h = max;
  const w = Math.max(6, Math.round(max * aspect));
  return { w, h };
}

/**
 * Ícone visual de proporção (retângulo proporcional, sem parecer círculo em 1:1).
 */
export function AspectRatioShape({
  ratio,
  active = false,
  maxSize = 22,
  className,
}) {
  if (ratio === "match" || ratio === "match_input_image" || ratio === "original") {
    return <AspectRatioPhotoIcon active={active} className={className} />;
  }

  const { w, h } = aspectShapeDimensions(ratio, maxSize);
  const square = w === h;

  return (
    <span
      className={cn(
        "inline-block shrink-0 box-border border-[1.5px]",
        square ? "rounded-[1px]" : "rounded-[2px]",
        active ? "border-[#C4B5FD]" : "border-[#5A5A5E]",
        className,
      )}
      style={{ width: w, height: h }}
      aria-hidden
    />
  );
}

export function AspectRatioPhotoIcon({ active = false, className }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center w-[22px] h-[17px] border-[1.5px] rounded-[2px]",
        active ? "border-[#C4B5FD]" : "border-[#5A5A5E]",
        className,
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute right-[3px] top-[3px] w-[5px] h-[5px] rounded-[1px]",
          active ? "bg-[#C4B5FD]" : "bg-[#5A5A5E]",
        )}
      />
      <span
        className={cn(
          "absolute bottom-[2px] left-[2px] right-[2px] h-[5px] border-t-[1.5px]",
          active ? "border-[#C4B5FD]" : "border-[#5A5A5E]",
        )}
        style={{ clipPath: "polygon(0 100%, 28% 52%, 58% 78%, 100% 28%, 100% 100%)" }}
      />
    </span>
  );
}
