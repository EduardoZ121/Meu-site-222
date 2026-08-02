import { ChevronRight } from "lucide-react";
import StudioHelpTip from "./StudioHelpTip";

export default function SettingCard({
  icon: Icon,
  label,
  value,
  meta,
  thumbSrc,
  onOpen,
  testId,
  helpKey,
  disabled,
  className = "",
}) {
  const handleKey = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onOpen}
      onKeyDown={handleKey}
      className={`mv-setting-card${disabled ? " mv-setting-card--static" : ""}${className ? ` ${className}` : ""}`}
      data-testid={testId}
    >
      <span className="mv-setting-card__head">
        <Icon className="w-3.5 h-3.5 text-[#A855F7] shrink-0" strokeWidth={1.75} />
        <span className="mv-setting-eyebrow inline-flex items-center gap-1">
          {label}
          {helpKey ? <StudioHelpTip helpKey={helpKey} testId={`${testId}-help`} /> : null}
        </span>
        <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#8A8A8E] mv-setting-card__chev" />
      </span>
      <span className={`mv-setting-value${thumbSrc ? " mv-setting-value--with-thumb" : ""}`}>
        {thumbSrc ? (
          <img src={thumbSrc} alt="" className="mv-setting-thumb" decoding="async" loading="lazy" />
        ) : null}
        <span className="mv-setting-value__text">{value}</span>
      </span>
      {meta ? <span className="mv-setting-meta">{meta}</span> : null}
    </div>
  );
}
