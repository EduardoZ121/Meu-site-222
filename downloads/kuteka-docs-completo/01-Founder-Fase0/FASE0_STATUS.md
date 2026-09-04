# FASE 0 — STATUS (fecho 2026-09-04)

## P0 — Publicação e packs

| Item | Estado |
|------|--------|
| Versão final consolidada (docs + downloads) | **CONCLUÍDO** nesta branch ponte |
| Push `vicentemakiese/Site_Angola` | **PENDENTE** — 403 cursor[bot] sem write |
| Hash / versão oficial documentada | **CONCLUÍDO** — ver Versão Oficial |
| Checklist Founder (validação) | **REQUER DECISÃO DO FOUNDER** |
| Pack Advogado | **CONCLUÍDO** (pronto a enviar) |
| Pack Contabilista | **CONCLUÍDO** (pronto a enviar) |

## P1 — Decisões Founder

| ID | Estado |
|----|--------|
| D1, D3, D4, D5, D7 | **REQUER DECISÃO DO FOUNDER** (ficha pronta) |
| D-LEG / D-LEG-RENT | **REQUER ADVOGADO** (+ Founder) |
| D-FIN / D-FIN-RENT | **REQUER CONTABILISTA** (+ Founder) |

## P2 — Pareceres

| Item | Estado |
|------|--------|
| Pedidos ADVICE-001/002/003 + Termos + LEG-011 | **PRONTO PARA ENVIO** |

## P3 — Fecho documental

| Item | Estado |
|------|--------|
| Prep BCP/DRP promoção | **PENDENTE** (script/nota pronta; execução após publish Site_Angola) |
| Merge fork → oficial | **PENDENTE** (após write + validação Founder) |
| Arquivar branch ponte | **PENDENTE** (só após Site_Angola confirmado) |

## P4 — Bloqueado

Código, migrations, Pay real, Growth, email change, deploy, RLS/RBAC, Fase 1 — **BLOQUEADO** até `AUTORIZO: FASE 1`.

---

## Única acção técnica que o Founder precisa (P0.1)

O agente **não consegue** fazer push para `vicentemakiese/Site_Angola` (403).

**Acção mínima (1 vez):**

1. Abrir [cursor.com/dashboard](https://cursor.com/dashboard) → **Integrations** → GitHub → conectar conta **`vicentemakiese`**
2. Garantir repo **`Site_Angola`** com **Contents: Read and write**
3. Criar **New Cloud Agent** com repo **`vicentemakiese/Site_Angola`**
4. Colar:  
   `Publica Fase 0: importa docs/master-dossier + downloads/kuteka-docs-completo da branch kuteka-fase0-export-e12272f do repo EduardoZ121/Meu-site-222. Branch destino cursor/fase-0-master-dossier-f96b. Só docs. Sem deploy.`

Até lá, a versão oficial está segura em:  
`EduardoZ121/Meu-site-222` / `kuteka-fase0-export-e12272f`
