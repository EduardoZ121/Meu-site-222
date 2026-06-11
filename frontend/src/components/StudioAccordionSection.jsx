import { useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Secção compacta estilo OpenArt — card empilhado, label pequena, pouco padding.
 */
export default function StudioAccordionSection({
  title,
  defaultOpen = true,
  collapsible = true,
  children,
  testId,
  className,
  titleClassName,
  hint,
}) {
  const headerId = useId();
  const panelId = useId();
  const innerRef = useRef(null);
  const [open, setOpen] = useState(defaultOpen);
  /** Valor alto inicial se aberto evita clipping antes da primeira medição */
  const [maxHeight, setMaxHeight] = useState(defaultOpen ? "4800px" : "0px");

  const measure = () => {
    const el = innerRef.current;
    if (!el) return "0px";
    return `${el.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (open) {
      setMaxHeight(measure());
    } else {
      setMaxHeight("0px");
    }
  }, [open, children]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setMaxHeight(`${el.scrollHeight}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#141418]/90 overflow-hidden",
        className,
      )}
      data-testid={testId}
    >
      {collapsible ? (
        <button
          type="button"
          id={headerId}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 sm:px-3.5 text-left",
            "hover:bg-white/[0.03] transition-colors",
            open ? "border-b border-white/[0.06]" : "",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 focus-visible:ring-inset",
          )}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={cn(
              "flex-1 min-w-0 text-[13px] font-medium text-[#EDEBE8] truncate",
              titleClassName,
            )}
          >
            {title}
          </span>
          {hint && !open ? (
            <span className="hidden sm:inline text-[11px] text-[#6b6b70] truncate max-w-[40%]">{hint}</span>
          ) : null}
          {open ? (
            <ChevronDown
              aria-hidden
              className="w-4 h-4 shrink-0 text-[#8A8A8E] transition-transform duration-200 rotate-180"
              strokeWidth={2}
            />
          ) : (
            <ChevronRight
              aria-hidden
              className="w-4 h-4 shrink-0 text-[#8A8A8E]"
              strokeWidth={2}
            />
          )}
        </button>
      ) : (
        <div
          id={headerId}
          className="px-3 py-2 border-b border-white/[0.06] text-[13px] font-medium text-[#EDEBE8]"
        >
          {title}
        </div>
      )}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={cn(
          "overflow-hidden transition-[max-height] duration-250 ease-out",
          !collapsible || open ? "" : "max-h-0",
        )}
        style={collapsible ? { maxHeight: open ? maxHeight : "0px" } : undefined}
      >
        <div ref={innerRef} className="p-3 sm:p-3.5">
          {children}
        </div>
      </div>
    </div>
  );
}
