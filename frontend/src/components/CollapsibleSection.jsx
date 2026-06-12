import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";
import StudioHelpTip from "./studio/StudioHelpTip";

/**
 * Secção colapsável compacta (OpenArt-style cards).
 */
export default function CollapsibleSection({
  title,
  optional,
  hint,
  defaultOpen = false,
  children,
  testId,
  variant = "boxed",
  className,
  helpKey,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  const isBoxed = variant === "boxed";

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        isBoxed
          ? "rounded-2xl border border-white/[0.08] bg-[#141418]/90 overflow-hidden"
          : "rounded-2xl border border-white/[0.08] bg-[#141418]/90 overflow-hidden",
        className,
      )}
      data-testid={testId}
    >
      <div
        className={cn(
          "flex w-full items-center gap-1 px-3 py-2.5",
          open ? "border-b border-white/[0.06]" : "",
        )}
      >
        <CollapsibleTrigger
          type="button"
          className={cn(
            "flex flex-1 min-w-0 items-center gap-2 text-left transition-colors hover:bg-white/[0.03] -m-1 p-1 rounded-lg",
          )}
        >
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-medium text-[#EDEBE8] font-['Inter_Tight']">
                {title}
              </p>
              {optional && (
                <span className="text-[#5A5A5E] text-[10px]">{t("common_optional")}</span>
              )}
            </div>
            {hint && !open && hint.length < 72 && (
              <p className="text-[#6b6b70] text-[11px] mt-0.5 line-clamp-1">{hint}</p>
            )}
          </div>
          {open ? (
            <ChevronDown className="w-4 h-4 shrink-0 text-[#8A8A8E]" strokeWidth={2} />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0 text-[#8A8A8E]" strokeWidth={2} />
          )}
        </CollapsibleTrigger>
        {helpKey ? (
          <StudioHelpTip helpKey={helpKey} testId={`${testId || "col"}-help`} />
        ) : null}
      </div>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="p-3 sm:p-3.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
