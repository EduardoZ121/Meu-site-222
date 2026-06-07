/** URLs and default Open Graph / SEO (English — primary for indexing). */
import { SEO_HOME, SITE_NAME, SITE_ORIGIN } from "./seoEn";

export { SITE_ORIGIN };

export const DEFAULT_OG = {
  title: SEO_HOME.title,
  description: SEO_HOME.description,
  keywords: SEO_HOME.keywords,
  image: `${SITE_ORIGIN}/og-image.jpg`,
  imageWidth: "1200",
  imageHeight: "630",
  locale: "en_US",
  siteName: SITE_NAME,
};

export function absoluteUrl(pathname = "/") {
  if (!pathname || pathname === "/") return SITE_ORIGIN;
  return `${SITE_ORIGIN}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
