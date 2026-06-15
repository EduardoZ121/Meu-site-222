/**
 * Motion flyer providers — Seedance 2.0 @ 10s.
 */

const PROVIDERS = {
  seedance_2: {
    id: "seedance_2",
    label: "Seedance 2.0",
    replicateModel: "bytedance/seedance-2.0",
    maxReferenceImages: 1,
    maxDuration: 15,
    supportedDurations: [10],
    defaultAspect: "9:16",
    defaultResolution: "720p",
    generateAudio: true,
  },
};

const DEFAULT_PROVIDER_ID = String(process.env.MOTION_FLYER_PROVIDER || "seedance_2").trim() || "seedance_2";

function getMotionFlyerProvider(providerId) {
  const id = String(providerId || DEFAULT_PROVIDER_ID).trim();
  return PROVIDERS[id] || PROVIDERS.seedance_2;
}

function listMotionFlyerProviders() {
  return Object.values(PROVIDERS);
}

module.exports = {
  PROVIDERS,
  DEFAULT_PROVIDER_ID,
  getMotionFlyerProvider,
  listMotionFlyerProviders,
};
