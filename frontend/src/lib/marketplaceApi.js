import { api } from "./api";

export async function getMarketplaceProfile() {
  const { data } = await api.get("/marketplace/profile");
  return data?.profile;
}

export async function updateMarketplaceProfile(payload) {
  const { data } = await api.put("/marketplace/profile", payload);
  return data?.profile;
}

export async function getMarketplaceListings(filters = {}) {
  const { data } = await api.get("/marketplace/listings", { params: filters });
  return data?.listings || [];
}

export async function createMarketplaceListing(payload) {
  const { data } = await api.post("/marketplace/listings", payload);
  return data?.listing;
}

export async function getMarketplaceFavorites() {
  const { data } = await api.get("/marketplace/favorites");
  return data?.favorites || [];
}

export async function setMarketplaceFavorite(listingId, isFavorite) {
  const { data } = await api.put("/marketplace/favorites", {
    listing_id: listingId,
    is_favorite: Boolean(isFavorite),
  });
  return data?.favorites || [];
}

export async function addMarketplaceHistory(listingId) {
  await api.post("/marketplace/history", { listing_id: listingId });
}

export async function getMarketplaceHistory() {
  const { data } = await api.get("/marketplace/history");
  return data?.items || [];
}

export async function getMarketplaceChats(listingId) {
  const { data } = await api.get("/marketplace/chats", { params: { listing_id: listingId } });
  return data?.messages || [];
}

export async function sendMarketplaceChat(listingId, text, senderName) {
  const { data } = await api.post("/marketplace/chats", {
    listing_id: listingId,
    text,
    sender_name: senderName,
  });
  return data?.message;
}

export async function getMarketplaceZoneStats() {
  const { data } = await api.get("/marketplace/stats");
  return data?.zones || [];
}
