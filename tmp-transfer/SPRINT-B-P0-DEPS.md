# Sprint B P0 — dependências / inventário (sem implementação nova)

Gerado durante bloqueio Git. Não inicia Sprint C.

## Já coberto localmente (código pronto, não em main)
- Canal único `/app/ajuda` → `kocc_submit_beta_feedback` → `beta_feedback`
- Inbox KOCC `listRecentBetaFeedback` + labels
- Complaint bridge (Help) vs canal produto Beta
- Telemetria: app home, help.center, submit bug/suggestion
- Harden: inbox ≠ métricas

## Dependências para “fechar” B P0 em produção
1. **Git write** Site_Angola + merge A, depois B
2. Migrations `0035`/`0042` no projecto Supabase de produção
3. Smoke autenticado (ver REGRESSION-LOCAL.md)
4. Decisão Founder sobre `0043` (RBAC Founder read) — opcional para P0 se ops tiverem `finance.manage`

## Possível resto P0 (só lista — não implementar agora)
Feature tracking em 3–5 fluxos críticos ainda sem `trackBetaFeature` (ex.: publicar património, mensagens, confiança, planos parceiro). Auditar com:
`rg trackBetaFeature apps/web`
Antes de instrumentar: confirmar que não duplica eventos já emitidos via RPC servidor.

## Explicitamente fora (P1/P2 / OPEN)
- Widget contextual in-page
- Screenshots
- Workflow ticket NOVO→FECHADO
- Novas kinds além de feedback|bug
