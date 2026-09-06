# Acção mínima do PO/Ops — fechar Engineering Gate (P1 + P2)

**Gate:** `docs/backlog/PRD_001_ENGINEERING_GATE.md`  
**P1:** ✅ Fechado 2026-07-31 — https://github.com/EduardoZ121/Site_Angola/actions/runs/30608090273  
**P2:** ❌ Ainda bloqueante — migration `0002` no Supabase remoto

**Após P2:** o Líder Técnico implementa auth até N5 **sem nova confirmação** (autorização condicional §12).

---

## P1 — CI ✅

Já activo em `.github/workflows/ci.yml` com run verde. Nada a fazer.

---

## P2 — Migration `0002` no Supabase remoto (2–5 min) — ÚNICO BLOQUEIO RESTANTE

1. Abrir o projecto Supabase de destino (staging/prod).
2. SQL Editor → colar e executar:
   `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql`
3. (Opcional) correr `scripts/verify-p0-migration.sql` / checklist `docs/security/AUDIT_LOGS_CHECKLIST.md`.
4. Colar em Gate §8.2: Project ref, Data, Aplicado por, Checklist → P2 ✅.

**Alternativa CLI** (com `SUPABASE_ACCESS_TOKEN` + link do projecto):

```bash
supabase db push
```

**Para o agente fechar P2 sozinho:** fornecer credenciais Supabase no ambiente Cloud (`SUPABASE_ACCESS_TOKEN` / DB URL / service role) — preferir secret de ambiente, não colar no chat.

---

## Depois de P2

O Líder Técnico:

1. Marca Gate verde
2. Activa `PRD_001_IMPLEMENTATION_READINESS.md`
3. Abre `cursor/prd-001-authentication-f96b` e implementa até N5
