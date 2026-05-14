# 02 — Ferramentas · Tool Card Images

## Goal

Generate **12 landscape preview images**, one for each tool in `tools.json`.
Each image goes on the corresponding card in the Tools page.

## Quick start

1. Open `tools.json`. The `tools` array has 12 entries.
2. For each entry, read the `visual_brief` field — it tells you exactly what
   the image should show.
3. Save as `images/{filename}` (e.g. `images/studio.jpg`).

## Specs

| Property      | Value                                       |
|---------------|---------------------------------------------|
| Aspect ratio  | **16:10 landscape** (same as Pollo.ai cards)|
| Size          | 800×500 px (or 1280×800 for high-DPI)        |
| Format        | JPEG, quality ~85                            |
| File naming   | `{tools[*].filename}` — already set          |

## Kimi prompt template (copy/paste)

```
Generate a 16:10 landscape image (800x500) for the Remake Pixel tool card.
Brand constraints:
  - Background: deep matte black (#0B0B0C)
  - Accent: purple neon (#7C3AED) — use as edge lighting or atmospheric glow
  - No text, no UI overlays, no logos
  - Editorial / cinematic / premium feel — think Apple product page meets Vogue

VISUAL BRIEF (this is the description of the IMAGE to render):
  {visual_brief}

TOOL CONTEXT (for understanding only — do not show this text in the image):
  Tool name: {name_pt}
  What it does: {description}

Output: a single JPEG, 800x500 px, no watermark, ready as a card preview
inside a 2-column grid of tools.
```

## Where the images plug in

Once you fill `images/`, I will swap the pure-CSS `ToolThumb` component
for an `<img>` tag pointing to the new asset. Example:

```jsx
// /app/frontend/src/components/ToolThumb.jsx
export default function ToolThumb({ id, name }) {
  return (
    <img
      src={`/images/tools/${id}.jpg`}
      alt={name}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
}
```

(The agent will handle this after you return the zip.)

## Important constraints

- **No tool icons** in the image itself — the card already has a separate
  icon if needed (Lucide React).
- **Consistent style** across all 12 — they sit next to each other on the
  same page, so the overall mood must feel unified.
- **Differentiated content** — each tool must be visually distinct so users
  can tell them apart at a glance.
