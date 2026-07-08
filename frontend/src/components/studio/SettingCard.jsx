import { ChevronRight } from "lucide-react";
import StudioHelpTip from "./StudioHelpTip";

export default function SettingCard({ icon: Icon, label, value, onOpen, testId, helpKey }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mv-setting-card"
      data-testid={testId}
    >
      <span className="mv-setting-card__head">
        <Icon className="w-3.5 h-3.5 text-[#A855F7] shrink-0" strokeWidth={1.75} />
        <span className="mv-setting-eyebrow inline-flex items-center gap-1">
          {label}
          {helpKey ? <StudioHelpTip helpKey={helpKey} testId={`${testId}-help`} /> : null}
        </span>
        <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#8A8A8E]" />
      </span>
      <span className="mv-setting-value">{value}</span>
    </button>
  );
}
