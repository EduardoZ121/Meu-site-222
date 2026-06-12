/**
 * Cabeçalho de página do estúdio — oculto no telemóvel (título já está na top bar).
 */
import StudioHelpTip from "./StudioHelpTip";

export default function StudioInlineHeader({ eyebrow, title, description, testId, helpKey }) {
  return (
    <header
      className="rp-studio-inline-header mb-4 md:mb-8 pb-4 md:pb-6 border-b border-white/[0.06]"
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {eyebrow ? <p className="rp-editor-section-cap mb-1.5">{eyebrow}</p> : null}
          {title ? (
            <h1 className="rp-studio-page-title mb-2 font-['Inter_Tight'] text-[1.35rem] md:text-[2rem]">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="rp-studio-page-desc text-[13px] md:text-[15px] leading-snug">{description}</p>
          ) : null}
        </div>
        {helpKey ? (
          <StudioHelpTip
            helpKey={helpKey}
            size="lg"
            testId={`${testId || "page"}-help`}
            className="mt-1"
          />
        ) : null}
      </div>
    </header>
  );
}
