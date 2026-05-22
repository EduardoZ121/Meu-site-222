/** Painel plano com título de secção (layout mockup). */
export default function ArtisticPanelShell({
  title,
  icon: Icon,
  accent = "violet",
  children,
  className = "",
  testId,
  bodyClassName = "",
}) {
  return (
    <div className={`art-panel ${className}`} data-testid={testId}>
      <div className={`art-panel__head art-panel__head--${accent}`}>
        {Icon && (
          <span className="art-panel__icon">
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </span>
        )}
        <h2 className="art-panel__title">{title}</h2>
      </div>
      <div className={`art-panel__body ${bodyClassName}`}>{children}</div>
    </div>
  );
}
