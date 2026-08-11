const crypto = require("crypto");

function sessionSecret() {
  return (
    process.env.RP_SESSION_SECRET
    || crypto.createHash("sha256").update(`${process.env.REPLICATE_API_TOKEN || ""}|${process.env.VERCEL_URL || "local"}`).digest("hex")
  );
}

/** Signed session JWT substitute (HMAC over base64url JSON). */
function signSession(user) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 45; // 45d
  const body = Buffer.from(JSON.stringify({ ...user, exp }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifySessionToken(token) {
  try {
    const i = token.lastIndexOf(".");
    if (i <= 0) return null;
    const str = token.slice(0, i);
    const sig = token.slice(i + 1);
    const expect = crypto.createHmac("sha256", sessionSecret()).update(str).digest("base64url");
    if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
    const payload = JSON.parse(Buffer.from(str, "base64url").toString("utf8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    const { exp, ...user } = payload;
    return user;
  } catch {
    return null;
  }
}

module.exports = { sessionSecret, signSession, verifySessionToken };
