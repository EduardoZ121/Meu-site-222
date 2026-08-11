import StudioHelpTip from "../studio/StudioHelpTip";

/** Wrapper visual para módulos Estilo / Efeitos / Prompt */
export default function ArtisticStudioModule({
  title,
  subtitle,
  icon: Icon,
  accent = "violet",
  step,
  children,
  className = "",
  hiddenOnMobile = false,
  testId,
  helpKey,
}) {
  const accentClass =
    accent === "cyan" ? "art-studio-module--cyan" : accent === "pink" ? "art-studio-module--pink" : "";

  return (
    <section
      className={`art-studio-module ${accentClass} ${hiddenOnMobile ? "" : ""} ${className}`}
      data-testid={testId}
    >
      <div className="art-studio-module__head">
        {Icon && (
          <span className="art-studio-module__icon">
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="art-studio-module__title">
                {step != null && (
                  <span className="text-[#A855F7] font-mono text-[11px] mr-2 tabular-nums">{step}.</span>
                )}
                {title}
              </h2>
              {subtitle && <p className="art-studio-module__subtitle">{subtitle}</p>}
            </div>
            {helpKey ? (
              <StudioHelpTip helpKey={helpKey} size="lg" testId={`${testId}-help`} className="shrink-0 mt-0.5" />
            ) : null}
          </div>
        </div>
      </div>
      <div className="art-studio-module__body">{children}</div>
    </section>
  );
}
