import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";

/**
 * Ícone ! — toque ou clique abre modal (portal) legível em mobile e desktop.
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
  const [show, setShow] = useState(false);
  const content = text || (helpKey ? t(helpKey) : "");

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setShow(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  useEffect(() => {
    if (!show) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!content) return null;

  const large = size === "lg";

  const overlay =
    show &&
    createPortal(
      <>
        <button
          type="button"
          aria-label={t("help_tip_close_aria")}
          className="fixed inset-0 z-[9998] bg-black/65 border-0 p-0 cursor-default"
          onClick={() => setShow(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label || t("help_tip_aria")}
          className={cn(
            "fixed z-[9999] left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[min(420px,calc(100vw-2rem))]",
            "top-[12%] sm:top-[18%] max-h-[min(75vh,420px)] overflow-y-auto",
            "px-4 py-4 sm:px-5 sm:py-4 rounded-xl",
            "border border-[rgba(124,58,237,0.45)] bg-[#0A0A0F]",
            "shadow-[0_12px_40px_rgba(0,0,0,0.65)] text-[#D1D5DB] leading-relaxed",
            large ? "text-[13px] sm:text-[14px]" : "text-[13px]",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </>,
      document.body,
    );

  return (
    <>
      <button
        type="button"
        aria-label={label || t("help_tip_aria")}
        aria-expanded={show}
        className={cn(
          "relative shrink-0 rounded-full flex items-center justify-center transition-colors",
          large ? "w-7 h-7" : "w-5 h-5",
          show
            ? "bg-[#7C3AED] text-white"
            : "text-[#6B7280] hover:text-[#A855F7] hover:bg-[#7C3AED]/20",
          className,
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShow((v) => !v);
        }}
        data-testid={testId || (helpKey ? `help-${helpKey}` : "studio-help-tip")}
      >
        <AlertCircle className={large ? "w-4 h-4" : "w-3.5 h-3.5"} strokeWidth={2} />
      </button>
      {overlay}
    </>
  );
}
