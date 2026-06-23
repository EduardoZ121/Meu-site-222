import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { redirectForGenerateAccess, resolveGenerateAccess } from "../lib/studioGenerateAccess";

/**
 * Botão Gerar unificado — todas as sessões do estúdio.
 * layout: sticky (barra inferior) | inline (no formulário)
 */
export default function StudioGenerateBar({
  ready = false,
  busy = false,
  onClick,
  label,
  busyLabel,
  hint = null,
  variant = "default",
  layout = "sticky",
  costMeta = null,
  testId = "studio-generate",
  className = "",
  buttonClassName = "",
  alignHint = "end",
  icon: Icon = Sparkles,
  /** Quando o botão está bloqueado (ex.: upload), usar toast.message em vez de error. */
  blockedNotify = "error",
  /** Créditos desta geração — usado para login/comprar créditos ao clicar Gerar. */
  cost = 0,
  gateOnGenerate = true,
  canAffordCheck = null,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const handleClick = async () => {
    if (busy) return;
    if (!ready) {
      if (hint) {
        const notify = blockedNotify === "message" ? toast.message : toast.error;
        notify(hint, { duration: 7000 });
      }
      return;
    }
    if (gateOnGenerate) {
      const access = resolveGenerateAccess(user, cost, { canAfford: canAffordCheck });
      if (access !== "proceed") {
        redirectForGenerateAccess(navigate, location, access, { t, toast });
        return;
      }
    }
    try {
      await Promise.resolve(onClick?.());
    } catch (err) {
      console.error("[StudioGenerateBar]", err);
      toast.error(err?.message || "Não foi possível iniciar a geração.", { duration: 8000 });
    }
  };

  const btnClass = [
    "rp-action-primary",
    variant === "pro" ? "rp-action-primary--pro" : "",
    ready && !busy ? "rp-action-primary--ready" : "",
    !ready && !busy ? "rp-action-primary--locked" : "",
    layout === "sticky" ? "flex-1 sm:flex-initial sm:min-w-[240px] sm:ml-auto !w-auto sm:!w-auto" : "w-full sm:w-auto sm:min-w-[280px]",
    buttonClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const showHint = Boolean(hint) && !busy;
  const hintAlign =
    alignHint === "center" ? "text-center" : alignHint === "start" ? "text-left" : "text-right";

  const action = (
    <div
      className={
        layout === "inline"
          ? "flex flex-col gap-1.5 w-full"
          : "flex flex-col items-end gap-1.5 flex-1 sm:flex-none min-w-0"
      }
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={btnClass}
        data-testid={testId}
        aria-disabled={busy || !ready}
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            {busyLabel || label}
          </>
        ) : (
          <>
            <Icon className="w-4 h-4" strokeWidth={1.5} />
            {label}
          </>
        )}
      </button>
      {showHint ? (
        <p className={`rp-studio-gen-hint ${hintAlign} w-full`} data-testid={`${testId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );

  if (layout === "inline") {
    return (
      <div className={className} data-testid={`${testId}-wrap`}>
        {action}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0.96 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`rp-sticky-cta rp-sticky-cta--sidebar ${className}`.trim()}
      data-testid={`${testId}-bar`}
    >
      <div className="rp-studio-compact-page max-w-[520px] md:max-w-[1400px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 px-0.5">
        {costMeta}
        {action}
      </div>
    </motion.div>
  );
}
