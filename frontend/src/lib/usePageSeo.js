import useTitle from "./useTitle";
import { useSocialMeta } from "./useSocialMeta";
import { DEFAULT_OG, absoluteUrl } from "./siteMeta";

/**
 * Public-page SEO: English title, meta description, OG, canonical, optional noindex.
 * @param {{ title: string, description: string, path?: string, keywords?: string, noindex?: boolean, titleSuffix?: boolean }} opts
 */
export function usePageSeo({
  title,
  documentTitle,
  description,
  path = "/",
  keywords,
  noindex = false,
}) {
  useTitle(documentTitle || title);
  useSocialMeta({
    title,
    description,
    path,
    keywords,
    noindex,
  });
}

export { absoluteUrl, DEFAULT_OG };
