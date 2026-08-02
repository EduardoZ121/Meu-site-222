import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

/**
 * Ícone de ajuda — popover premium (Radix), legível em mobile e desktop.
 * @param {"sm"|"lg"} size — sm = controlos; lg = página / secção principal
 */
export default function StudioHelpTip({
  helpKey,
  text,
  label,
  size = "sm",
  testId,
  className,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const content = text || (helpKey ? t(helpKey) : "");

  if (!content) return null;

  const large = size === "lg";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label || t("help_tip_aria")}
          aria-expanded={open}
          className={cn(
            "rp-help-tip relative shrink-0 rounded-full flex items-center justify-center transition-all duration-250",
            large ? "w-7 h-7" : "w-5 h-5",
            open
              ? "bg-[#7C3AED] text-white shadow-[0_0_16px_-4px_rgba(168,85,247,0.7)]"
              : "text-[#6B7280] hover:text-[#A855F7] hover:bg-[#7C3AED]/20",
            className,
          )}
          onClick={(e) => {
            e.stopPropagation();
          }}
          data-testid={testId || (helpKey ? `help-${helpKey}` : "studio-help-tip")}
        >
          <AlertCircle className={large ? "w-4 h-4" : "w-3.5 h-3.5"} strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          "rp-help-popover z-[9999] w-[min(320px,calc(100vw-1.5rem))] border-0 p-0",
          "bg-transparent shadow-none",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          role="dialog"
          aria-label={label || t("help_tip_aria")}
          className={cn(
            "rounded-[16px] px-4 py-3.5 leading-relaxed text-[#D1D5DB]",
            "bg-[#0C0C12]/96 backdrop-blur-xl",
            "shadow-[0_16px_48px_rgba(0,0,0,0.65),0_0_0_1px_rgba(124,58,237,0.28),0_0_32px_-12px_rgba(168,85,247,0.35)]",
            large ? "text-[13px] sm:text-[14px]" : "text-[12.5px]",
          )}
        >
          {content}
        </div>
      </PopoverContent>
    </Popover>
  );
}
