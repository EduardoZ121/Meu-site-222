/** Emails com acesso admin (espelha ADMIN_EMAILS no servidor). */
export const ADMIN_EMAILS = new Set([
  "eduardozola1998@gmail.com",
  "eduardozola121998@gmail.com",
  "eduardozola11998@gmail.com",
]);

/** Conta admin ou unlimited (UI ampla, créditos, etc.). */
export function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin" || user.is_unlimited) return true;
  return ADMIN_EMAILS.has(String(user.email || "").trim().toLowerCase());
}

/** Só administradores reais (espelha requireAdminSession no servidor). */
export function isStrictAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return ADMIN_EMAILS.has(String(user.email || "").trim().toLowerCase());
}
