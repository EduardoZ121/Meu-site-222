import { useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Accordion para o Estúdio: cabeçalho escuro, título mono dourado, seta (fechado ↓ · aberto ↑).
 * Estado independente por instância. Animação com max-height medido + transition.
 */
export default function StudioAccordionSection({
  title,
  defaultOpen = true,
  children,
  testId,
  className,
  titleClassName,
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
        "rounded-xl border border-[#2E2E30] bg-[#13131A]/50 overflow-hidden",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
      data-testid={testId}
    >
      <button
        type="button"
        id={headerId}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left",
          "bg-[#0B0B0C] hover:bg-[#101014] border-b border-[#2E2E30] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]/35 focus-visible:ring-inset",
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={cn("text-[11px] sm:text-[12px] font-mono font-semibold uppercase tracking-[0.12em] text-[#FACC15]", titleClassName)}>
          {title}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "w-4 h-4 shrink-0 text-[#FACC15] transition-transform duration-300 ease-out",
            open ? "rotate-180" : "rotate-0",
          )}
          strokeWidth={2.5}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight }}
      >
        <div ref={innerRef} className="p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
