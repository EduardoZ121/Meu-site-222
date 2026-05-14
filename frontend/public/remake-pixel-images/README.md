# Remake Pixel — Grid Images Package

## What's inside?

Two folders, one per page of the platform, each ready for **Kimi** to generate
preview images for the grids/cards.

```
remake-pixel-images/
├── 01-estudio/          → "Estúdio" page (93 style thumbnails)
│   ├── Generate.jsx      (current page source for reference)
│   ├── PhotoUpload.jsx   (component used)
│   ├── AspectPicker.jsx  (component used)
│   ├── styles.json       (★ READ THIS — 93 styles with id/name/prompt brief)
│   ├── images/           (★ PUT GENERATED IMAGES HERE — empty)
│   └── INSTRUCTIONS.md   (Kimi prompt template)
│
├── 02-ferramentas/      → "Ferramentas" page (12 tool cards)
│   ├── Tools.jsx
│   ├── ToolThumb.jsx
│   ├── toolsCatalogue.js
│   ├── tools.json        (★ READ THIS — 12 tools with visual brief)
│   ├── images/           (★ PUT GENERATED IMAGES HERE — empty)
│   └── INSTRUCTIONS.md
│
└── README.md             (this file)
```

## Brand identity (apply to ALL generated images)

| Property      | Value                                                         |
|---------------|---------------------------------------------------------------|
| Background    | Deep matte black `#0B0B0C`                                    |
| Primary accent| Purple neon `#7C3AED` (use as light source / glow)             |
| Secondary     | Lavender `#C4B5FD`, soft violet `#9333EA`                     |
| Avoid         | Bright whites, gradients to white, generic stock-photo lighting|
| Mood          | Editorial, cinematic, premium — Apple × Pollo.ai × Vogue      |
| Typography on images | None (cards already have text overlay in the app)      |

## When you're done

1. Verify every required `filename` from `styles.json` and `tools.json` is in
   the corresponding `images/` folder.
2. Re-zip the whole `remake-pixel-images/` folder.
3. Send back to me and I'll integrate them into the platform automatically.

## Total images to generate

| Folder            | Count | Aspect ratio | Size                    |
|-------------------|-------|--------------|-------------------------|
| 01-estudio        | 93    | 3:4 portrait | 480×640 px (or 720×960) |
| 02-ferramentas    | 12    | 16:10 landscape | 800×500 px (or 1280×800) |
| **Total**         |**105**|              |                         |
