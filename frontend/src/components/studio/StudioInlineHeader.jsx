/**
 * Cabeçalho de página do estúdio — oculto no telemóvel (título já está na top bar).
 */
export default function StudioInlineHeader({ eyebrow, title, description, testId }) {
  return (
    <header
      className="rp-studio-inline-header mb-4 md:mb-8 pb-4 md:pb-6 border-b border-white/[0.06]"
      data-testid={testId}
    >
      {eyebrow ? <p className="rp-editor-section-cap mb-1.5">{eyebrow}</p> : null}
      {title ? (
        <h1 className="rp-studio-page-title mb-2 font-['Inter_Tight'] text-[1.35rem] md:text-[2rem]">
          {title}
        </h1>
      ) : null}
      {description ? (
        <p className="rp-studio-page-desc text-[13px] md:text-[15px] leading-snug">{description}</p>
      ) : null}
    </header>
  );
}
