import { api } from "./api";

/**
 * @returns {Promise<{ exists: boolean, provider: 'google'|'email'|null, can_register: boolean, offline?: boolean }>}
 */
export async function checkRegisteredEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { exists: false, provider: null, can_register: false };
  }
  try {
    const { data } = await api.get("/auth/check-email", { params: { email: normalized } });
    return data || { exists: false, provider: null, can_register: true };
  } catch {
    return { exists: false, provider: null, can_register: false, offline: true };
  }
}
