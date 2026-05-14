# 01 — Estúdio · Style Thumbnails

## Goal

Generate **93 unique portrait thumbnails**, one for each style in `styles.json`.
Each thumbnail must visually represent what THAT specific style produces.

## Quick start

1. Open `styles.json`. The `styles` array has 93 entries.
2. For each entry, generate a 3:4 portrait image based on the `prompt_brief`
   field (it's the first ~280 chars of the actual bot prompt used to create
   that style).
3. Save the image as `images/{filename}` (e.g. `images/men_underwater.jpg`).

## Specs

| Property      | Value                                  |
|---------------|----------------------------------------|
| Aspect ratio  | **3:4 portrait**                       |
| Size          | 480×640 px (or 720×960 for high-DPI)   |
| Format        | JPEG, quality ~85                      |
| File naming   | `{styles[*].filename}` — already set   |

## Categories overview (so you understand the data)

| Cat       | Count | Look                                                           |
|-----------|-------|----------------------------------------------------------------|
| `men`     | 5     | Strong male portraits — cinematic, fashion, dramatic           |
| `women`   | 6     | Female portraits — editorial, glamour, soft beauty             |
| `unisex`  | 52    | Mixed group — large bucket with most premium styles            |
| `couple`  | 3     | Two-person compositions (romantic, lifestyle, minimal)         |
| `flyer`   | 6     | "We're hiring" recruitment posters with stylized typography   |
| `comic`   | 7     | Comic-book / graphic-novel aesthetic                           |
| `stories` | 3     | Narrative scene compositions                                   |
| `sensual` | 11    | Tasteful sensual portraits (NSFW-adjacent, keep editorial)     |

## Kimi prompt template (copy/paste)

```
Generate a 3:4 portrait image (480x640) that visually represents this Remake
Pixel style. Stay strictly within the brand:
  - Background: deep matte black (#0B0B0C)
  - Accent: purple neon (#7C3AED) used as ambient light or rim light
  - No text, no UI, no logos — just the photo content
  - Editorial / cinematic / Vogue mood

STYLE TO RENDER:
  Name: {name_pt}
  Category: {category}
  Prompt brief: {prompt_brief}

Output: a single JPEG, 480x640 px, no watermark, ready for use as a
thumbnail in a 3-column grid.
```

## Where the images plug in

Once you fill `images/`, the frontend code change is trivial:

```jsx
// /app/frontend/src/pages/dashboard/Generate.jsx
// REPLACE this static map with per-style URLs from public/style-thumbs/
// (the agent will do it after you return the zip).
const STYLE_THUMBS = require('./style-thumbs-manifest.json');
const thumb = STYLE_THUMBS[s.id];
```

## Important constraints

- **Faces**: vary ethnicity/age across styles so the grid doesn't look monotone.
- **Premium-marked styles** (`premium: true`): make them feel slightly more
  luxurious / cinematic so users can SEE the upgrade in the grid.
- **DO NOT** copy real celebrities or AI-generated faces that resemble specific
  public figures.
- **DO NOT** generate text overlays — the app already overlays the style name.
