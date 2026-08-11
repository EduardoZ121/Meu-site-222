# Remake Pixel — PRD

## Original problem statement (last session)
Bug em produção: rota /generate/easy (secção "Personalizar") rebentava com
"Erro ao gerar: applyGenerationSurcharges is not defined".

## Architecture
- Frontend: React (CRA + craco) em /frontend, deploy Vercel para remakepix.com
- API produção: Vercel serverless em /frontend/api/[...path].js
- API preview (Emergent): FastAPI Python em /backend/server.py (rota Python-side
  DIFERENTE, sem applyGenerationSurcharges — por isso o bug não reproduzia em
  preview, só em produção)

## Fix aplicado (2026-01)
- /app/frontend/api/[...path].js linha ~118-127: adicionado
  `applyGenerationSurcharges` ao destructure do require de
  `./lib/creditPricing.cjs`. A função estava a ser chamada em 4 handlers
  (/generate/image, /generate/edit, /generate/easy, /generate/pro) mas sem
  binding no scope do módulo → ReferenceError → devolvido ao cliente como
  detail em produção.
- Verificação estática: node --check OK.
- Verificação de bindings: audit global confirma que nenhum outro ficheiro
  chama applyGenerationSurcharges ou getSurcharges sem import.
- testing_agent iteration_2: 7/7 testes passaram, sem issues críticos.

## Known gaps / Backlog
- P2: /app/frontend/api/[...path].js tem 4.428 linhas — refactoring em
  módulos por rota reduziria risco de regressões deste tipo no futuro
  (nota do próprio testing_agent).
- P3: Sessão anterior deixou features "background generation" e "premium UI"
  implementadas — ver commits anteriores no repo.
