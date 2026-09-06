# Regressão local / smoke pós-publish (Sprint A + B P0)

Correr **depois** de merge em `Site_Angola` + deploy. Não substitui validação de produção.

## Automático (já verde localmente em `400b473e`)
```bash
cd apps/web && npm test -- --run && npx tsc --noEmit
```
Esperado: 131 testes; tsc sem erros.

## Smoke Sprint A (produção / staging com build real)
1. Landing: aviso Beta no topbar; hero copy Beta; sem texto “demo” público indevido
2. Docs públicos: CTA → sign-in → caminho para feedback Beta
3. App home autenticado: welcome Beta
4. Inventário: rascunho/não publicado ≠ mercado público (copy)
5. Headers: CSP/security headers presentes (security-headers + middleware/next/render)

## Smoke Sprint B (Inbox → beta_feedback → KOCC)
Pré-condição: migrations `0035` (+ guards `0042`) no Supabase remoto; utilizador com `finance.manage` **ou** `admin.panel` para ler inbox.

1. `/app/ajuda`: submeter **sugestão** → sucesso UI
2. Submeter **bug** → sucesso UI
3. KOCC / Founder tab KOCC: contadores `feedbackReceived` / `bugsReported` sobem (exige `finance.manage` para RPC métricas)
4. Inbox: linhas recentes aparecem com kind/status legíveis
5. **Regressão do bug SoftListSlot:** com conta que falhe métricas mas possa SELECT (ex.: só `admin.panel`), a inbox **ainda** deve listar; se métricas e SELECT falharem, UI de inbox não deve esconder-se atrás do empty-state de métricas

## Gap RBAC (não é falha de código até decisão Founder)
Founder sem `finance.manage`/`admin.panel`: métricas e/ou inbox podem falhar enquanto `canManage` UI abre. Ver `docs/engineering/proposals/0043_beta_feedback_founder_read_access.sql` — **não aplicar** sem aprovação.

## Fora de âmbito deste smoke
Widget in-page, screenshots, workflow de tickets, Sprint C/D.
