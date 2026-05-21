/**
 * Scene lighting inheritance and background seed derivation.
 */

function simpleHash(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function deriveBackgroundSeed(sceneId, panelAngle = "front") {
  const base = simpleHash(sceneId || "default");
  const angleBump = { front: 0, three_quarter: 3, profile: 7, back: 11, top: 5, from_below: 9 }[
    panelAngle
  ] ?? 2;
  return base + angleBump;
}

export function resolvePanelLighting(panel, scenario) {
  if (panel?.inheritSceneLighting !== false && scenario) {
    return {
      timeOfDay: panel.timeOfDayOverride || scenario.timeOfDay || "afternoon",
      weather: panel.weatherOverride || scenario.weather || "clear",
      direction: scenario.lightingDirection ?? 135,
      intensity: scenario.lightingIntensity ?? 0.65,
      colorTemp: scenario.lightingColorTemp || "warm",
      location: scenario.location || scenario.name || "",
      inherited: true,
    };
  }
  const lightMap = {
    day: { timeOfDay: "noon", colorTemp: "neutral" },
    night: { timeOfDay: "night", colorTemp: "cool" },
    interior: { timeOfDay: "afternoon", colorTemp: "neutral" },
    sunset: { timeOfDay: "sunset", colorTemp: "warm" },
  };
  const mapped = lightMap[panel?.lighting] || {};
  return {
    timeOfDay: panel?.timeOfDayOverride || mapped.timeOfDay || "afternoon",
    weather: panel?.weatherOverride || "clear",
    direction: panel?.lightingDirection ?? 120,
    intensity: panel?.lightingIntensity ?? 0.72,
    colorTemp: panel?.lightingColorTemp || mapped.colorTemp || "neutral",
    location: scenario?.name || "",
    inherited: false,
  };
}

export function lightingPromptPhrase(lighting) {
  return [
    `time: ${lighting.timeOfDay}`,
    `weather: ${lighting.weather}`,
    `key light from ${lighting.direction}°`,
    `intensity ${Number(lighting.intensity).toFixed(2)}`,
    `${lighting.colorTemp} color temperature`,
    lighting.location ? `location ${lighting.location}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}
