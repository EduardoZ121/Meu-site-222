import { characterHasReference } from "./mangaCharacterRef";
import { editorSceneToPanelPatch } from "./mangaEditorSync";

const SYNC_KEYS = [
  "characterId",
  "partnerCharacterId",
  "scenarioId",
  "poseId",
  "expression",
  "angle",
  "shot",
  "lighting",
  "focus",
  "framing",
  "balloonText",
  "balloonType",
  "balloonPos",
  "letterStyle",
];

function norm(v) {
  if (v === undefined || v === null || v === "") return null;
  return v;
}

/** Editor tem alterações ainda não aplicadas ao painel ativo. */
export function isEditorDirty(panel, editorScene) {
  if (!panel || !editorScene) return false;
  const patch = editorSceneToPanelPatch(editorScene);
  const duo = Boolean(editorScene.duoMode && editorScene.partnerCharacterId);
  if (Boolean(panel.partnerCharacterId) !== duo) return true;
  return SYNC_KEYS.some((k) => norm(patch[k]) !== norm(panel[k]));
}

export function validatePanelGenerate({ panel, editorScene, project, t }) {
  const issues = [];
  if (!panel) issues.push({ id: "panel", text: t("manga_ready_no_panel") });

  const char = (project.characters || []).find((c) => c.id === editorScene?.characterId);
  if (!editorScene?.characterId) {
    issues.push({ id: "char", text: t("manga_ready_no_char") });
  } else if (!characterHasReference(char)) {
    issues.push({ id: "ref", text: t("manga_ready_no_ref") });
  }

  if (editorScene?.duoMode) {
    const partner = (project.characters || []).find(
      (c) => c.id === editorScene.partnerCharacterId,
    );
    if (!partner) issues.push({ id: "partner", text: t("manga_ix_need_two") });
    else if (!characterHasReference(partner)) {
      issues.push({ id: "partner_ref", text: t("manga_ready_partner_ref") });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings: isEditorDirty(panel, editorScene)
      ? [{ id: "dirty", text: t("manga_ready_dirty") }]
      : [],
  };
}
