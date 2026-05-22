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
        "rp-studio-acc rounded-xl border border-white/[0.08] bg-[#12121a]/80 overflow-hidden",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_40px_-28px_rgba(0,0,0,0.65)]",
        className,
      )}
      data-testid={testId}
    >
      <button
        type="button"
        id={headerId}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left",
          "bg-[#0c0c10]/90 hover:bg-[#12121a] border-b border-white/[0.06] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/40 focus-visible:ring-inset",
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[11px] sm:text-[12px] font-mono font-semibold uppercase tracking-[0.14em] text-[#C4B5FD]">
          {title}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "w-4 h-4 shrink-0 text-[#A855F7]/90 transition-transform duration-300 ease-out",
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
        <div ref={innerRef} className="p-5 sm:p-6 md:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
