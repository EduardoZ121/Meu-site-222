import BrandMark from "./BrandMark";

/** Cabeçalho unificado para tools e estúdios — identidade Remake Craft. */
export default function BrandPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  testId = "brand-page-header",
}) {
  return (
    <header className="rp-brand-page-header" data-testid={testId}>
      <div className="rp-brand-accent-line mb-6" aria-hidden />
      {(eyebrow || Icon) && (
        <p className="rp-brand-page-header__eyebrow">
          {Icon ? <Icon className="w-3.5 h-3.5" strokeWidth={1.75} /> : <BrandMark size={14} />}
          {eyebrow}
        </p>
      )}
      <h1 className="rp-brand-page-header__title font-['Inter_Tight']">{title}</h1>
      {description ? (
        <p className="rp-brand-page-header__desc">{description}</p>
      ) : null}
    </header>
  );
}
