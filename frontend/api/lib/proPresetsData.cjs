const PRO_PRESETS = require("./proPresetsData.json");

function getProPreset(presetId) {
  return PRO_PRESETS[presetId] || PRO_PRESETS.ultra_real || null;
}

function listProPresets() {
  return Object.entries(PRO_PRESETS).map(([id, v]) => ({ id, ...v }));
}

module.exports = { PRO_PRESETS, getProPreset, listProPresets };
