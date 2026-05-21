/**
 * Hardcoded coherence rules (no AI) — adjacent panels in reading order.
 * @returns {{ warnings: Array<{ id: string, severity: 'warn'|'error', message: string, fix?: string }>, score: number }}
 */

function hashDir(panel) {
  return panel?.screenDirection || "left-to-right";
}

function lightingKey(panel, scene) {
  if (panel?.inheritSceneLighting !== false && scene) {
    return `${scene.timeOfDay || ""}-${scene.lightingColorTemp || ""}-${scene.lightingDirection ?? ""}`;
  }
  return `${panel?.lighting || ""}-${panel?.lightingColorTemp || ""}-${panel?.lightingDirection ?? ""}`;
}

function expressionMood(expr) {
  const map = {
    normal: 0,
    happy: 1,
    sad: -1,
    angry: -2,
    fear: -1,
    shy: 0,
    determined: 1,
    surprised: 1,
  };
  return map[expr] ?? 0;
}

function dialogueMood(text, type) {
  const t = String(text || "").toLowerCase();
  if (type === "shout") return 2;
  if (type === "whisper") return 0;
  if (/!{2,}|grito|não|pare|idiota|raiva/i.test(t)) return -1;
  if (/triste|chor|adeus|desculpa/i.test(t)) return -1;
  if (/haha|amo|feliz|obrigad|sim!/i.test(t)) return 1;
  return 0;
}

export function runCoherenceCheck(project) {
  const panels = [...(project?.panels || [])].sort((a, b) => a.order - b.order);
  const characters = project?.characters || [];
  const scenarios = project?.scenarios || [];
  const warnings = [];

  panels.forEach((panel, i) => {
    const char = characters.find((c) => c.id === panel.characterId);
    const scene = scenarios.find((s) => s.id === panel.scenarioId);

    if (!panel.characterId) {
      warnings.push({
        id: `no-char-${panel.id}`,
        panelId: panel.id,
        severity: "warn",
        message: `Painel ${i + 1}: sem personagem definido.`,
        fix: "Escolhe um personagem na secção Personagem.",
      });
    }

    if (char?.consistencyLock && !(char.thumb || char.sheets?.front)) {
      warnings.push({
        id: `lock-no-ref-${panel.id}`,
        panelId: panel.id,
        severity: "warn",
        message: `${char.name}: trava de consistência ativa mas falta folha de referência.`,
        fix: "Faz upload de PNG frontal na Biblioteca.",
      });
    }

    const dm = dialogueMood(panel.balloonText, panel.balloonType);
    const em = expressionMood(panel.expression);
    if (panel.balloonText?.trim() && Math.abs(dm - em) >= 2) {
      warnings.push({
        id: `expr-dialogue-${panel.id}`,
        panelId: panel.id,
        severity: "warn",
        message: `Painel ${i + 1}: expressão "${panel.expression}" não combina com o tom do diálogo.`,
        fix: "Ajusta expressão ou reescreve o balão.",
      });
    }

    if (i > 0) {
      const prev = panels[i - 1];
      const prevScene = scenarios.find((s) => s.id === prev.scenarioId);
      const prevChar = characters.find((c) => c.id === prev.characterId);

      if (
        panel.characterId === prev.characterId
        && hashDir(prev) !== hashDir(panel)
        && panel.characterId
      ) {
        warnings.push({
          id: `screen-180-${panel.id}`,
          panelId: panel.id,
          severity: "error",
          message: `Painel ${i + 1}: personagem mudou de lado (regra dos 180°).`,
          fix: "Mantém a mesma screen direction que o painel anterior.",
        });
      }

      if (
        prev.scenarioId
        && panel.scenarioId
        && prev.scenarioId !== panel.scenarioId
        && prevChar?.id === char?.id
        && prev.outfitId === panel.outfitId
      ) {
        warnings.push({
          id: `scene-jump-${panel.id}`,
          panelId: panel.id,
          severity: "warn",
          message: `Painel ${i + 1}: cenário mudou sem transição narrativa.`,
          fix: "Adiciona painel de transição ou narração entre locais.",
        });
      }

      const prevLight = lightingKey(prev, prevScene);
      const curLight = lightingKey(panel, scene);
      if (prevLight !== curLight && panel.inheritSceneLighting !== false) {
        warnings.push({
          id: `light-${panel.id}`,
          panelId: panel.id,
          severity: "warn",
          message: `Painel ${i + 1}: iluminação inconsistente com o painel anterior.`,
          fix: "Ativa herança de cena ou alinha direção/intensidade da luz.",
        });
      }

      if (
        prev.characterId === panel.characterId
        && prev.outfitId
        && panel.outfitId
        && prev.outfitId !== panel.outfitId
        && !panel.narration
      ) {
        warnings.push({
          id: `outfit-${panel.id}`,
          panelId: panel.id,
          severity: "warn",
          message: `Painel ${i + 1}: roupa mudou sem indicação de tempo passado.`,
          fix: "Usa narração ou painel de transição.",
        });
      }
    }
  });

  const maxPenalty = panels.length * 3 || 1;
  const score = Math.max(
    0,
    Math.round(100 - (warnings.filter((w) => w.severity === "error").length * 15
      + warnings.filter((w) => w.severity === "warn").length * 6)),
  );

  return { warnings, score: Math.min(100, score) };
}

export async function fetchCoherenceCheck(project) {
  try {
    const { api } = await import("../api");
    const { data } = await api.post("/coherence/manga-check", {
      panels: (project?.panels || []).map((p) => ({
        id: p.id,
        order: p.order,
        characterId: p.characterId,
        scenarioId: p.scenarioId,
        expression: p.expression,
        balloonText: p.balloonText,
        balloonType: p.balloonType,
        screenDirection: p.screenDirection,
        lighting: p.lighting,
        lightingDirection: p.lightingDirection,
        lightingColorTemp: p.lightingColorTemp,
        inheritSceneLighting: p.inheritSceneLighting,
        outfitId: p.outfitId,
        narration: p.narration,
      })),
      characters: (project?.characters || []).map((c) => ({
        id: c.id,
        name: c.name,
        consistencyLock: c.consistencyLock,
        hasRef: Boolean(c.thumb || c.sheets?.front),
      })),
      scenarios: (project?.scenarios || []).map((s) => ({
        id: s.id,
        timeOfDay: s.timeOfDay,
        lightingDirection: s.lightingDirection,
        lightingColorTemp: s.lightingColorTemp,
      })),
    });
    if (data?.warnings) return data;
  } catch {
    /* local fallback */
  }
  return runCoherenceCheck(project);
}
