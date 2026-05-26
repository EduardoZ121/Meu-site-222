/** Wrapper visual para módulos Estilo / Efeitos / Prompt */
export default function ArtisticStudioModule({
  title,
  subtitle,
  icon: Icon,
  accent = "violet",
  children,
  className = "",
  hiddenOnMobile = false,
  testId,
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
        <div className="min-w-0">
          <h2 className="art-studio-module__title">{title}</h2>
          {subtitle && <p className="art-studio-module__subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="art-studio-module__body">{children}</div>
    </section>
  );
}
