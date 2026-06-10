/**
 * English SEO copy — default for crawlers, Open Graph, and JSON-LD.
 * Primary indexing language: en (see index.html + siteMeta).
 */

export const SITE_NAME = "Remake Pixel";
export const SITE_ORIGIN = "https://remakepix.com";

export const SEO_HOME = {
  title: "Remake Pixel — AI Image & Video Studio",
  documentTitle: "AI Image & Video Studio",
  description:
    "Create and edit images with AI: 96+ styles, professional posters, video generation, background removal, upscale, and Pro retouching. Pay-as-you-go credits — no subscription required.",
  keywords:
    "AI image generator, AI photo editor, remove background, AI video, poster maker, image upscale, photo restore, AI art studio, Remake Pixel",
  path: "/",
};

export const SEO_DISCOVER = {
  title: "How Remake Pixel Works — AI Creative Studio",
  documentTitle: "How It Works",
  description:
    "See how Remake Pixel works: generate images from text, apply artistic styles, edit photos, design posters, create AI video, and use pro tools — all with simple credits.",
  keywords:
    "how AI image generator works, Remake Pixel features, AI studio tutorial, AI poster tool, AI video generator",
  path: "/discover",
};

export const SEO_EXPLORE = {
  title: "Explore AI Creations — Remake Pixel Gallery",
  documentTitle: "Explore Gallery",
  description:
    "Browse public AI-generated images from the Remake Pixel community. Inspiration for portraits, posters, styles, and creative projects.",
  path: "/explore",
};

export const SEO_LOGIN = {
  title: "Log in — Remake Pixel",
  documentTitle: "Log in",
  description: "Sign in to your Remake Pixel studio. Generate and edit images with AI using credits.",
  path: "/login",
  noindex: true,
};

export const SEO_REGISTER = {
  title: "Sign up free — Remake Pixel",
  documentTitle: "Sign up free",
  description:
    "Create a free Remake Pixel account and get starter credits. AI image generation, posters, video, and editing tools in one studio.",
  path: "/register",
};

/** FAQ copy for FAQPage schema (English). */
export const SEO_FAQ = [
  {
    q: "What is Remake Pixel?",
    a: "Remake Pixel is an AI image and video studio that combines generation, editing, artistic styles, professional posters, video, and utility tools in one credit-based account.",
  },
  {
    q: "How do credits work?",
    a: "Each tool shows its cost before you generate. Text-to-image starts from 18 credits; video, Pro retouch, HD options, and prompt enhancement add credits depending on what you use.",
  },
  {
    q: "Do I get free credits?",
    a: "Yes. Every new account starts with 50 free credits — enough to try the studio before buying more.",
  },
  {
    q: "Which AI models do you use?",
    a: "We use a curated stack of engines: fast, pro, premium, and specialized models for editing, video, and technical tasks like background removal and upscale.",
  },
  {
    q: "Can I use my own photos?",
    a: "Yes. Upload photos for retouching, artistic styles, posters, background removal, upscale, colorization, inpainting, and more.",
  },
  {
    q: "What formats and aspect ratios are supported?",
    a: "Common image formats (JPEG, PNG, WEBP) and publishing ratios: 1:1, 4:5, 3:4, 9:16, 16:9, and 21:9.",
  },
  {
    q: "Can I use creations commercially?",
    a: "Images generated with paid credits can be used in commercial projects, provided you have rights to any photos you upload.",
  },
  {
    q: "What is your refund policy?",
    a: "If a generation fails due to a technical error, credits may be refunded automatically. Credits spent on successful outputs are not refundable.",
  },
  {
    q: "Is a subscription required?",
    a: "No. The main model is one-time credit packs — no hidden auto-renewing subscription.",
  },
  {
    q: "Which languages does the app support?",
    a: "The interface is available in English, Portuguese, Spanish, and French. SEO and default metadata are provided in English.",
  },
];

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/favicon-32x32.png`,
    sameAs: [],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: SEO_HOME.description,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/discover`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free starter credits on signup; pay-as-you-go credit packs",
    },
    description: SEO_HOME.description,
    url: SITE_ORIGIN,
    inLanguage: "en",
  };
}

export function faqPageJsonLd(faqs = SEO_FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };
}
