# C2 — KUT-FIN-005: Duas vias de comissão (documentado, não unificado)

| Campo | Valor |
|-------|-------|
| **ID** | C2 · **KUT-FIN-005** |
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **Estado** | Documentado — **sem alteração SQL/RPC/UI** |
| **Regra de negócio** | Comissão de activação **35%** controlada **exclusivamente pelo Founder/Owner** |

## Regra permanente (negócio)

1. A comissão de activação de intermediação (1.º mês de arrendamento) default **35%** aplica-se quando a Kuteka apenas intermedia (sem obras).
2. Alteração deste parâmetro é **privilégio Founder/Owner** — não Super Admin genérico, não Prestador, não Agente.
3. **Sem retroactividade** sobre contratos já fechados.
4. Política formal: [KUT-POL-005](../compliance/KUT-POL_CMP_BCP_DRP_INC_PACK_v0.1.md#kut-pol-005--política-de-comissões).

## Via A — `platform_commission_params` + `founder_set_commission_param`

| Aspecto | Detalhe |
|---------|---------|
| **Tabela** | `public.platform_commission_params` |
| **RPC** | `public.founder_set_commission_param(p_code, p_value_numeric, p_notes)` |
| **Migration** | `supabase/migrations/0036_trust_governance_gate.sql` (override em `0037`) |
| **Seed default** | `activation_intermediation_first_month_pct = 35.0000` (percent) |
| **Autorização** | `is_platform_owner()` OR `is_founder()` |
| **UI plataforma** | **Nenhuma** — acesso via RPC/SQL apenas |
| **Auditoria** | `updated_at`, `updated_by` na tabela |
| **Modelo** | Parâmetros versionáveis por `code` (chave-valor) |

### Quando usar (intenção documental)

Parâmetros estratégicos de plataforma definidos pelo Founder/Owner, especialmente comissão de activação 35%.

## Via B — `finance_commission_rules` + `finance_set_commission`

| Aspecto | Detalhe |
|---------|---------|
| **Tabela** | `public.finance_commission_rules` |
| **RPC** | `public.finance_set_commission(...)` |
| **Migration** | `supabase/migrations/0021_finance_infra_fase_a.sql` |
| **UI** | Super Command → painel financeiro / `PricingPanel` |
| **Autorização** | Permissões finance Super (`finance.*`) |
| **Modelo** | Regras por produto/serviço/canal com percentuais, flags, vigência |

### Quando usar (intenção documental)

Regras comerciais operacionais geridas pelo Super Admin no cockpit financeiro (marketplace, serviços, take rates).

## Risco documentado — divergência

As duas vias **podem produzir valores diferentes** se não forem alinhadas manualmente. Exemplo: 35% em `platform_commission_params` vs regra distinta em `finance_commission_rules`.

| Risco | Severidade | Mitigação Fase 0 |
|-------|------------|------------------|
| Super altera comissão sem alinhar Founder param | Alta | Documentar; decisão D1 pendente |
| Founder altera param sem refletir regras Super | Alta | Checklist reconciliação manual |
| Utilizador vê preço inconsistente | Média | Sandbox only até unificação |

## Decisão Founder pendente (D1)

**Fonte única de verdade** para comissão de activação 35%:

- [ ] Via A — `platform_commission_params` (Founder-only)
- [ ] Via B — `finance_commission_rules` (Super UI)
- [ ] Híbrido documentado (A = default estratégico; B = derivação operacional)
- [ ] Manter dual até data X

**Unificação de código:** tarefa **posterior**, bloqueada até D1 resolvido.

## Sequência recomendada pós-D1

1. Founder declara fonte única
2. `AUTORIZO: FASE X — unificação comissão`
3. Migration compatível (sem apagar histórico)
4. UI única Founder ou Super conforme RACI FIN-003
5. Testes + auditoria

## Referências código (somente leitura — Fase 0)

- `supabase/migrations/0036_trust_governance_gate.sql` — linhas ~400–469
- `supabase/migrations/0021_finance_infra_fase_a.sql` — `finance_set_commission`
- `docs/finance/ARQUITETURA_FINANCEIRA_KUTEKA.md` — v1.0 (pré-governança)
