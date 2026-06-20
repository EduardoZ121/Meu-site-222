const { verifySessionToken } = require("./sessionToken.cjs");

function parseBearer(req) {
  const auth = String(req.headers?.authorization || "");
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function getSessionIdentity(req) {
  const token = parseBearer(req);
  if (!token) return null;
  if (token.startsWith("local:")) {
    const localId = token.slice("local:".length) || token;
    return {
      tokenType: "local",
      userId: `local_${localId}`,
      email: `local_${localId}@local.invalid`,
      role: "user",
    };
  }
  const session = verifySessionToken(token);
  if (!session?.id) return null;
  return {
    tokenType: "session",
    userId: session.id,
    email: String(session.email || "").toLowerCase(),
    role: session.role || "user",
  };
}

function requireSessionIdentity(req) {
  const identity = getSessionIdentity(req);
  if (!identity) {
    const err = new Error("Sessão inválida ou expirada.");
    err.status = 401;
    throw err;
  }
  return identity;
}

module.exports = {
  parseBearer,
  getSessionIdentity,
  requireSessionIdentity,
};
