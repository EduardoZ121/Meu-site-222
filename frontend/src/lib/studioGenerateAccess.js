import { hasStudioCredits } from "./useStudioGenerateGate";

/** @returns {"proceed"|"login"|"billing"} */
export function resolveGenerateAccess(user, cost = 0, { canAfford } = {}) {
  if (!user) return "login";
  const affordable = typeof canAfford === "function"
    ? canAfford(user, cost)
    : hasStudioCredits(user, cost);
  if (cost > 0 && !affordable) return "billing";
  return "proceed";
}

export function redirectForGenerateAccess(navigate, location, action, { t, toast } = {}) {
  if (action === "proceed") return true;

  if (action === "login") {
    const returnTo = `${location.pathname}${location.search || ""}`;
    toast?.message(t?.("studio_gen_login_required") || "Entra ou cria conta para gerar.", { duration: 6000 });
    navigate("/login", { state: { from: returnTo } });
    return false;
  }

  if (action === "billing") {
    toast?.message(t?.("studio_gen_billing_required") || "Compra créditos para continuar.", { duration: 6000 });
    navigate("/app/billing");
    return false;
  }

  return false;
}
