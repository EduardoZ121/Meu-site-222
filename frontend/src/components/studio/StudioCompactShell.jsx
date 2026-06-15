import { cn } from "../../lib/utils";

/**
 * Wrapper compacto para páginas de estúdio (mobile-first, estilo OpenArt).
 * Título grande fica no StudioTopBar — evita header duplicado no scroll.
 */
export default function StudioCompactShell({
  children,
  testId,
  className = "",
  maxWidth = "1200px",
}) {
  return (
    <div
      className={cn("rp-studio-compact-page mx-auto w-full", className)}
      style={{
        // Mobile: largura total; desktop: limite do ecrã
        maxWidth: maxWidth
          ? `min(100%, ${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth})`
          : undefined,
      }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
