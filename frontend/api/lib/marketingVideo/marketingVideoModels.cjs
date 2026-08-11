/**
 * Marketing video providers — swappable model registry.
 * Default: Seedance 2.0 (Replicate). Add entries here to plug new providers.
 */

const PROVIDERS = {
  seedance_2: {
    id: "seedance_2",
    label: "Seedance 2.0",
    replicateModel: "bytedance/seedance-2.0",
    maxReferenceImages: 5,
    maxDuration: 15,
    supportedDurations: [15],
    defaultAspect: "9:16",
    defaultResolution: "720p",
    generateAudio: false,
  },
};

const DEFAULT_PROVIDER_ID = String(process.env.MARKETING_VIDEO_PROVIDER || "seedance_2").trim() || "seedance_2";

function getMarketingVideoProvider(providerId) {
  const id = String(providerId || DEFAULT_PROVIDER_ID).trim();
  return PROVIDERS[id] || PROVIDERS.seedance_2;
}

function listMarketingVideoProviders() {
  return Object.values(PROVIDERS);
}

module.exports = {
  PROVIDERS,
  DEFAULT_PROVIDER_ID,
  getMarketingVideoProvider,
  listMarketingVideoProviders,
};
