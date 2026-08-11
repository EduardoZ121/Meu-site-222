/**
 * Redireciona qualquer URL *.vercel.app ou remakepix.com (sem www) → site oficial.
 */
const CANONICAL = "https://www.remakepix.com";

export default function middleware(request) {
  const host = (request.headers.get("host") || "").toLowerCase();
  const needsRedirect =
    host.endsWith(".vercel.app")
    || host === "remakepix.com";

  if (!needsRedirect) return;

  const url = new URL(request.url);
  url.protocol = "https:";
  url.hostname = "www.remakepix.com";
  return Response.redirect(url.toString(), 308);
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
