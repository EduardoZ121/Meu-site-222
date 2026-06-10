/** Character↔character relation types and semantic prompts. */

export const CHARACTER_RELATIONS = [
  "talking_to",
  "fighting",
  "following",
  "protecting",
  "looking_at",
  "chasing",
  "attacking",
  "emotional_scene",
  "conversation",
  "confrontation",
];

const RELATION_SEMANTICS = {
  talking_to: "They are talking face-to-face; natural dialogue staging, varied eyelines, not flat portraits.",
  fighting: "Combat interaction; dynamic poses, impact framing, opposing body language.",
  following: "One character follows the other through the space; depth and motion in composition.",
  protecting: "Protective stance — one shields or guards the other; emotional weight in blocking.",
  looking_at: "Strong eyeline connection; focus on gaze and reaction between them.",
  chasing: "Pursuit — motion lines, depth, directional run poses.",
  attacking: "Aggressive confrontation; attack/defend poses, tension in camera angle.",
  emotional_scene: "Emotional beat — subtle expression, intimate or dramatic framing.",
  conversation: "Casual conversation staging; medium shot, 3/4 bodies, natural spacing.",
  confrontation: "Standoff — tense distance, dramatic angle, before action or dialogue peak.",
};

export function inferCharacterRelation(edge, sourceNode, targetNode) {
  const stored = edge?.data?.relationType;
  if (stored && CHARACTER_RELATIONS.includes(stored)) return stored;

  const text = `${edge?.data?.prompt || ""} ${edge?.data?.aiInstruction || ""}`.toLowerCase();
  const poseA = (sourceNode?.data?.pose || "").toLowerCase();
  const poseB = (targetNode?.data?.pose || "").toLowerCase();

  if (/fight|combat|punch|kick|battle|vs\b/.test(text) || poseA === "fighting" || poseB === "fighting") {
    return "fighting";
  }
  if (/chase|run|pursu/.test(text)) return "chasing";
  if (/attack|strike|swing/.test(text)) return "attacking";
  if (/protect|shield|guard|defend/.test(text)) return "protecting";
  if (/hug|kiss|cry|love|emotional/.test(text)) return "emotional_scene";
  if (/confront|standoff|stare down/.test(text)) return "confrontation";
  if (/follow|behind/.test(text)) return "following";
  if (/look|gaze|watch/.test(text)) return "looking_at";
  if (/talk|speak|dialogue|say|conversation/.test(text)) return "conversation";
  return "talking_to";
}

export function relationSemanticBlock(relationType, nameA, nameB) {
  const hint = RELATION_SEMANTICS[relationType] || RELATION_SEMANTICS.talking_to;
  return (
    `CHARACTER↔CHARACTER [${relationType}]: "${nameA}" and "${nameB}" interact in the same scene. ` +
    `${hint} Maintain distinct visual identities — no face swap, no random NPCs.`
  );
}
