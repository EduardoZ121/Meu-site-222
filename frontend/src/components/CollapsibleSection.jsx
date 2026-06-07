import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";

/**
 * Accordion-style section for studio editors.
 * variant "boxed" — poster / tool pages (bordered card)
 * variant "inset" — inside rp-editor-panel (lighter divider)
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
          ? "rounded-xl border border-[#2E2E30] bg-[#13131A]/40 overflow-hidden"
          : "border-t border-[rgba(244,241,234,0.06)] first:border-t-0 first:pt-0 pt-6",
        className,
      )}
      data-testid={testId}
    >
      <CollapsibleTrigger
        type="button"
        className={cn(
          "flex w-full items-start gap-3 text-left transition-colors",
          isBoxed
            ? "px-4 py-3 bg-[#0B0B0C]/60 hover:bg-[#0B0B0C]/80 border-b border-[#2E2E30] data-[state=closed]:border-b-0"
            : "pb-3 hover:opacity-90",
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              "font-medium font-['Inter_Tight']",
              isBoxed ? "text-[#F4F1EA] text-[13px]" : "rp-editor-section-cap !text-[#a89bc9] !mb-0",
            )}
            >
              {title}
            </p>
            {optional && (
              <span className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-wider">{t("common_optional")}</span>
            )}
          </div>
          {hint && !open && hint.length < 60 && (
            <p className="text-[#5A5A5E] text-[10px] mt-0.5 line-clamp-1">{hint}</p>
          )}
          {hint && open && (
            <p className="text-[#8A8A8E] text-[11px] mt-1 leading-snug pr-2">{hint}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 text-[#8A8A8E] transition-transform duration-200 mt-0.5",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
          isBoxed ? "" : "",
        )}
      >
        <div className={isBoxed ? "p-4" : "pb-1"}>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
