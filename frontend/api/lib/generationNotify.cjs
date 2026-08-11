const { isValidEmail } = require("./videoNotifyEmail.cjs");

function truthyField(fields, key) {
  const v = fields?.[key];
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

const ALWAYS_NOTIFY_TYPES = new Set(["motion_flyer", "marketing_video", "poster_hq"]);

/** Opt-in global (definições), pedido explícito, ou tipos de vídeo longo que prometem email. */
function resolveGenerationNotifyEmail(fields, dbUser, opts = {}) {
  const explicit = String(fields?.notify_email || "").trim().toLowerCase();
  if (isValidEmail(explicit)) return explicit;

  if (truthyField(fields, "notify_by_email")) {
    const fromDb = String(dbUser?.email || "").trim().toLowerCase();
    if (isValidEmail(fromDb)) return fromDb;
  }

  const type = String(opts.type || "").trim();
  if (ALWAYS_NOTIFY_TYPES.has(type)) {
    const fromDb = String(dbUser?.email || "").trim().toLowerCase();
    if (isValidEmail(fromDb)) return fromDb;
  }

  if (dbUser?.email_notify_generations) {
    const fromDb = String(dbUser?.email || "").trim().toLowerCase();
    if (isValidEmail(fromDb)) return fromDb;
  }

  return null;
}

module.exports = {
  resolveGenerationNotifyEmail,
  truthyField,
};
