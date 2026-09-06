# GOV — ciclo de estados / resolução Beta (isolado)

**Não implementar sem decisão Founder.**

## Facto técnico
`public.beta_feedback` (0035) só tem captura + leitura:
- colunas: id, kind, body, page_path, actor_id, metadata, created_at
- UPDATE/DELETE revogados a `authenticated`
- sem status, assignee, prioridade, resolved_at, resolution_note
- `kocc_flag_audit` cobre flags KOCC, **não** linhas de feedback

## Implicação
O ciclo «classificação → triagem → estado → auditoria → resolução» **não cabe** no schema actual sem extensão deliberada.

## O que já cobre P0 sem GOV
- Classificação leve: `kind` feedback|bug + filtro UI
- Triagem visual: inbox KOCC cronológica
- Contexto mínimo: `page_path` (+ sanitize cliente; proposta 0044 truncate servidor)

## Opções para decisão Founder (mais tarde)
1. **Manter P0** — inbox read-only; resolução fora da app (manual)
2. **Estender schema** — status + UPDATE policy restrita + audit dedicado (produto de ops)
3. **Usar `metadata` via service_role/RPC definer** — menos colunas, mesma decisão de autoridade

Agente: **não escolhe** 2/3 autonomamente.
