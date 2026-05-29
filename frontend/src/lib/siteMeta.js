/** URLs e textos padrão para Open Graph / Twitter Cards. */
import {
  SITE_ORIGIN,
  BRAND_FULL_NAME,
  BRAND_NAME,
  DEFAULT_SITE_DESCRIPTION,
  absoluteSiteUrl,
} from "./siteConfig";

export { SITE_ORIGIN, absoluteSiteUrl as absoluteUrl };

export const DEFAULT_OG = {
  title: BRAND_FULL_NAME,
  description: DEFAULT_SITE_DESCRIPTION,
  image: `${SITE_ORIGIN}/og-image.jpg`,
  imageWidth: "1200",
  imageHeight: "630",
  locale: "pt_PT",
  siteName: BRAND_NAME,
};
