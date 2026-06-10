/**
 * Modo Fashion — Troca de Roupa (Motor GPT).
 * Preserva rosto, corpo e pose da foto 1; aplica roupa da foto 2.
 */

const IDENTITY_LOCK = `[IDENTITY LOCK — mandatory]
Image 1 is the person reference. You MUST preserve from image 1:
- exact same face and facial identity (eyes, nose, lips, jaw, skin tone, age, ethnicity)
- exact same hairstyle and hair color
- exact same body proportions and silhouette
- exact same pose, limb positions, head angle, and expression
Image 2 is the garment/outfit reference only — copy cut, fabric, color, patterns and details onto the person.
Output ONE photorealistic fashion photo of the same person wearing the outfit. No collage, diptych, split screen, or side-by-side panels.`;

const PROMPTS = [
  {
    id: "studio_soft",
    prompt: `${IDENTITY_LOCK}

Style: premium fashion editorial in a soft neutral studio. Diffused key light, subtle rim light, clean background, magazine cover quality, sharp fabric texture, natural skin.`,
  },
  {
    id: "street_golden",
    prompt: `${IDENTITY_LOCK}

Style: urban fashion editorial at golden hour. Warm cinematic light, shallow depth of field, tasteful city bokeh background, high-end lookbook photography, realistic fabric drape.`,
  },
];

function pickRandomFashionPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

module.exports = {
  pickRandomFashionPrompt,
  PROMPTS,
};
