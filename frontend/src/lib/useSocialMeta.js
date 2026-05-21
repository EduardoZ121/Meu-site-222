import { useEffect } from "react";
import { DEFAULT_OG, absoluteUrl } from "./siteMeta";

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Atualiza meta tags de partilha (útil em rotas SPA; crawlers usam sobretudo o HTML inicial).
 */
export function useSocialMeta({
  title = DEFAULT_OG.title,
  description = DEFAULT_OG.description,
  image = DEFAULT_OG.image,
  path = "/",
  type = "website",
} = {}) {
  useEffect(() => {
    const url = absoluteUrl(path);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:width", DEFAULT_OG.imageWidth);
    upsertMeta("property", "og:image:height", DEFAULT_OG.imageHeight);
    upsertMeta("property", "og:image:alt", title);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", DEFAULT_OG.siteName);
    upsertMeta("property", "og:locale", DEFAULT_OG.locale);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "twitter:image:alt", title);

    upsertMeta("name", "description", description);
    upsertLink("canonical", url);
  }, [title, description, image, path, type]);
}
