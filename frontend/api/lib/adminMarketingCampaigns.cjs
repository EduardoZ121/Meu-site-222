/**
 * Admin marketing — editable campaigns (MongoDB) + batch broadcast.
 */
const crypto = require("crypto");
const { getDb, storageEnabled } = require("./mongo.cjs");
const { sendResendEmail } = require("./emailReport.cjs");
const { buildPromoEmailHtml, absUrl } = require("./emailBranding.cjs");
const { isSubscriptionActive } = require("./creatorSubscription.cjs");
const { isValidEmail } = require("./videoNotifyEmail.cjs");

const COLLECTION = "marketing_campaigns";

const DEFAULT_CAMPAIGNS = [
  {
    id: "video_ai_power",
    title: "Vídeo IA — Potência cinematográfica",
    subject: "🔥 Vídeo IA no Remake Pixel — transforma clips em anúncios",
    preheader: "Editor de vídeo, marketing IA e motion flyers — abre o estúdio agora.",
    heroImage: "/marketing-email/campaign-video-ai.png",
    badge: "NOVIDADE",
    headline: "O teu próximo anúncio começa com um clip",
    subheadline: "Edição IA, vídeos de marketing e motion flyers num só motor criativo.",
    paragraphs: [
      "Carrega uma imagem ou vídeo, escolhe o visual — a IA faz o resto em minutos.",
      "Ideal para TikTok, Reels, Shorts e campanhas de produto.",
    ],
    bullets: [
      "Vídeos de marketing com storyboard automático",
      "Motion flyers a partir dos teus pósteres",
      "Formatos 9:16, 1:1 e 16:9 prontos a publicar",
    ],
    highlight: null,
    ctaPrimary: { label: "Abrir estúdio de vídeo", url: "/app/video" },
    ctaSecondary: { label: "Ver preços", url: "/app/billing" },
  },
  {
    id: "posters_pro",
    title: "Pôsteres Pro — Flyers que vendem",
    subject: "✨ Pôsteres IA que parecem agência — experimenta hoje",
    preheader: "Moda, eventos, comida, negócios — templates prontos com a tua foto.",
    heroImage: "/marketing-email/campaign-posters.png",
    badge: "POPULAR",
    headline: "Flyers profissionais sem designer",
    subheadline: "Dezenas de templates. A tua cara. Texto incluído.",
    paragraphs: [
      "Escolhe o template, carrega a foto e gera pósteres prontos para Instagram, stories ou impressão.",
      "Depois anima o flyer em vídeo com um clique.",
    ],
    bullets: [
      "Templates moda, eventos, DJ, comida e negócios",
      "Tipografia e layout automáticos",
      "Exporta e partilha na hora",
    ],
    highlight: null,
    ctaPrimary: { label: "Criar póster agora", url: "/app/posters" },
    ctaSecondary: { label: "Ver galeria", url: "/app/gallery" },
  },
  {
    id: "creator_pack",
    title: "Pack Creator — Melhor valor",
    subject: "💎 Pack Creator: mais créditos, mais criações",
    preheader: "345 créditos por €10 — o sweet spot para criadores activos.",
    heroImage: "/marketing-email/campaign-creator-pack.png",
    badge: "MELHOR VALOR",
    headline: "Mais créditos. Menos paragens.",
    subheadline: "Para quem cria todos os dias — imagens, pósteres e vídeos.",
    paragraphs: [
      "Compra créditos uma vez, usa quando quiseres. Sem subscrição obrigatória.",
      "Pacotes maiores incluem bónus de créditos extra.",
    ],
    bullets: [
      "Pagamento seguro via Stripe",
      "Créditos não expiram",
      "Upgrade instantâneo na conta",
    ],
    highlight: { label: "Pack Creator", value: "345 créditos", sub: "≈ 23 imagens ou vários pósteres · €10" },
    ctaPrimary: { label: "Comprar créditos", url: "/app/billing" },
    ctaSecondary: { label: "Começar grátis", url: "/app/tools" },
  },
  {
    id: "gallery_comeback",
    title: "Volta ao estúdio — Galeria",
    subject: "👀 As tuas criações estão à tua espera",
    preheader: "Tudo o que geraste — imagens e vídeos — num só sítio.",
    heroImage: "/marketing-email/campaign-gallery.png",
    badge: "LEMBRETE",
    headline: "Não percas o que já criaste",
    subheadline: "A galeria guarda tudo. Descarrega, favorita, partilha.",
    paragraphs: [
      "Entra na galeria e revê as tuas últimas gerações — organizadas e prontas a usar.",
      "Novidade: recupera criações em falta com um clique.",
    ],
    bullets: [
      "Histórico completo de imagens e vídeos",
      "Download em alta qualidade",
      "Favoritos para acederes mais rápido",
    ],
    highlight: null,
    ctaPrimary: { label: "Abrir galeria", url: "/app/gallery" },
    ctaSecondary: { label: "Gerar algo novo", url: "/app/generate" },
  },
  {
    id: "motion_flyer",
    title: "Motion Flyer — Póster animado",
    subject: "🎬 Anima o teu flyer em 10 segundos",
    preheader: "Motion flyer estilo After Effects — só carregas a imagem.",
    heroImage: "/marketing-email/campaign-motion-flyer.png",
    badge: "EXCLUSIVO",
    headline: "Flyer estático → vídeo que hipnotiza",
    subheadline: "A IA analisa camadas, escolhe o motion e gera 10s com áudio.",
    paragraphs: [
      "Perfeito para eventos, promoções e lançamentos. Um póster vira campanha completa.",
      "Escolhe TikTok, Reels ou YouTube — nós ajustamos o formato.",
    ],
    bullets: [
      "Análise automática do teu flyer",
      "10 segundos com motion profissional",
      "Entrega por email quando estiver pronto",
    ],
    highlight: null,
    ctaPrimary: { label: "Animar flyer", url: "/app/motion-flyer" },
    ctaSecondary: { label: "Criar póster primeiro", url: "/app/posters" },
  },
];

function newCampaignId() {
  return `mkt_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
}

function cleanLines(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => String(s || "").trim()).filter(Boolean);
}

function cleanCta(raw, required = false) {
  const label = String(raw?.label || "").trim();
  const url = String(raw?.url || "").trim();
  if (!label && !url) return required ? null : null;
  if (!label || !url) {
    const err = new Error("Cada botão precisa de texto e URL.");
    err.status = 400;
    throw err;
  }
  return { label, url };
}

function cleanHighlight(raw) {
  if (!raw || typeof raw !== "object") return null;
  const label = String(raw.label || "").trim();
  const value = String(raw.value || "").trim();
  const sub = String(raw.sub || "").trim();
  if (!label && !value && !sub) return null;
  return { label, value, sub };
}

function normalizeCampaignInput(body, { partial = false } = {}) {
  const src = body && typeof body === "object" ? body : {};
  const out = {};

  const pick = (key, transform = (v) => String(v || "").trim()) => {
    if (partial && src[key] === undefined) return;
    out[key] = transform(src[key]);
  };

  pick("title");
  pick("subject");
  pick("preheader");
  pick("heroImage");
  pick("badge");
  pick("headline");
  pick("subheadline");

  if (!partial || src.paragraphs !== undefined) {
    out.paragraphs = cleanLines(src.paragraphs);
  }
  if (!partial || src.bullets !== undefined) {
    out.bullets = cleanLines(src.bullets);
  }
  if (!partial || src.highlight !== undefined) {
    out.highlight = cleanHighlight(src.highlight);
  }
  if (!partial || src.ctaPrimary !== undefined) {
    out.ctaPrimary = cleanCta(src.ctaPrimary, !partial);
  }
  if (!partial || src.ctaSecondary !== undefined) {
    const sec = cleanCta(src.ctaSecondary, false);
    out.ctaSecondary = sec;
  }

  if (!partial) {
    if (!out.title) {
      const err = new Error("Nome interno da campanha em falta.");
      err.status = 400;
      throw err;
    }
    if (!out.subject) {
      const err = new Error("Assunto do email em falta.");
      err.status = 400;
      throw err;
    }
    if (!out.headline) {
      const err = new Error("Título principal em falta.");
      err.status = 400;
      throw err;
    }
    if (!out.ctaPrimary) {
      const err = new Error("Botão principal em falta (texto + URL).");
      err.status = 400;
      throw err;
    }
  }

  return out;
}

function docToCampaign(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    title: doc.title || "",
    subject: doc.subject || "",
    preheader: doc.preheader || "",
    heroImage: doc.heroImage || "",
    badge: doc.badge || "",
    headline: doc.headline || "",
    subheadline: doc.subheadline || "",
    paragraphs: doc.paragraphs || [],
    bullets: doc.bullets || [],
    highlight: doc.highlight || null,
    ctaPrimary: doc.ctaPrimary || null,
    ctaSecondary: doc.ctaSecondary || null,
    sort_order: doc.sort_order ?? 0,
    created_at: doc.created_at || null,
    updated_at: doc.updated_at || null,
  };
}

function campaignToClient(c) {
  const base = docToCampaign(c);
  if (!base) return null;
  return {
    ...base,
    heroImage: base.heroImage ? absUrl(base.heroImage) : "",
    heroImageRaw: base.heroImage || "",
  };
}

function buildCampaignHtml(campaign) {
  return buildPromoEmailHtml({
    preheader: campaign.preheader,
    heroImageUrl: campaign.heroImage,
    badge: campaign.badge,
    headline: campaign.headline,
    subheadline: campaign.subheadline,
    paragraphs: campaign.paragraphs || [],
    highlight: campaign.highlight || null,
    bullets: campaign.bullets || [],
    ctaPrimary: campaign.ctaPrimary,
    ctaSecondary: campaign.ctaSecondary || null,
    footerLines: [
      "Remake Pixel · remakepix.com",
      "Recebeste este email porque tens conta no Remake Pixel.",
      "Para deixar de receber promoções, responde a este email.",
    ],
  });
}

function buildCampaignText(campaign) {
  return [
    campaign.headline,
    campaign.subheadline,
    "",
    ...(campaign.paragraphs || []),
    "",
    ...(campaign.bullets || []).map((b) => `• ${b}`),
    "",
    campaign.ctaPrimary ? `${campaign.ctaPrimary.label}: ${absUrl(campaign.ctaPrimary.url)}` : "",
    campaign.ctaSecondary?.url
      ? `${campaign.ctaSecondary.label}: ${absUrl(campaign.ctaSecondary.url)}`
      : "",
    "",
    "remakepix.com",
  ].filter(Boolean).join("\n");
}

async function ensureSeeded() {
  if (!storageEnabled()) return;
  const db = await getDb();
  const count = await db.collection(COLLECTION).countDocuments({});
  if (count > 0) return;
  const now = new Date().toISOString();
  await db.collection(COLLECTION).insertMany(
    DEFAULT_CAMPAIGNS.map((c, i) => ({
      ...c,
      sort_order: i,
      created_at: now,
      updated_at: now,
    })),
  );
}

async function getCampaignFromDb(id) {
  if (!storageEnabled()) return null;
  await ensureSeeded();
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ id: String(id || "").trim() });
  return docToCampaign(doc);
}

async function countMarketingRecipients() {
  const breakdown = await countMarketingAudience();
  return breakdown.total;
}

async function countMarketingAudience() {
  if (!storageEnabled()) return { total: 0, subscribers: 0, non_subscribers: 0 };
  const db = await getDb();
  const rows = await db.collection("users").find(
    {
      email: { $exists: true, $nin: [null, ""] },
      banned: { $ne: true },
    },
    { projection: { email: 1, subscription_status: 1, subscription_period_end: 1 } },
  ).toArray();
  const seen = new Map();
  for (const u of rows) {
    const e = String(u.email || "").trim().toLowerCase();
    if (!isValidEmail(e) || seen.has(e)) continue;
    seen.set(e, u);
  }
  let subscribers = 0;
  for (const doc of seen.values()) {
    if (isSubscriptionActive(doc)) subscribers += 1;
  }
  const total = seen.size;
  return { total, subscribers, non_subscribers: Math.max(0, total - subscribers) };
}

async function lookupUserSubscriptionByEmail(email) {
  if (!storageEnabled()) return null;
  const e = String(email || "").trim().toLowerCase();
  if (!isValidEmail(e)) return null;
  const db = await getDb();
  const doc = await db.collection("users").findOne(
    { email: e },
    { projection: { email: 1, subscription_status: 1, subscription_period_end: 1, subscription_plan: 1, subscription_credits: 1 } },
  );
  if (!doc) return { email: e, found: false, subscription_active: false };
  return {
    email: e,
    found: true,
    subscription_active: isSubscriptionActive(doc),
    subscription_status: doc.subscription_status || "none",
    subscription_plan: doc.subscription_plan || null,
    subscription_credits: Number(doc.subscription_credits) || 0,
  };
}

async function listMarketingRecipients(limit = 5000) {
  if (!storageEnabled()) return [];
  const db = await getDb();
  const rows = await db.collection("users").find(
    {
      email: { $exists: true, $nin: [null, ""] },
      banned: { $ne: true },
    },
    { projection: { email: 1 } },
  ).limit(Math.min(5000, Math.max(1, limit))).toArray();
  const seen = new Set();
  const out = [];
  for (const u of rows) {
    const e = String(u.email || "").trim().toLowerCase();
    if (!isValidEmail(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function listCampaignsForAdmin() {
  if (!storageEnabled()) {
    const err = new Error("Base de dados não configurada.");
    err.status = 503;
    throw err;
  }
  await ensureSeeded();
  const db = await getDb();
  const docs = await db.collection(COLLECTION)
    .find({})
    .sort({ sort_order: 1, created_at: 1 })
    .toArray();
  const audience = await countMarketingAudience();
  return {
    audience_count: audience.total,
    audience_subscribers: audience.subscribers,
    audience_non_subscribers: audience.non_subscribers,
    campaigns: docs.map((doc) => {
      const c = campaignToClient(doc);
      return {
        ...c,
        preview_html: buildCampaignHtml(doc),
      };
    }),
  };
}

function emptyCampaignTemplate() {
  return {
    title: "Nova campanha",
    subject: "Assunto do email",
    preheader: "Pré-visualização na caixa de entrada…",
    heroImage: "",
    badge: "PROMO",
    headline: "Título principal",
    subheadline: "Subtítulo ou promessa",
    paragraphs: ["Primeiro parágrafo do email."],
    bullets: [],
    highlight: null,
    ctaPrimary: { label: "Abrir Remake Pixel", url: "/app/tools" },
    ctaSecondary: null,
  };
}

async function createCampaign(body) {
  if (!storageEnabled()) {
    const err = new Error("Base de dados não configurada.");
    err.status = 503;
    throw err;
  }
  const data = normalizeCampaignInput({ ...emptyCampaignTemplate(), ...body });
  const db = await getDb();
  const now = new Date().toISOString();
  const id = newCampaignId();
  const maxSort = await db.collection(COLLECTION).find({}).sort({ sort_order: -1 }).limit(1).toArray();
  const sort_order = (maxSort[0]?.sort_order ?? -1) + 1;
  const doc = { id, ...data, sort_order, created_at: now, updated_at: now };
  await db.collection(COLLECTION).insertOne(doc);
  const client = campaignToClient(doc);
  return {
    ...client,
    preview_html: buildCampaignHtml(doc),
  };
}

async function updateCampaign(id, body) {
  if (!storageEnabled()) {
    const err = new Error("Base de dados não configurada.");
    err.status = 503;
    throw err;
  }
  const campaignId = String(id || "").trim();
  if (!campaignId) {
    const err = new Error("ID em falta.");
    err.status = 400;
    throw err;
  }
  const patch = normalizeCampaignInput(body, { partial: true });
  if (!Object.keys(patch).length) {
    const err = new Error("Nada para actualizar.");
    err.status = 400;
    throw err;
  }
  patch.updated_at = new Date().toISOString();
  const db = await getDb();
  const res = await db.collection(COLLECTION).findOneAndUpdate(
    { id: campaignId },
    { $set: patch },
    { returnDocument: "after" },
  );
  const doc = res?.value || res;
  if (!doc?.id) {
    const err = new Error("Campanha não encontrada.");
    err.status = 404;
    throw err;
  }
  const client = campaignToClient(doc);
  return {
    ...client,
    preview_html: buildCampaignHtml(doc),
  };
}

async function deleteCampaign(id) {
  if (!storageEnabled()) {
    const err = new Error("Base de dados não configurada.");
    err.status = 503;
    throw err;
  }
  const campaignId = String(id || "").trim();
  const db = await getDb();
  const res = await db.collection(COLLECTION).deleteOne({ id: campaignId });
  if (!res.deletedCount) {
    const err = new Error("Campanha não encontrada.");
    err.status = 404;
    throw err;
  }
  return { ok: true, id: campaignId };
}

function previewCampaignDraft(body) {
  const data = normalizeCampaignInput({ ...emptyCampaignTemplate(), ...body });
  return {
    preview_html: buildCampaignHtml(data),
    subject: data.subject,
  };
}

async function sendMarketingCampaign(campaignId, { email = "" } = {}) {
  const campaign = await getCampaignFromDb(campaignId);
  if (!campaign) {
    const err = new Error("Campanha não encontrada.");
    err.status = 404;
    throw err;
  }
  const one = String(email || "").trim().toLowerCase();
  if (!isValidEmail(one)) {
    const err = new Error("Email inválido.");
    err.status = 400;
    throw err;
  }

  const html = buildCampaignHtml(campaign);
  const text = buildCampaignText(campaign);
  const recipient = await lookupUserSubscriptionByEmail(one);
  const result = await sendResendEmail({ to: one, subject: campaign.subject, html, text });
  return {
    ok: Boolean(result.ok),
    campaign_id: campaignId,
    subject: campaign.subject,
    sent: result.ok ? 1 : 0,
    failed: result.ok ? 0 : 1,
    total: 1,
    recipient,
    errors: result.ok ? [] : [{ to: one, error: result.error || result.reason || "failed" }],
  };
}

async function sendMarketingBatch(campaignId, { cursor = 0, batchSize = 20 } = {}) {
  const campaign = await getCampaignFromDb(campaignId);
  if (!campaign) {
    const err = new Error("Campanha não encontrada.");
    err.status = 404;
    throw err;
  }

  const recipients = await listMarketingRecipients();
  const total = recipients.length;
  const start = Math.max(0, Math.min(total, Number(cursor) || 0));
  const size = Math.min(30, Math.max(1, Number(batchSize) || 20));
  const slice = recipients.slice(start, start + size);

  if (!slice.length) {
    return {
      ok: true,
      campaign_id: campaignId,
      subject: campaign.subject,
      sent: 0,
      failed: 0,
      cursor: start,
      next_cursor: start,
      total,
      done: true,
      errors: [],
    };
  }

  const html = buildCampaignHtml(campaign);
  const text = buildCampaignText(campaign);
  let sent = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < slice.length; i += 1) {
    const to = slice[i];
    // eslint-disable-next-line no-await-in-loop
    const result = await sendResendEmail({ to, subject: campaign.subject, html, text });
    if (result.ok) sent += 1;
    else {
      failed += 1;
      if (errors.length < 5) errors.push({ to, error: result.error || result.reason || "failed" });
    }
    if (i < slice.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(400);
    }
  }

  const next = start + slice.length;
  return {
    ok: true,
    campaign_id: campaignId,
    subject: campaign.subject,
    sent,
    failed,
    cursor: start,
    next_cursor: next,
    total,
    done: next >= total,
    errors,
  };
}

module.exports = {
  DEFAULT_CAMPAIGNS,
  emptyCampaignTemplate,
  listCampaignsForAdmin,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  previewCampaignDraft,
  sendMarketingCampaign,
  sendMarketingBatch,
  countMarketingRecipients,
  getCampaignFromDb,
};
