# Remake Pixel — PRD

## Bug (produção remakepix.com)
Rota /generate/easy (Personalizar: foto + estilo) rebentava com:
"Erro ao gerar: applyGenerationSurcharges is not defined"

## Root cause
/app/frontend/api/[...path].js chamava applyGenerationSurcharges em 4 handlers
(/generate/image, /generate/edit, /generate/easy, /generate/pro) mas o
destructure do `require("./lib/creditPricing.cjs")` só importava getSurcharges
→ ReferenceError na Vercel serverless → devolvido ao cliente como detail
→ Generate.jsx mostra "Erro ao gerar: <detail>".

## Fix (2026-08-11, re-aplicado após fresh re-import — fix anterior não
persistiu para main)
- /app/frontend/api/[...path].js linha ~118-126: adicionada linha
  `applyGenerationSurcharges,` no destructure de creditPricing.cjs.

## Verificação
- testing_agent iteration_3 → 8/8 testes passaram.
- node --check OK; require expõe applyGenerationSurcharges como function;
  audit global sem orphan calls (backend + frontend); yarn build exit 0.

## Backlog (do próprio testing_agent)
- P2: [...path].js tem 4.428 linhas — refactor por família de rotas.
- P3: warnings de eslint em MultiImageUpload.jsx e useStudioSessionBack.js.
- P3: main bundle ~957 kB gzip — considerar code-splitting.
