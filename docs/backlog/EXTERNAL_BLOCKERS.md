# Bloqueios externos — actualizado 2026-07-31 (noite)

| ID  | Bloqueio        | Estado                                                             |
| --- | --------------- | ------------------------------------------------------------------ |
| E3  | Domínio público | ✅ `kutekalink.com` serve KEOS                                     |
| E4  | Deploy Actions  | ✅ Verde                                                           |
| E2  | Supabase remoto | ✅ Projecto `vhqwitbrpqaiutjbundo` · migrations `0001–0003` · seed |
| E1  | PAT `workflow`  | 🟡 Opcional                                                        |

## Supabase (activo)

- URL: `https://vhqwitbrpqaiutjbundo.supabase.co`
- Auth Site URL: `https://kutekalink.com`
- Runtime: `/kuteka-config.js` (anon key pública)
- Secrets GitHub: `NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY`

## Validação

1. Abrir https://kutekalink.com/auth/registar — banner “config em falta” deve desaparecer ✅
2. Criar conta com email real (confirmação Supabase) ✅ (QA PO)
3. Completar onboarding → `/app` ✅ (QA Review 001–002)

PRD-001 encerrado: `docs/backlog/PRD_001_CLOSURE.md`.
