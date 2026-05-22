import { cn } from "../../lib/utils";
import StudioResultAnchor from "../StudioResultAnchor";

export default function StudioResultColumn({
  label,
  children,
  busy,
  ready,
  className,
  stickyTop = "xl:top-[72px]",
}) {
  return (
    <StudioResultAnchor
      busy={busy}
      ready={ready}
      className={cn(
        "rp-studio-result-col xl:sticky self-start space-y-2.5",
        stickyTop,
        className,
      )}
    >
      {label && <p className="rp-studio-result-label">{label}</p>}
      <div className="rp-editor-panel rp-studio-result-panel overflow-hidden p-4 sm:p-5">
        {children}
      </div>
    </StudioResultAnchor>
  );
}
