# Kuteka Growth Engine — Architecture Paper v0.1

| Campo | Valor |
|-------|-------|
| **Versão** | 0.1-DRAFT |
| **Data** | 2026-08-28 |
| **Tipo** | Arquitectura em papel — **sem implementação funcional** |
| **Autorização código** | Bloqueada — decisão D4 (nível Growth na Beta) |

## 1. Filosofia

Crescimento ético baseado em **comportamento legítimo** que gera valor mútuo — não "fábrica de prémios".

Loop conceptual:

```
Valor → Participação → Partilha → Recomendação → Novos utilizadores →
Activação → Utilização → Conversão → Retenção → Mais valor
```

## 2. Níveis de maturidade (GROWTH-22)

| Nível | Conteúdo | Estado alvo Beta | Código Fase 0 |
|-------|----------|------------------|---------------|
| **N1** | Instrumentação: events, analytics, audit | Preparar spec | ❌ Não |
| **N2** | Partilha: WhatsApp, copy link, attribution | Parcial 🟡 share imóvel | ❌ Não |
| **N3** | Referral: convite → registo → acção elegível | Desactivado | ❌ Não |
| **N4** | Campanhas Prestadores/Parceiros | Desactivado | ❌ Não |
| **N5** | Growth Intelligence (KAI recomenda) | Desactivado | ❌ Não |

## 3. Regra fundamental — Pontos Kuteka ≠ Dinheiro (GROWTH-15.1)

| Sistema | Domínio | Ledger |
|---------|---------|--------|
| **Kuteka Pay** | Dinheiro real, transacções, PSP | `finance_*` ledger |
| **Pontos Kuteka** | Participação, gamificação, elegibilidade | **Ledger separado futuro** |

**Proibido:**

- 1 ponto = X Kz (taxa universal)
- Converter pontos em dinheiro sem decisão Founder + validação jurídica/fiscal
- Tratar pontos como saldo Kuteka Pay

**Correcto:** "Ao atingir N pontos, elegível para benefício X da campanha Y"

## 4. Não recompensar qualquer acção (GROWTH-04)

Distinções configuráveis:

- Conta criada ≠ activado ≠ verificado ≠ envolvido ≠ acção de valor ≠ elegível campanha

## 5. Anti-fraude (GROWTH-14)

Detectar: duplicados, auto-referral, multi-conta, bots, spam partilhas.

**KAI:** detecta padrões — **não** prova fraude. Revisão humana obrigatória.

## 6. Feature Management (GROWTH-19)

Reutilizar KOCC module flags — **não** segundo sistema.

Flags futuros: `growth.referral`, `growth.rewards`, `growth.campaigns`

## 7. Founder Control (GROWTH-17)

Growth Overview (futuro Founder Center):

- Utilizadores adquiridos/activos, referral rate, CAC, retenção
- Custo recompensas, ROI, fraude detectada
- Campanhas activas/pausadas, recomendação KAI

## 8. Activation Readiness (GROWTH-18)

Por mecanismo, checklist antes de ACTIVAR:

| Dimensão | Referral | Rewards | Campanhas |
|----------|----------|---------|-----------|
| Produto | | | |
| Segurança | | | |
| Anti-fraude | | | |
| Analytics | | | |
| Compliance | D advogado | D advogado | D advogado |
| Orçamento | | | |
| **Estado** | AGUARDAR | AGUARDAR | AGUARDAR |

## 9. Analytics campanha (GROWTH-20)

Funil: Impressão → … → Receita — por campanha, custo vs valor.

## 10. Dependências jurídicas

Campanhas sorteio/prémios/dinheiro → **validação jurídica antes activação** (GROWTH-13).

## 11. Decisão Founder pendente (D4)

Activar na Beta pública até que nível? [ ] N0 [ ] N1 [ ] N2 [ ] N3+

## 12. Conflito documental

Doc 3 Growth "primeiro lançamento" vs Sprint Beta freeze — **Growth funcional bloqueado** até D4 + autorização fase.

## Referências

- [`KUTEKA_BETA_CHARTER_v2.md`](../beta/KUTEKA_BETA_CHARTER_v2.md)
- [`C2_KUT-FIN-005`](../finance/C2_KUT-FIN-005_DUAL_COMMISSION_PATHS.md) — separação financeiro
- KOCC `0032` campaigns module (beta_public)

## Histórico

| Versão | Data | Alteração |
|--------|------|-----------|
| 0.1-DRAFT | 2026-08-28 | Fase 0 paper only |
