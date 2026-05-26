/** URLs e textos padrão para Open Graph / Twitter Cards (partilhas em redes sociais). */
export const SITE_ORIGIN = "https://remakepix.com";

export const DEFAULT_OG = {
  title: "Remake Pixel — Estúdio AI de imagem e vídeo",
  description:
    "Gera, edita e cria imagens com IA. 96 estilos, pôsteres profissionais, vídeo e ferramentas Pro — créditos simples, sem mensalidade obrigatória.",
  image: `${SITE_ORIGIN}/og-image.jpg`,
  imageWidth: "1200",
  imageHeight: "630",
  locale: "pt_PT",
  siteName: "Remake Pixel",
};

export function absoluteUrl(pathname = "/") {
  if (!pathname || pathname === "/") return SITE_ORIGIN;
  return `${SITE_ORIGIN}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
