# Status — fecho Beta 2026-09-13T19:10Z (CF + feedback/inbox)

## 1. Cloudflare
- **Acesso:** nenhum (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID` unset; sem MCP CF; GH secrets 403; env Cursor sem CF)
- Script `apply-cloudflare-security-headers.mjs` → exit 2 SKIP (esperado)
- Edge live `kutekalink.com`: só `x-content-type-options: nosniff`
- Meta CSP / nosniff / referrer no HTML: OK (defense-in-depth)
- **Bloqueio externo exacto:** token Zone Transform Rules Edit + Zone ID (ou apply manual no dashboard) — ver `docs/security/PRODUCTION_EDGE_HEADERS.md`

## 2. Feedback → Inbox (smoke autenticado)
Executado contra prod Supabase (`vhqwitbrpqaiutjbundo`, mesmo host que `kuteka-config.js`).

| Passo | Resultado |
|-------|-----------|
| Unauth RPC submit | 400 `authentication required` |
| Signup + sessão | OK |
| Submit `bug`/`feedback` via `kocc_submit_beta_feedback` | 200; `id`, `kind`, `page_path`, `actor_id` correctos |
| Kind inválido / body curto | 400 mensagens correctas |
| SELECT como user comum | `[]` (RLS) |
| PATCH/DELETE user | 403 |
| INSERT directo REST | 403 RLS |
| Inbox admin (`admin.panel` seed) | lê linha smoke (persistência + actor/path/kind) |
| Métricas `finance.manage` (seed super) | OK; admin sem finance → `finance.manage required` |
| UI prod `/app/admin` bundle | contém AdminBetaInboxPanel / listRecentBetaFeedback |
| Unit tests `@kuteka/web` | 149/149 pass (incl. beta-feedback-*) |

**Não inventado:** sessão ops via fixtures seed `demo.*@kuteka.local` já nas migrations do SoT. Sem CF credentials.

## 3. Produção
- `/health.json` + rotas core 200 (re-validado no closeout anterior; headers edge incompletos)
- Closeout código já em `main` @ `5ae560e9` — sem novas features / sem GOV-BF / 0043–45

## A/B/C/D
- **A:** submit→DB, RLS, inbox admin, métricas finance, UI admin inbox, testes, health/rotas, meta headers
- **B:** headers HTTP edge completos (CF)
- **C:** `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` (ou dashboard Founder)
- **D:** GOV-BF / 0043 / 0044 / 0045 — não aplicados
