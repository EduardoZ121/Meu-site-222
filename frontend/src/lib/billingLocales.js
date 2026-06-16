/** Billing page — packages, FAQ, balance, terms. */

const en = {
  bill_balance_label: "Current balance",
  bill_credits_unlimited: "∞ credits",
  bill_credits_count: "{n} credits",
  bill_most_popular: "Most popular",
  bill_promo_launch: "Launch promo",
  bill_credits_per_unit: "{n} cr / {unit}",
  bill_opening_stripe: "Opening Stripe…",
  bill_buy: "Buy {name}",
  bill_recent_activity: "Recent activity",
  bill_tx_count: "{n} transactions",
  bill_no_tx: "No transactions yet. Your first purchase will appear here.",
  bill_terms_eyebrow: "Important terms",
  bill_terms_title: "Credits & refunds",
  bill_terms_1:
    "When you buy a package, you accept that credits are digital and not refundable in cash after payment is confirmed, except where the law requires otherwise.",
  bill_terms_2:
    "Each generation debits the cost shown in the tool. If the result is delivered successfully, that spend is final.",
  bill_terms_3:
    "If a generation fails (server error, timeout, empty output, or content blocked by the model), credits for that attempt are refunded automatically.",
  bill_terms_4:
    "Requests with adult or explicit content may be refused by models (e.g. Grok); credits are refunded automatically — rephrase the prompt neutrally.",
  bill_terms_5: "Billing questions:",
  bill_terms_confirm: "By clicking Buy, you confirm these terms.",
  bill_faq_title: "Frequently asked questions",
  bill_payment_pending: "Payment not confirmed yet.",
  bill_purchase_desc: "Purchase {pkg}",
  bill_custom_title: "Custom amount",
  bill_custom_subtitle: "Pick how many credits you need — base rate {rate} credits per €1 (no volume bonus).",
  bill_pkg_bonus: "+{n}% bonus credits",
  bill_custom_amount_label: "Credits",
  bill_custom_min: "Minimum {n} credits",
  bill_custom_price: "Total",
  bill_custom_buy: "Buy {n} credits",
  bill_custom_invalid: "Enter at least {n} credits.",

  bill_hq_eyebrow: "Poster HQ credits",
  bill_hq_title: "High-quality posters",
  bill_hq_subtitle: "Separate wallet for the poster High quality engine only. If you choose High quality in Posters, this is the balance it uses.",
  bill_hq_balance_label: "HQ credits",
  bill_hq_balance_hint: "For poster High quality",
  bill_hq_credits_count: "{n} HQ credits",
  bill_hq_credits_unlimited: "∞ HQ credits",
  bill_hq_per_gen: "50 créditos HQ = 1 poster alta qualidade",
  bill_hq_credits_added: "+{n} HQ credits added",
  bill_hq_purchase_desc: "HQ purchase {pkg}",
  label_hq_credits: "HQ credits",

  bill_pkg_starter_tag: "Launch promo",
  bill_pkg_starter_blurb: "Limited-time offer for new creators: more credits to start without worry.",
  bill_pkg_starter_b1: "150 credits",
  bill_pkg_starter_b2: "Image generation",

  bill_pkg_creator_tag: "For active creators",
  bill_pkg_creator_blurb: "Credit-focused plan for frequent creators.",
  bill_pkg_creator_b1: "345 credits",
  bill_pkg_creator_b2: "More generations before top-up",
  bill_pkg_creator_b3: "Use credits on any tool",
  bill_pkg_creator_b4: "No feature lock — pay per use",

  bill_pkg_studio_tag: "Pro workflows",
  bill_pkg_studio_blurb: "Highest credit volume for heavy production workflows.",
  bill_pkg_studio_b1: "780 credits",
  bill_pkg_studio_b2: "Best value per credit",
  bill_pkg_studio_b3: "Use credits across image/video tools",
  bill_pkg_studio_b4: "No feature lock — pay per use",

  bill_pkg_pro_tag: "Maximum volume",
  bill_pkg_pro_blurb: "Best rate for agencies and power users — 40% bonus on base credits.",
  bill_pkg_pro_b1: "2100 credits",
  bill_pkg_pro_b2: "42 credits per €1",
  bill_pkg_pro_b3: "All tools unlocked via credits",
  bill_pkg_pro_b4: "Ideal for teams & daily production",

  bill_faq1_q: "What are credits?",
  bill_faq1_a:
    "Each tool shows the cost before you generate. Text-to-image starts at 18 credits; HD, prompt enhance, and premium effects add surcharges. Video and Pro tools cost more to reflect API usage.",
  bill_faq2_q: "Do credits expire?",
  bill_faq2_a: "One-time pack credits never expire. On Creator Monthly, 400 credits renew each cycle and do not roll over.",
  bill_faq3_q: "Purchases & refunds",
  bill_faq3_a:
    "Paid credit packages are not refundable in cash after purchase (except where the law requires). Credits spent on a successful generation are not returned. If a generation fails due to a technical error, timeout, or model block, credits for that attempt are refunded automatically.",
  bill_faq4_q: "Which payment methods do you accept?",
  bill_faq4_a:
    "Secure payments via Stripe: credit/debit cards (Visa, Mastercard, Amex), Apple Pay, and Google Pay.",
  bill_faq5_q: "Are features locked by plan?",
  bill_faq5_a:
    "No. Features are credit-based. The more advanced options you enable (quality, prompt enhance, video edits), the more credits are charged.",
};

const pt = {
  bill_balance_label: "Saldo actual",
  bill_credits_unlimited: "∞ créditos",
  bill_credits_count: "{n} créditos",
  bill_most_popular: "Mais popular",
  bill_promo_launch: "Promo lançamento",
  bill_credits_per_unit: "{n} cr / {unit}",
  bill_opening_stripe: "A abrir Stripe…",
  bill_buy: "Comprar {name}",
  bill_recent_activity: "Atividade recente",
  bill_tx_count: "{n} transações",
  bill_no_tx: "Ainda não tens transações. A primeira compra fica registada aqui.",
  bill_terms_eyebrow: "Termos importantes",
  bill_terms_title: "Créditos e reembolsos",
  bill_terms_1:
    "Ao comprar um pacote, aceitas que os créditos são digitais e não reembolsáveis em dinheiro após o pagamento confirmado, excepto quando a lei o exigir.",
  bill_terms_2:
    "Cada geração debita o custo indicado na ferramenta. Se o resultado for entregue com sucesso, esse gasto é definitivo.",
  bill_terms_3:
    "Se a geração falhar (erro do servidor, tempo esgotado, saída vazia ou conteúdo bloqueado pelo modelo), os créditos dessa tentativa são devolvidos automaticamente.",
  bill_terms_4:
    "Pedidos com conteúdo adulto ou explícito podem ser recusados pelos modelos (ex.: Grok); nesse caso também há devolução automática — reformula o prompt de forma neutra.",
  bill_terms_5: "Dúvidas de faturação:",
  bill_terms_confirm: "Ao clicar em Comprar, confirmas estes termos.",
  bill_faq_title: "Perguntas frequentes",
  bill_payment_pending: "Pagamento ainda não confirmado.",
  bill_purchase_desc: "Compra {pkg}",
  bill_custom_title: "Quantidade à tua escolha",
  bill_custom_subtitle: "Escolhe quantos créditos queres — taxa base {rate} créditos por €1 (sem bónus de volume).",
  bill_pkg_bonus: "+{n}% créditos bónus",
  bill_custom_amount_label: "Créditos",
  bill_custom_min: "Mínimo {n} créditos",
  bill_custom_price: "Total",
  bill_custom_buy: "Comprar {n} créditos",
  bill_custom_invalid: "Indica pelo menos {n} créditos.",

  bill_hq_eyebrow: "Créditos HQ posters",
  bill_hq_title: "Posters alta qualidade",
  bill_hq_subtitle: "Carteira separada só para o motor Alta qualidade dos Posters. Se escolheres Alta qualidade, é este saldo que será usado.",
  bill_hq_balance_label: "Créditos HQ",
  bill_hq_balance_hint: "Para Alta qualidade dos Posters",
  bill_hq_credits_count: "{n} créditos HQ",
  bill_hq_credits_unlimited: "∞ créditos HQ",
  bill_hq_per_gen: "50 créditos HQ = 1 poster alta qualidade",
  bill_hq_credits_added: "+{n} créditos HQ adicionados",
  bill_hq_purchase_desc: "Compra HQ {pkg}",
  label_hq_credits: "Créditos HQ",

  bill_pkg_starter_tag: "Promo lançamento",
  bill_pkg_starter_blurb: "Oferta temporária para novos criadores: mais créditos para começares sem medo.",
  bill_pkg_starter_b1: "150 créditos",
  bill_pkg_starter_b2: "Geração de imagem",

  bill_pkg_creator_tag: "Para criadores activos",
  bill_pkg_creator_blurb: "Plano focado em créditos para quem cria com frequência.",
  bill_pkg_creator_b1: "345 créditos",
  bill_pkg_creator_b2: "Mais gerações antes de recarregar",
  bill_pkg_creator_b3: "Usa créditos em qualquer ferramenta",
  bill_pkg_creator_b4: "Sem bloqueio por plano — paga por uso",

  bill_pkg_studio_tag: "Workflows pro",
  bill_pkg_studio_blurb: "Maior volume de créditos para fluxos de produção intensivos.",
  bill_pkg_studio_b1: "780 créditos",
  bill_pkg_studio_b2: "Melhor valor por crédito",
  bill_pkg_studio_b3: "Usa créditos em imagem e vídeo",
  bill_pkg_studio_b4: "Sem bloqueio por plano — paga por uso",

  bill_pkg_pro_tag: "Volume máximo",
  bill_pkg_pro_blurb: "Melhor taxa para agências e uso intensivo — 40% de bónus sobre a base.",
  bill_pkg_pro_b1: "2100 créditos",
  bill_pkg_pro_b2: "42 créditos por €1",
  bill_pkg_pro_b3: "Todas as ferramentas por créditos",
  bill_pkg_pro_b4: "Ideal para equipas e produção diária",

  bill_faq1_q: "O que são créditos?",
  bill_faq1_a:
    "Cada ferramenta mostra o custo antes de gerar. Imagem por texto desde 18 créditos; HD, melhorar prompt e efeitos premium acrescentam custo. Vídeo e Pro reflectem o uso real das APIs.",
  bill_faq2_q: "Os créditos expiram?",
  bill_faq2_a: "Os créditos dos packs avulsos nunca expiram. No Creator Mensal, 400 créditos renovam a cada ciclo e não acumulam.",
  bill_faq3_q: "Compras e reembolsos",
  bill_faq3_a:
    "Os pacotes de créditos pagos não são reembolsáveis em dinheiro após a compra (salvo obrigação legal). Créditos já gastos numa geração concluída também não são devolvidos. Se uma geração falhar por erro técnico, timeout ou bloqueio do modelo, os créditos dessa tentativa são devolvidos automaticamente à tua conta.",
  bill_faq4_q: "Que métodos de pagamento aceitam?",
  bill_faq4_a:
    "Pagamentos seguros via Stripe: cartão de crédito/débito (Visa, Mastercard, Amex), Apple Pay e Google Pay.",
  bill_faq5_q: "As funcionalidades ficam bloqueadas por plano?",
  bill_faq5_a:
    "Não. As funcionalidades são por créditos. Quanto mais opções avançadas activares (qualidade, melhorar prompt, edição de vídeo), mais créditos são cobrados.",
};

export const BILLING_FAQ_KEYS = ["bill_faq1", "bill_faq2", "bill_faq3", "bill_faq4", "bill_faq5"];

export const BILLING_PKG_KEYS = {
  starter: {
    tag: "bill_pkg_starter_tag",
    blurb: "bill_pkg_starter_blurb",
    bullets: ["bill_pkg_starter_b1", "bill_pkg_starter_b2"],
  },
  creator: {
    tag: "bill_pkg_creator_tag",
    blurb: "bill_pkg_creator_blurb",
    bullets: [
      "bill_pkg_creator_b1",
      "bill_pkg_creator_b2",
      "bill_pkg_creator_b3",
      "bill_pkg_creator_b4",
    ],
  },
  studio: {
    tag: "bill_pkg_studio_tag",
    blurb: "bill_pkg_studio_blurb",
    bullets: [
      "bill_pkg_studio_b1",
      "bill_pkg_studio_b2",
      "bill_pkg_studio_b3",
      "bill_pkg_studio_b4",
    ],
  },
  pro: {
    tag: "bill_pkg_pro_tag",
    blurb: "bill_pkg_pro_blurb",
    bullets: [
      "bill_pkg_pro_b1",
      "bill_pkg_pro_b2",
      "bill_pkg_pro_b3",
      "bill_pkg_pro_b4",
    ],
  },
};

export function mergeBillingLocales(dict) {
  Object.assign(dict.en, en);
  Object.assign(dict.pt, pt);
  Object.assign(dict.es, { ...en, ...dict.es });
  Object.assign(dict.fr, { ...en, ...dict.fr });
}
