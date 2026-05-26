/** Server-side manga coherence (mirrors frontend/src/lib/comic-engine/coherenceCheck.js). */

function lightingKey(panel, scene) {
  if (panel?.inheritSceneLighting !== false && scene) {
    return `${scene.timeOfDay || ""}-${scene.lightingColorTemp || ""}-${scene.lightingDirection ?? ""}`;
  }
  return `${panel?.lighting || ""}-${panel?.lightingColorTemp || ""}-${panel?.lightingDirection ?? ""}`;
}

function expressionMood(expr) {
  const map = { normal: 0, happy: 1, sad: -1, angry: -2, fear: -1, shy: 0, determined: 1, surprised: 1 };
  return map[expr] ?? 0;
}

function dialogueMood(text, type) {
  const t = String(text || "").toLowerCase();
  if (type === "shout") return 2;
  if (/triste|chor|adeus/i.test(t)) return -1;
  if (/haha|amo|feliz/i.test(t)) return 1;
  return 0;
}

function runCoherenceCheck(body) {
  const panels = [...(body.panels || [])].sort((a, b) => a.order - b.order);
  const characters = body.characters || [];
  const scenarios = body.scenarios || [];
  const warnings = [];

  panels.forEach((panel, i) => {
    const char = characters.find((c) => c.id === panel.characterId);
    const scene = scenarios.find((s) => s.id === panel.scenarioId);

    if (!panel.characterId) {
      warnings.push({
        id: `no-char-${panel.id}`,
        panelId: panel.id,
        severity: "warn",
        message: `Panel ${i + 1}: no character.`,
        fix: "Assign a character.",
      });
    }

    if (char?.consistencyLock && !char.hasRef) {
      warnings.push({
        id: `lock-no-ref-${panel.id}`,
        panelId: panel.id,
        severity: "warn",
        message: `${char.name}: consistency lock without reference.`,
        fix: "Upload a front PNG.",
      });
    }

    const dm = dialogueMood(panel.balloonText, panel.balloonType);
    const em = expressionMood(panel.expression);
    if (panel.balloonText?.trim() && Math.abs(dm - em) >= 2) {
      warnings.push({
        id: `expr-dialogue-${panel.id}`,
        panelId: panel.id,
        severity: "warn",
        message: `Panel ${i + 1}: expression vs dialogue tone mismatch.`,
        fix: "Adjust expression or dialogue.",
      });
    }

    if (i > 0) {
      const prev = panels[i - 1];
      const prevScene = scenarios.find((s) => s.id === prev.scenarioId);

      if (
        panel.characterId === prev.characterId
        && prev.screenDirection !== panel.screenDirection
        && panel.characterId
      ) {
        warnings.push({
          id: `screen-180-${panel.id}`,
          panelId: panel.id,
          severity: "error",
          message: `Panel ${i + 1}: 180° rule broken (screen direction).`,
          fix: "Keep same screen direction.",
        });
      }

      if (prev.scenarioId && panel.scenarioId && prev.scenarioId !== panel.scenarioId) {
        warnings.push({
          id: `scene-jump-${panel.id}`,
          panelId: panel.id,
          severity: "warn",
          message: `Panel ${i + 1}: location changed abruptly.`,
          fix: "Add transition panel.",
        });
      }

      const prevLight = lightingKey(prev, prevScene);
      const curLight = lightingKey(panel, scene);
      if (prevLight !== curLight && panel.inheritSceneLighting !== false) {
        warnings.push({
          id: `light-${panel.id}`,
          panelId: panel.id,
          severity: "warn",
          message: `Panel ${i + 1}: lighting inconsistent with previous.`,
          fix: "Align scene lighting.",
        });
      }
    }
  });

  const score = Math.max(
    0,
    100
      - warnings.filter((w) => w.severity === "error").length * 15
      - warnings.filter((w) => w.severity === "warn").length * 6,
  );

  return { warnings, score: Math.min(100, score) };
}

module.exports = { runCoherenceCheck };
