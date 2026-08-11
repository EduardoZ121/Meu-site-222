# Marketing Video IA — módulo backend

## Adicionar prompts ocultos

Edita `marketingVideoPrompts.cjs` → `PROMPTS_BY_CATEGORY`:

```javascript
fashion: [
  {
    id: "fashion_hero_pan_01",
    durations: [4, 6, 10, 15],
    weight: 10,
    storyboard: "Slow hero pan around outfit, studio light…",
    prompt: "Full Seedance prompt with [Image1]…",
  },
],
```

## Ajustar preços (créditos)

1. `frontend/src/config/pricing.json` → `costs.marketingVideoByDuration`
2. Ou env `MARKETING_VIDEO_PRICING='{"4":72,"6":95,"10":145,"15":195}'`

## Trocar modelo

1. `marketingVideoModels.cjs` → novo provider em `PROVIDERS`
2. Env `MARKETING_VIDEO_PROVIDER=seedance_2`
3. Implementa builder em ficheiro dedicado (ex.: `marketingVideoSeedance.cjs`) e aponta no pipeline

## Rotas

- `GET /api/marketing-video/config` (admin)
- `GET /api/marketing-video/history` (admin)
- `POST /api/generate/marketing-video` (admin)
