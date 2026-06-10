const { countryFromRequest, resolvePricingRegion } = require("../pricingRegions.cjs");
const { upsertGoogleUser, isAdminEmail } = require("./usersDb.cjs");
const { signSession } = require("./sessionToken.cjs");

async function verifyGoogleCredential(credential) {
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!r.ok) return null;
  const d = await r.json();
  const email = String(d.email || "").trim().toLowerCase();
  if (!email) return null;
  return {
    sub: d.sub,
    email,
    name: d.name || email.split("@")[0],
    picture: d.picture || null,
    email_verified: d.email_verified === "true" || d.email_verified === true,
  };
}

function regionFromRequest(req, fields = {}) {
  const client = String(fields.pricing_region || req?.headers?.["x-pricing-region"] || "").trim();
  return resolvePricingRegion({
    countryCode: countryFromRequest(req),
    clientRegion: client,
  });
}

async function loginWithGoogleCredential(credential, req, fields = {}) {
  if (!credential) {
    const err = new Error("credential em falta.");
    err.status = 400;
    throw err;
  }
  const g = await verifyGoogleCredential(credential);
  if (!g) {
    const err = new Error("Credencial Google inválida ou expirada.");
    err.status = 401;
    throw err;
  }
  const region = regionFromRequest(req, fields);
  const dbUser = await upsertGoogleUser(g, req, { pricing_region: region });
  const unlimited = isAdminEmail(g.email);
  const user = dbUser || {
    id: `google_${g.sub}`,
    email: g.email,
    name: g.name,
    avatar_url: g.picture || null,
    role: unlimited ? "admin" : "user",
    lang: "en",
    credits: unlimited ? 999999999 : 50,
    is_unlimited: unlimited,
    referral_code: "",
    email_verified: !!g.email_verified,
    created_at: new Date().toISOString(),
    pricing_region: region,
  };
  if (dbUser) {
    user.role = unlimited ? "admin" : dbUser.role;
    user.is_unlimited = unlimited;
    if (unlimited) user.credits = 999999999;
  }
  return { token: signSession(user), user };
}

function parseCookies(header = "") {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx < 1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

async function readUrlEncoded(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const params = new URLSearchParams(raw);
  const fields = {};
  for (const [k, v] of params) fields[k] = v;
  return fields;
}

async function handleGoogleRedirectCallback(req, res) {
  try {
    const fields = await readUrlEncoded(req);
    const cookies = parseCookies(req.headers.cookie);
    const csrf = fields.g_csrf_token;
    if (!csrf || csrf !== cookies.g_csrf_token) {
      res.writeHead(302, { Location: "/login?google=csrf" });
      res.end();
      return;
    }
    const out = await loginWithGoogleCredential(fields.credential, req, fields);
    const token = encodeURIComponent(out.token);
    res.writeHead(302, { Location: `/login#google_token=${token}` });
    res.end();
  } catch {
    res.writeHead(302, { Location: "/login?google=failed" });
    res.end();
  }
}

module.exports = {
  verifyGoogleCredential,
  loginWithGoogleCredential,
  handleGoogleRedirectCallback,
};
