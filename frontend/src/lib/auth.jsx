import { createContext, useContext, useEffect, useState } from "react";
import { api, startPendingPredictionsWatcher, syncServerPendingPredictions } from "./api";
import { ADMIN_EMAILS } from "./isAdmin";

const AuthCtx = createContext(null);
const LOCAL_USERS_KEY = "rp_local_users";
const LOCAL_TX_KEY = "rp_local_transactions";
const STARTER_CREDITS = 100;

function readLocalUsers() {
  try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "{}"); } catch { return {}; }
}

function writeLocalUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function readLocalTransactions() {
  try { return JSON.parse(localStorage.getItem(LOCAL_TX_KEY) || "[]"); } catch { return []; }
}

function writeLocalTransactions(txs) {
  localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(txs.slice(0, 80)));
}

function isUnlimitedEmail(email) {
  return ADMIN_EMAILS.has(email?.trim().toLowerCase());
}

export { isAdminUser } from "./isAdmin";

function updateStoredUser(user) {
  localStorage.setItem("rp_user", JSON.stringify(user));
}

function decodeJwtPayload(token) {
  const payload = token.split(".")[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return JSON.parse(decodeURIComponent(escape(atob(padded))));
}

function publicLocalUser(user) {
  const unlimited = isUnlimitedEmail(user.email);
  let pricing_region = user.pricing_region;
  try {
    if (!pricing_region) {
      const stored = localStorage.getItem("rp_pricing_region");
      if (stored === "usd" || stored === "intl") pricing_region = stored;
    }
  } catch {
    /* ignore */
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url || null,
    role: user.role || "user",
    lang: "en",
    credits: unlimited ? 999999999 : (user.credits ?? STARTER_CREDITS),
    premium_credits: unlimited ? 999999999 : (user.premium_credits ?? 0),
    is_unlimited: unlimited,
    referral_code: user.referral_code || "",
    email_verified: !!user.email_verified,
    created_at: user.created_at,
    pricing_region: pricing_region || "intl",
  };
}

function isBackendUnavailable(err) {
  const s = err?.response?.status;
  return !err?.response || s === 404 || s === 405 || s >= 500;
}

function localTokenFor(user) {
  return `local:${user.id}`;
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function resolveLocalUserFromToken(token) {
  if (!token?.startsWith("local:")) return null;
  const id = token.slice("local:".length);
  return Object.values(readLocalUsers()).find((u) => u.id === id) || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rp_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startPendingPredictionsWatcher();
  }, []);

  useEffect(() => {
    const hash = window.location.hash || "";
    if (!hash.startsWith("#google_token=")) return;
    const token = decodeURIComponent(hash.slice("#google_token=".length));
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    if (!token) return;
    localStorage.setItem("rp_token", token);
    setLoading(true);
    api.get("/auth/me")
      .then((r) => {
        setUser(r.data);
        updateStoredUser(r.data);
        void syncServerPendingPredictions();
        window.location.replace("/app/tools");
      })
      .catch(() => {
        localStorage.removeItem("rp_token");
        localStorage.removeItem("rp_user");
        setUser(null);
        window.location.replace("/login?google=failed");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("rp_token");
    if (!token) { setLoading(false); return; }
    const localUser = resolveLocalUserFromToken(token);
    if (localUser) {
      const user = publicLocalUser(localUser);
      setUser(user);
      updateStoredUser(user);
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then((r) => {
        setUser(r.data);
        updateStoredUser(r.data);
        void syncServerPendingPredictions();
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("rp_token");
          localStorage.removeItem("rp_user");
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const syncCredits = (credits) => {
    if (credits == null) return;
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, credits: Number(credits) };
      updateStoredUser(next);
      return next;
    });
  };

  const syncPremiumCredits = (premiumCredits) => {
    if (premiumCredits == null) return;
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, premium_credits: Number(premiumCredits) };
      updateStoredUser(next);
      return next;
    });
  };

  useEffect(() => {
    const onCreation = (event) => {
      if (event.detail?.server_billing) {
        if (event.detail?.new_balance != null) syncCredits(event.detail.new_balance);
        if (event.detail?.new_premium_balance != null) syncPremiumCredits(event.detail.new_premium_balance);
        return;
      }
      const spent = Number(event.detail?.credits_spent || 0);
      if (spent > 0) spendCredits(spent, event.detail?.type ? `Geração: ${event.detail.type}` : "Geração");
    };
    const onCreditsSync = (event) => {
      if (event.detail?.credits != null) syncCredits(event.detail.credits);
      if (event.detail?.premium_credits != null) syncPremiumCredits(event.detail.premium_credits);
    };
    window.addEventListener("rp:creation-succeeded", onCreation);
    window.addEventListener("rp:credits-sync", onCreditsSync);
    return () => {
      window.removeEventListener("rp:creation-succeeded", onCreation);
      window.removeEventListener("rp:credits-sync", onCreditsSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refundCredits = (amount, description = "Reembolso: geração falhou") => {
    const n = Math.abs(Number(amount) || 0);
    if (n <= 0) return;
    mutateLocalCredits(n, description, "refund");
  };

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data } = await api.post("/auth/login", { email: normalizedEmail, password });
      localStorage.setItem("rp_token", data.token);
      updateStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const local = readLocalUsers()[normalizedEmail];
      const passwordMatches = local?.password_hash
        ? local.password_hash === await hashPassword(password)
        : local?.password === password;
      if (!local || !passwordMatches) {
        const fallbackErr = new Error("Conta local não encontrada ou palavra-passe incorreta.");
        fallbackErr.response = { data: { detail: fallbackErr.message } };
        throw fallbackErr;
      }
      const user = publicLocalUser(local);
      localStorage.setItem("rp_token", localTokenFor(local));
      updateStoredUser(user);
      setUser(user);
      return user;
    }
  };

  const register = async (payload) => {
    const normalizedPayload = { ...payload, email: payload.email.trim().toLowerCase() };
    try {
      const { data } = await api.post("/auth/register", normalizedPayload);
      localStorage.setItem("rp_token", data.token);
      localStorage.setItem("rp_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const users = readLocalUsers();
      if (users[normalizedPayload.email]) {
        const fallbackErr = new Error("Este email já está registado. Entra em vez de criar outra conta.");
        fallbackErr.response = { status: 409, data: { detail: fallbackErr.message, code: "EMAIL_EXISTS" } };
        throw fallbackErr;
      }
      const local = {
        id: `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        email: normalizedPayload.email,
        name: normalizedPayload.name || normalizedPayload.email.split("@")[0],
        password_hash: await hashPassword(normalizedPayload.password),
        role: "user",
        credits: STARTER_CREDITS,
        referral_code: "",
        email_verified: false,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      users[normalizedPayload.email] = local;
      writeLocalUsers(users);
      const user = publicLocalUser(local);
      localStorage.setItem("rp_token", localTokenFor(local));
      updateStoredUser(user);
      setUser(user);
      return user;
    }
  };

  const loginWithGoogle = async (credential) => {
    const googleProfile = decodeJwtPayload(credential);
    const email = googleProfile.email?.trim().toLowerCase();
    if (!email) throw new Error("A conta Google não devolveu email.");

    try {
      const { data } = await api.post("/auth/google", { credential });
      localStorage.setItem("rp_token", data.token);
      updateStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const users = readLocalUsers();
      const existing = users[email];
      const local = {
        ...(existing || {}),
        id: existing?.id || `google_${googleProfile.sub}`,
        email,
        name: googleProfile.name || existing?.name || email.split("@")[0],
        role: existing?.role || "user",
        credits: existing?.credits ?? STARTER_CREDITS,
        referral_code: existing?.referral_code || "",
        email_verified: !!googleProfile.email_verified,
        avatar_url: googleProfile.picture || existing?.avatar_url || null,
        provider: "google",
        google_sub: googleProfile.sub,
        created_at: existing?.created_at || new Date().toISOString(),
      };
      users[email] = local;
      writeLocalUsers(users);
      const publicUser = publicLocalUser(local);
      localStorage.setItem("rp_token", localTokenFor(local));
      updateStoredUser(publicUser);
      setUser(publicUser);
      return publicUser;
    }
  };

  const logout = () => {
    localStorage.removeItem("rp_token");
    localStorage.removeItem("rp_user");
    setUser(null);
  };

  const recordTransaction = (amount, description, type = amount >= 0 ? "credit" : "spend") => {
    const tx = {
      id: `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      user_id: user?.id,
      amount,
      type,
      description,
      created_at: new Date().toISOString(),
    };
    const next = [tx, ...readLocalTransactions()];
    writeLocalTransactions(next);
    return tx;
  };

  const mutateLocalCredits = (delta, description, type) => {
    if (!user) return null;
    if (user.is_unlimited) {
      if (delta > 0) recordTransaction(delta, description, type);
      return user;
    }
    const token = localStorage.getItem("rp_token");
    const localUser = resolveLocalUserFromToken(token);
    const nextCredits = Math.max(0, Number(user.credits || 0) + delta);
    const nextPublic = { ...user, credits: nextCredits };
    if (localUser) {
      const users = readLocalUsers();
      users[localUser.email] = { ...localUser, credits: nextCredits };
      writeLocalUsers(users);
    }
    setUser(nextPublic);
    updateStoredUser(nextPublic);
    recordTransaction(delta, description, type);
    return nextPublic;
  };

  const addCredits = (amount, description = "Compra de créditos") =>
    mutateLocalCredits(Math.abs(Number(amount || 0)), description, "purchase");

  const addPremiumCredits = (amount, description = "Compra créditos HQ") => {
    if (!user) return null;
    if (user.is_unlimited) {
      recordTransaction(Math.abs(Number(amount || 0)), description, "purchase");
      return user;
    }
    const nextPremium = Math.max(0, Number(user.premium_credits || 0) + Math.abs(Number(amount || 0)));
    const nextPublic = { ...user, premium_credits: nextPremium };
    setUser(nextPublic);
    updateStoredUser(nextPublic);
    recordTransaction(Math.abs(Number(amount || 0)), description, "purchase");
    return nextPublic;
  };

  const spendCredits = (amount, description = "Geração") =>
    mutateLocalCredits(-Math.abs(Number(amount || 0)), description, "spend");

  const getLocalTransactions = () => readLocalTransactions().filter((tx) => !tx.user_id || tx.user_id === user?.id);

  const refresh = async () => {
    const localUser = resolveLocalUserFromToken(localStorage.getItem("rp_token"));
    if (localUser) {
      const user = publicLocalUser(localUser);
      setUser(user);
      updateStoredUser(user);
      return user;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      updateStoredUser(data);
      return data;
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("rp_token");
        localStorage.removeItem("rp_user");
        setUser(null);
      }
      return null;
    }
  };

  const updateProfile = async (patch) => {
    const token = localStorage.getItem("rp_token");
    const localUser = resolveLocalUserFromToken(token);
    if (localUser) {
      const users = readLocalUsers();
      const updated = { ...localUser, ...patch };
      delete users[localUser.email];
      users[updated.email] = updated;
      writeLocalUsers(users);
      const publicUser = publicLocalUser(updated);
      setUser(publicUser);
      updateStoredUser(publicUser);
      return publicUser;
    }
    const next = { ...user, ...patch };
    setUser(next);
    updateStoredUser(next);
    return next;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const localUser = resolveLocalUserFromToken(localStorage.getItem("rp_token"));
    if (!localUser) throw new Error("Alteração de palavra-passe requer backend ativo.");
    const passwordMatches = localUser.password_hash === await hashPassword(currentPassword);
    if (!passwordMatches) throw new Error("Palavra-passe atual incorreta.");
    const users = readLocalUsers();
    users[localUser.email] = { ...localUser, password_hash: await hashPassword(newPassword) };
    writeLocalUsers(users);
  };

  const requestPasswordReset = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: normalizedEmail,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      return { mode: data?.email_sent ? "email" : "sent", ...data };
    } catch (err) {
      if (err?.response?.data?.code === "USE_GOOGLE") throw err;
      if (!isBackendUnavailable(err)) throw err;
      const local = readLocalUsers()[normalizedEmail];
      if (!local) return { mode: "sent" };
      const token = `reset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(`rp_reset_${token}`, normalizedEmail);
      return { mode: "local", token, email: normalizedEmail };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await api.post("/auth/reset-password", { token, password: newPassword });
      return;
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const email = localStorage.getItem(`rp_reset_${token}`);
      if (!email) throw new Error("Link de recuperação inválido ou expirado.");
      const users = readLocalUsers();
      if (!users[email]) throw new Error("Conta não encontrada.");
      users[email] = { ...users[email], password_hash: await hashPassword(newPassword) };
      writeLocalUsers(users);
      localStorage.removeItem(`rp_reset_${token}`);
    }
  };

  const verifyEmail = async () => {
    const localUser = resolveLocalUserFromToken(localStorage.getItem("rp_token"));
    if (!localUser) {
      const next = { ...user, email_verified: true };
      setUser(next);
      updateStoredUser(next);
      return next;
    }
    return updateProfile({ email_verified: true });
  };

  return (
    <AuthCtx.Provider value={{
      user,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      refresh,
      setUser,
      updateProfile,
      addCredits,
      addPremiumCredits,
      spendCredits,
      refundCredits,
      syncCredits,
      syncPremiumCredits,
      getLocalTransactions,
      changePassword,
      requestPasswordReset,
      resetPassword,
      verifyEmail,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
