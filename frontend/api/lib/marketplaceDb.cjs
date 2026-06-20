const crypto = require("crypto");
const { getDb, storageEnabled } = require("./mongo.cjs");

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
}

async function ensureMarketplaceIndexes() {
  if (!storageEnabled()) return;
  const db = await getDb();
  if (!db?.collection) return;
  await db.collection("marketplace_profiles").createIndex?.("user_id", { unique: true });
  await db.collection("marketplace_listings").createIndex?.([["created_at", -1]]);
  await db.collection("marketplace_listings").createIndex?.([["owner_user_id", 1], ["created_at", -1]]);
  await db.collection("marketplace_favorites").createIndex?.([["user_id", 1], ["listing_id", 1]], { unique: true });
  await db.collection("marketplace_history").createIndex?.([["user_id", 1], ["viewed_at", -1]]);
  await db.collection("marketplace_chats").createIndex?.([["listing_id", 1], ["created_at", 1]]);
}

function defaultProfile(identity) {
  return {
    id: id("mkt_profile"),
    user_id: identity.userId,
    email: identity.email || "",
    name: "",
    phone: "",
    account_type: "Proprietário Particular",
    verified_profile: false,
    verified_phone: false,
    verified_document: false,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function trustSeal(profile = {}) {
  if (profile.verified_profile && profile.verified_phone) {
    return profile.verified_document ? "Ouro" : "Prata";
  }
  return "Sem selo";
}

async function getOrCreateProfile(identity) {
  const db = await getDb();
  if (!db) return defaultProfile(identity);
  const col = db.collection("marketplace_profiles");
  const found = await col.findOne({ user_id: identity.userId }, { projection: { _id: 0 } });
  if (found) return found;
  const created = defaultProfile(identity);
  await col.insertOne(created);
  return created;
}

async function updateProfile(identity, patch = {}) {
  const db = await getDb();
  if (!db) {
    return {
      ...defaultProfile(identity),
      ...patch,
      user_id: identity.userId,
      email: identity.email || "",
      updated_at: nowIso(),
    };
  }
  const current = await getOrCreateProfile(identity);
  const next = {
    ...current,
    ...patch,
    user_id: identity.userId,
    email: identity.email || current.email || "",
    updated_at: nowIso(),
  };
  await db.collection("marketplace_profiles").updateOne(
    { user_id: identity.userId },
    { $set: { ...next } },
    { upsert: true },
  );
  return next;
}

async function listListings(filters = {}) {
  const db = await getDb();
  if (!db) return [];
  const query = {};
  if (filters.category && filters.category !== "Todos") query.category = filters.category;
  if (filters.operation && filters.operation !== "Todos") query.operation = filters.operation;
  if (filters.province && filters.province !== "Todos") query.province = filters.province;
  if (filters.municipality && filters.municipality !== "Todos") query.municipality = filters.municipality;
  if (filters.neighborhood && filters.neighborhood !== "Todos") query.neighborhood = filters.neighborhood;
  if (filters.owner_type && filters.owner_type !== "Todos") query.owner_type = filters.owner_type;
  const rows = await db.collection("marketplace_listings").find(query, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(200).toArray();
  return rows;
}

async function createListing(identity, payload = {}) {
  const db = await getDb();
  if (!db) throw Object.assign(new Error("Storage indisponível."), { status: 503 });
  const profile = await getOrCreateProfile(identity);
  const listing = {
    id: id("mkt_listing"),
    owner_user_id: identity.userId,
    owner_name: profile.name || payload.owner_name || "Anunciante",
    owner_email: profile.email || "",
    owner_phone: profile.phone || payload.owner_phone || "",
    owner_type: profile.account_type || "Proprietário Particular",
    verified_profile: Boolean(profile.verified_profile),
    verified_phone: Boolean(profile.verified_phone),
    verified_document: Boolean(profile.verified_document),
    trust_seal: trustSeal(profile),
    category: payload.category || "Imóvel",
    operation: payload.operation || "Venda",
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    price: Number(payload.price || 0),
    province: payload.province || "",
    municipality: payload.municipality || "",
    neighborhood: payload.neighborhood || "",
    property_type: payload.property_type || null,
    bedrooms: Number(payload.bedrooms || 0),
    bathrooms: Number(payload.bathrooms || 0),
    area: Number(payload.area || 0),
    brand: payload.brand || null,
    model: payload.model || null,
    year: Number(payload.year || 0),
    mileage: Number(payload.mileage || 0),
    fuel: payload.fuel || null,
    gearbox: payload.gearbox || null,
    condition: payload.condition || null,
    status: "active",
    sponsorship_tier: payload.sponsorship_tier || "none",
    lat: Number(payload.lat || 0),
    lng: Number(payload.lng || 0),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  if (!listing.title || !listing.price || !listing.province || !listing.municipality || !listing.neighborhood) {
    const err = new Error("Campos obrigatórios do anúncio em falta.");
    err.status = 400;
    throw err;
  }
  await db.collection("marketplace_listings").insertOne(listing);
  return listing;
}

async function addHistory(identity, listingId) {
  const db = await getDb();
  if (!db || !listingId) return;
  await db.collection("marketplace_history").insertOne({
    id: id("mkt_history"),
    user_id: identity.userId,
    listing_id: listingId,
    viewed_at: nowIso(),
  });
}

async function listHistory(identity) {
  const db = await getDb();
  if (!db) return [];
  const events = await db.collection("marketplace_history").find({ user_id: identity.userId }, { projection: { _id: 0 } }).sort({ viewed_at: -1 }).limit(30).toArray();
  const listingIds = [...new Set(events.map((e) => e.listing_id).filter(Boolean))];
  if (!listingIds.length) return [];
  const rows = await db.collection("marketplace_listings").find({ id: { $in: listingIds } }, { projection: { _id: 0 } }).toArray();
  const byId = new Map(rows.map((r) => [r.id, r]));
  return listingIds.map((idVal) => byId.get(idVal)).filter(Boolean);
}

async function setFavorite(identity, listingId, isFavorite) {
  const db = await getDb();
  if (!db || !listingId) return [];
  const col = db.collection("marketplace_favorites");
  if (isFavorite) {
    await col.updateOne(
      { user_id: identity.userId, listing_id: listingId },
      {
        $set: {
          id: id("mkt_fav"),
          user_id: identity.userId,
          listing_id: listingId,
          created_at: nowIso(),
        },
      },
      { upsert: true },
    );
  } else {
    await col.deleteOne({ user_id: identity.userId, listing_id: listingId });
  }
  return listFavoriteIds(identity);
}

async function listFavoriteIds(identity) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.collection("marketplace_favorites").find({ user_id: identity.userId }, { projection: { _id: 0, listing_id: 1 } }).toArray();
  return rows.map((r) => r.listing_id).filter(Boolean);
}

async function listChats(identity, listingId) {
  const db = await getDb();
  if (!db || !listingId) return [];
  const listing = await db.collection("marketplace_listings").findOne({ id: listingId }, { projection: { _id: 0, owner_user_id: 1 } });
  if (!listing) return [];
  const canRead = listing.owner_user_id === identity.userId || true;
  if (!canRead) return [];
  const rows = await db.collection("marketplace_chats").find({ listing_id: listingId }, { projection: { _id: 0 } }).sort({ created_at: 1 }).limit(200).toArray();
  return rows;
}

async function addChatMessage(identity, payload = {}) {
  const db = await getDb();
  if (!db) throw Object.assign(new Error("Storage indisponível."), { status: 503 });
  const listingId = String(payload.listing_id || "").trim();
  const text = String(payload.text || "").trim();
  if (!listingId || !text) {
    const err = new Error("Mensagem inválida.");
    err.status = 400;
    throw err;
  }
  const message = {
    id: id("mkt_chat"),
    listing_id: listingId,
    sender_user_id: identity.userId,
    sender_name: payload.sender_name || "Utilizador",
    text: text.slice(0, 1200),
    created_at: nowIso(),
  };
  await db.collection("marketplace_chats").insertOne(message);
  return message;
}

async function computeZoneAverages() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.collection("marketplace_listings").find({}, { projection: { _id: 0, province: 1, municipality: 1, neighborhood: 1, price: 1 } }).toArray();
  const acc = new Map();
  for (const row of rows) {
    const zone = `${row.province || ""} / ${row.municipality || ""} / ${row.neighborhood || ""}`;
    const current = acc.get(zone) || { total: 0, count: 0 };
    current.total += Number(row.price || 0);
    current.count += 1;
    acc.set(zone, current);
  }
  return [...acc.entries()]
    .map(([zone, stats]) => ({
      zone,
      avg: Math.round(stats.total / Math.max(stats.count, 1)),
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

module.exports = {
  ensureMarketplaceIndexes,
  getOrCreateProfile,
  updateProfile,
  listListings,
  createListing,
  addHistory,
  listHistory,
  setFavorite,
  listFavoriteIds,
  listChats,
  addChatMessage,
  computeZoneAverages,
};
