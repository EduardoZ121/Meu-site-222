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
      style={{ maxWidth }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
