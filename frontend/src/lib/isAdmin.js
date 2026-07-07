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

export const TIA_ANY_ALLOWED_EMAILS = new Set([
  ...ADMIN_EMAILS,
  "gemimazola28@gmail.com",
  "carlazola@hotmail.com",
]);

export function canAccessTiaAnyPosters(user) {
  if (isAdminUser(user)) return true;
  return TIA_ANY_ALLOWED_EMAILS.has(String(user?.email || "").trim().toLowerCase());
}

/** Vídeo IA — disponível para visitantes (login só ao gerar). */
export function canAccessVideoFeatures(user) {
  return true;
}
