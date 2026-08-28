# Sprint Beta 1.5 — Preparação para Utilizadores Reais

| Campo             | Valor                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| **Versão**        | 1.0                                                                       |
| **Data**          | 2026-08-08                                                                |
| **Natureza**      | Sprint intercalar de qualidade (sem funcionalidades de produto novas)     |
| **Pré-requisito** | Sprint Beta 1 encerrada; arquitectura concluída; Operação Beta activa     |
| **Fontes**        | Missão PO 2026-08-08 · [SPRINT_BETA_CHARTER.md](./SPRINT_BETA_CHARTER.md) |

> **Nota de nomenclatura:** a entrega Chat + Trust Card permanece documentada em
> [SPRINT_BETA_1_5.md](./SPRINT_BETA_1_5.md) (fase 1.5A). Este documento cobre a
> **fase 1.5B — Preparação**, exigida pelo PO antes da Sprint Beta 2.

## 1. Objectivo de negócio

Garantir que a **primeira experiência** dos utilizadores reais seja a melhor
possível — auditoria, desempenho, conteúdo, inventário Beta vs real, onboarding
e Painel Beta no KOCC — **sem** abrir novas features de produto.

## 2. Escopo

| #   | Área                    | Entrega                                                                                  |
| --- | ----------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Auditoria i18n          | Fichas de património, badges públicos KOCC, heroes shell e hubs sem mistura PT/FR/EN/ES  |
| 2   | Auditoria UX / conteúdo | Estados Beta / Acesso antecipado / Disponível em breve coerentes; sem «Demo» no UI final |
| 3   | Inventário              | `is_demo` permanece interno; etiqueta pública «Beta»; coexistência com patrimónios reais |
| 4   | Onboarding + KAI        | Primeira acção útil por papel no dashboard (`FlowNextSteps`)                             |
| 5   | KOCC Painel Beta        | Migration `0035` + métricas em tempo real + canal feedback/bugs em `/app/ajuda`          |
| 6   | Performance             | Lazy media já em galerias; sem regressões de peso no first viewport                      |

## 3. Painel Beta (métricas)

RPC `kocc_beta_metrics()` (requer `finance.manage`):

- Utilizadores Beta (exclui `*@kuteka.local`)
- Patrimónios reais publicados + inventário Beta (admin)
- Visitas em acompanhamento (proxy: interesses activos)
- Contratos iniciados (reais)
- Feedback / bugs (`beta_feedback`)
- Funcionalidades mais / menos usadas (eventos + proxies)
- Taxa de conclusão de onboarding (papel activo)
- Taxa KIS/KYC (≥ nível 2)

UI: primeiro bloco do separador KOCC em `/app/super`.

## 4. Ops (PO)

Aplicar no Supabase remoto, por ordem (se ainda pendente):

1. `0032_kocc_operating_control.sql`
2. `0033_kuteka_chat_trust.sql`
3. `0034_kuteka_trust_reputation.sql`
4. **`0035_kocc_beta_panel.sql`** ← Painel Beta + feedback

Validar após `0032`/`0035`:

- [ ] Estados KOCC persistem e geram auditoria
- [ ] Super Admin altera etiquetas públicas sem intervenção técnica
- [ ] Painel Beta carrega números (ou mensagem clara se RPC ausente)

## 5. Critério de saída → Sprint Beta 2

- [x] i18n das fichas / badges / heroes corrigida no código
- [x] Painel Beta + formulário de feedback no código
- [x] Inventário sem palavra «Demo» no UI de utilizador
- [x] Onboarding com primeira acção por papel
- [ ] Migrations `0032`–`0035` aplicadas no remoto (PO)
- [ ] Smoke manual: mudar locale numa ficha; abrir KOCC → Painel Beta; enviar feedback

## 6. Sprint Beta 2 (autorizada após esta prep)

Convidar ~20 Parceiros, ~20 Clientes, ~5 Agentes, ~5 Prestadores; recolher
feedback estruturado; **sem** funcionalidades novas excepto correcções
encontradas pelos utilizadores Beta. O Painel Beta é a ferramenta principal
para decidir a saída da fase Beta.
