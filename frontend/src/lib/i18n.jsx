import { createContext, useContext, useState } from "react";

const dict = {
  pt: {
    nav_pricing: "Preços", nav_gallery: "Galeria", nav_login: "Entrar", nav_signup: "Criar Conta",
    hero_eyebrow: "Para fotógrafos. Para marcas. Para contadores de histórias.",
    hero_title_1: "Transforma ideias",
    hero_title_2: "em arte",
    hero_title_3: "em segundos.",
    hero_cta_primary: "Começar grátis — 50 créditos",
    hero_cta_secondary: "Ver a galeria",
    quote_text: "A imagem é um instante. A nossa missão é dar-te mil instantes por noite.",
    quote_author: "— Studio Manifesto",
    pricing_eyebrow: "Créditos, não subscrições.",
    pricing_title: "Pagas só pelo que crias.",
    pricing_subtitle: "Cada conta começa com 50 créditos. Indica um amigo, ganha mais 10. Créditos nunca expiram.",
    cost_table_title: "Custos por operação",
    faq_title: "Perguntas?",
    faq_subtitle: "Temos respostas.",
    footer_rights: "Criado em pixels.",
    sidebar_generate: "Gerar", sidebar_gallery: "Galeria", sidebar_favorites: "Favoritos",
    sidebar_billing: "Faturação", sidebar_settings: "Definições", sidebar_profile: "Perfil",
    sidebar_referrals: "Referências", sidebar_admin: "Admin",
    btn_generate: "Gerar imagem", btn_logout: "Sair",
    credits: "créditos",
  },
  en: {
    nav_pricing: "Pricing", nav_gallery: "Gallery", nav_login: "Log in", nav_signup: "Sign up",
    hero_eyebrow: "For photographers. For brands. For storytellers.",
    hero_title_1: "Turn ideas",
    hero_title_2: "into art",
    hero_title_3: "in seconds.",
    hero_cta_primary: "Start free — 50 credits",
    hero_cta_secondary: "See the gallery",
    quote_text: "An image is an instant. Our craft is to give you a thousand instants per night.",
    quote_author: "— Studio Manifesto",
    pricing_eyebrow: "Credits, not subscriptions.",
    pricing_title: "Pay for what you create.",
    pricing_subtitle: "Every account starts with 50 free credits. Refer a friend, earn 10 more. Credits never expire.",
    cost_table_title: "Costs per operation",
    faq_title: "Got questions?",
    faq_subtitle: "We've got answers.",
    footer_rights: "Crafted in pixels.",
    sidebar_generate: "Generate", sidebar_gallery: "Gallery", sidebar_favorites: "Favorites",
    sidebar_billing: "Billing", sidebar_settings: "Settings", sidebar_profile: "Profile",
    sidebar_referrals: "Referrals", sidebar_admin: "Admin",
    btn_generate: "Generate image", btn_logout: "Log out",
    credits: "credits",
  },
};

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("rp_lang") || "pt");
  const switchLang = (l) => { setLang(l); localStorage.setItem("rp_lang", l); };
  const t = (key) => dict[lang]?.[key] || dict.pt[key] || key;
  return <I18nCtx.Provider value={{ lang, t, switchLang }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
