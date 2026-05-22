import { cn } from "../../lib/utils";

/**
 * Content shell for studio sessions. Title lives in StudioTopBar — here we only show
 * optional description and session body (avoids duplicate H1 on desktop).
 */
export default function StudioSessionShell({
  children,
  testId,
  description,
  icon: Icon,
  maxWidth = "1400px",
  withStickyCta = false,
  className,
}) {
  return (
    <div
      className={cn(
        "rp-studio-session w-full mx-auto",
        withStickyCta && "rp-studio-session--sticky pb-28 sm:pb-32",
        className,
      )}
      style={{ maxWidth }}
      data-testid={testId}
    >
      {(description || Icon) && (
        <div className="rp-studio-session-intro">
          {Icon && (
            <div className="rp-studio-session-icon" aria-hidden>
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </div>
          )}
          {description && <p className="rp-studio-session-desc">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
