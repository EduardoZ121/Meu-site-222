function clientIp(req) {
  const xff = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  if (xff) return String(xff).split(",")[0].trim();
  const real = req.headers["x-real-ip"] || req.headers["X-Real-Ip"];
  if (real) return String(real).trim();
  return "";
}

function clientCountry(req) {
  const cc =
    req.headers["x-vercel-ip-country"]
    || req.headers["X-Vercel-IP-Country"]
    || req.headers["cf-ipcountry"]
    || req.headers["CF-IPCountry"]
    || "";
  return String(cc).trim().toUpperCase().slice(0, 2);
}

function requestMeta(req) {
  return {
    ip: clientIp(req),
    country: clientCountry(req),
    at: new Date().toISOString(),
  };
}

module.exports = { clientIp, clientCountry, requestMeta };
