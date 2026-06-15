/** Emails com acesso admin (espelha ADMIN_EMAILS no servidor). */
export const ADMIN_EMAILS = new Set([
  "eduardozola1998@gmail.com",
  "eduardozola121998@gmail.com",
  "eduardozola11998@gmail.com",
]);

export function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin" || user.is_unlimited) return true;
  return ADMIN_EMAILS.has(String(user.email || "").trim().toLowerCase());
}

/** Vídeo IA — utilizadores autenticados (rotas /app já exigem login). */
export function canAccessVideoFeatures(user) {
  return Boolean(user?.id || user?.email);
}
