import { cn } from "../../lib/utils";

/**
 * Section label + content inside editor panels (mono violet cap).
 */
export default function StudioSection({
  title,
  hint,
  children,
  className,
  titleClassName,
  testId,
}) {
  return (
    <section className={cn("rp-studio-section", className)} data-testid={testId}>
      {(title || hint) && (
        <div className="rp-studio-section-head mb-3 sm:mb-4">
          {title && (
            <p className={cn("rp-studio-section-cap", titleClassName)}>{title}</p>
          )}
          {hint && (
            <span
              className={cn(
                "rp-studio-section-hint",
                hint.startsWith("·") && "text-[#C4B5FD] font-medium font-['Inter_Tight'] text-[13px]",
              )}
            >
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
