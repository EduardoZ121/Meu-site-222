import { useSocialMeta } from "../lib/useSocialMeta";
import { DEFAULT_OG } from "../lib/siteMeta";

/** Meta tags globais (SPA) alinhadas com siteConfig / env. */
export default function GlobalSiteMeta() {
  useSocialMeta({
    title: DEFAULT_OG.title,
    description: DEFAULT_OG.description,
    image: DEFAULT_OG.image,
    path: "/",
  });
  return null;
}
