# GitHub Workflows

## Estado (P1 do Engineering Gate)

| Item                                 | Estado                                          |
| ------------------------------------ | ----------------------------------------------- |
| Definição CI                         | ✅ `docs/engineering/github-workflows/ci.yml`   |
| Activo em `.github/workflows/ci.yml` | ❌ Ainda não (só `deploy.yml` no remote)        |
| Scope necessário para activar        | GitHub token com **`workflow`** (+ `repo`)      |
| Gate                                 | `docs/backlog/PRD_001_ENGINEERING_GATE.md` §8.1 |

Última verificação objectiva: **2026-07-30** — Actions: Deploy Kuteka + pages-build-deployment; **sem** workflow CI de quality.

## Activar CI (P1)

```bash
./scripts/enable-github-ci.sh
git add .github/workflows/ci.yml
git commit -m "ci: enable KEOS quality workflow"
git push
```

Evidência mínima no Gate §8.1: **URL do run** · **SHA** · **data**.  
O agente Cloud **não** marca P1 ✅ sem essa evidência. Tokens só com `repo` não bastam.

## Conteúdo do CI

lint · format:check · typecheck · test · build `apps/web` · Playwright smoke

## Deploy (nota de drift)

| Ficheiro                                              | Papel                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `.github/workflows/deploy.yml` (activo)               | ≈ caminho prebuilt / legado Pages (`prebuilt/web-out` → `dist`) |
| `docs/engineering/github-workflows/deploy.yml`        | Caminho KEOS desejado (pnpm + `scripts/build-static-web.sh`)    |
| `docs/engineering/github-workflows/deploy-legacy.yml` | Referência do path legado                                       |

Sincronizar o deploy activo com o KEOS desejado também exige scope `workflow` — **opcional** e **separado** de P1 (P1 = apenas o workflow **CI** de quality).
