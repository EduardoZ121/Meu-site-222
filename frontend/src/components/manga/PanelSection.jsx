import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import StudioFieldTooltip from "./StudioFieldTooltip";

/** Secção accordion — sem position absolute. */
export default function PanelSection({
  id,
  icon,
  title,
  hint,
  tooltip,
  open,
  onToggle,
  children,
}) {
  return (
    <section className={cn("manga-panel-section", open && "manga-panel-section--open")}>
      <button
        type="button"
        className="manga-panel-section-head"
        onClick={() => onToggle(id)}
        aria-expanded={open}
      >
        <span className="manga-panel-section-title">
          {icon} {title}
        </span>
        {tooltip && (
          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <StudioFieldTooltip {...tooltip} />
          </span>
        )}
        <ChevronDown className={cn("manga-panel-section-chevron", open && "rotate-180")} />
      </button>
      {hint && <p className="manga-panel-section-hint">{hint}</p>}
      {open && <div className="manga-panel-section-body">{children}</div>}
    </section>
  );
}
