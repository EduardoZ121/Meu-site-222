# Sprint Beta Charter — Kuteka v1.0 Beta

| Campo         | Valor                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Versão**    | 1.4                                                                                                                                        |
| **Data**      | 2026-08-08                                                                                                                                 |
| **Natureza**  | Declaração de governação — encerra a fase de Arquitectura e abre a fase de Operação Beta                                                   |
| **Aplica-se** | Todo o desenvolvimento a partir desta data (produto, engenharia, jurídico, operações)                                                      |
| **Fontes**    | [KUTEKA_ROADMAP_MASTER.md](./KUTEKA_ROADMAP_MASTER.md) · [KUTEKA_OPERATING_SYSTEM.md](./KUTEKA_OPERATING_SYSTEM.md) · Missão PO 2026-08-06 |

---

## 1. Declaração oficial

**A fase de Arquitectura está encerrada.** ADRs 001–026, Core v1.0 congelado, motor financeiro transversal (Ledger, Kuteka Pay, Marketplace) e cinco serviços comerciais (D1–D5) estão entregues em produto e schema. Não se abre nova arquitectura de base sem ADR de revisão explícito.

**A partir de 2026-08-06, a Kuteka opera em fase de Operação Beta.** O trabalho deixa de ser organizado por "módulos a terminar" e passa a ser organizado por **Sprints Beta numeradas**, cada uma com objectivo de negócio e critério de saída mensurável.

## 2. Regra permanente de desenvolvimento

> **Nenhuma funcionalidade nova entra em desenvolvimento sem estar associada a uma Sprint Beta activa, com objectivo de negócio explícito e critério de sucesso mensurável.**

Aplicação prática:

- Toda a proposta de trabalho (PRD, ADR, tarefa de engenharia) deve indicar: `Sprint Beta N` + objectivo de negócio + como se mede o sucesso (número, %, checklist fechado).
- Trabalho sem Sprint Beta associada é registado no [Roadmap Master](./KUTEKA_ROADMAP_MASTER.md) como Pendente/Futuro e **não compete** com a sprint activa.
- O Líder Técnico e o PO podem recusar qualquer pedido de implementação que não cite a Sprint Beta correspondente.
- Esta regra é permanente: aplica-se também às Sprints Beta 2–5 e a qualquer sprint futura.

Registada também em [`AGENTS.md`](../../AGENTS.md) e no KOS (princípio 8).

## 3. Sequência oficial de Sprints Beta (1→5)

Sequência **aprovada pelo PO** (Missão Cursor 2026-08-06). Cada sprint fecha com critério de saída verificável antes de abrir a seguinte.

| Sprint        | Objectivo de negócio                          | Foco principal                                                                                                                                                             |
| ------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Beta 1**    | Preparação para o Beta Público                | Legal (Termos, Privacidade, Cookies); Centro de Documentação; **KOCC MVP**; Go Live Readiness; BCP/DRP v0.9; Go-Live Hardening; estratégia Beta (sem “Demo” ao utilizador) |
| **Beta 1.5A** | Confiança + Comunicação (Chat + Trust Card)   | Mensagens integradas + reputação visível — ver [SPRINT_BETA_1_5.md](./SPRINT_BETA_1_5.md)                                                                                  |
| **Beta 1.5B** | Preparação para Utilizadores Reais            | Auditoria i18n/UX/conteúdo/performance; inventário Beta vs real; onboarding; **Painel Beta KOCC** — ver [SPRINT_BETA_1_5_PREP.md](./SPRINT_BETA_1_5_PREP.md)               |
| **Beta 1.6**  | Trust Governance Gate                         | Aprovação de publicações, Founders, ficha rica, comissão configurável — **bloqueia Beta 2** — ver [SPRINT_BETA_1_6.md](./SPRINT_BETA_1_6.md)                               |
| **Beta 2**    | Lançamento do Beta Público                    | Só após saída da 1.6 Fase A; ~20 Parceiros/Clientes + Agentes/Prestadores; feedback; sem features novas excepto correcções                                                 |
| **Beta 3**    | Corrigir o que utilizadores reais encontrarem | Sem novas funcionalidades — só correcções e estabilização                                                                                                                  |
| **Beta 4**    | Preparar integrações reais                    | SMTP, SMS, WhatsApp, Multicaixa, EMIS (quando houver credenciais)                                                                                                          |
| **Beta 5**    | Primeiras receitas reais                      | Activação comercial controlada dos serviços pagos                                                                                                                          |

## 4. Sprint Beta 1 — escopo e critério de saída

### 4.1 Escopo

| Entregável                                                                                                    | Estado                                                              |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Este Charter + regra permanente (`AGENTS.md`, KOS)                                                            | ✅                                                                  |
| Termos + Privacidade (já publicados) + **Política de Cookies** + páginas `/termos` `/privacidade` `/cookies`  | ✅                                                                  |
| Centro de Documentação (`/app/ajuda`, `/documentacao`) — Manual, FAQ, Glossário, Novidades, Estado, Contactos | ✅                                                                  |
| **KOCC MVP** (`/app/super` → KOCC) — estados de módulo, flags, auditoria, papéis/país/ambiente                | ✅ (requer migration `0032` no Supabase remoto)                     |
| [GO_LIVE_READINESS.md](./GO_LIVE_READINESS.md) — Bloco Zero vivo 🟢/🟡/🔴                                     | ✅                                                                  |
| BCP v0.9 + DRP v0.9                                                                                           | ✅                                                                  |
| Utilizador final **nunca** vê “Demo” — vê Beta / Acesso antecipado / Disponível em breve                      | ✅ (rótulos públicos)                                               |
| Go-Live Hardening (revisão RBAC/KYC/Pay/fluxos/segurança — checklist no Bloco Zero)                           | 🟡 parcial (documentado; itens técnicos P0 continuam no Bloco Zero) |

### 4.2 Critério de saída (antes de convidar utilizadores reais — Sprint Beta 2)

Sprint Beta 1 dá-se por encerrada quando:

1. Documentação jurídica (Termos, Privacidade, Cookies) publicada e ligada na plataforma.
2. Centro de Documentação funcional.
3. KOCC MVP operacional (UI + migration `0032` aplicada no ambiente remoto).
4. Go Live Readiness Checklist existir e ser a referência oficial.
5. Business Continuity v0.9 e Disaster Recovery v0.9 existirem.
6. Plataforma estabilizada para Beta Público (sem “Demo” visível; módulos controláveis no KOCC).
7. PO confirma, por escrito, a passagem — **confirmação oficial recebida 2026-08-08** (Sprint Beta 1 encerrada).
8. Antes da Beta 2: concluir [Sprint Beta 1.5B — Preparação](./SPRINT_BETA_1_5_PREP.md) (auditoria + Painel Beta).

**Fora de escopo desta sprint:** novos módulos, novas ideias, funcionalidades não relacionadas com o Beta.

## 5. Cinco indicadores de progresso

Percentagens **conservadoras**. Reavaliar no fecho de cada Sprint Beta.

| Indicador                         | %       | Nota                                                                  |
| --------------------------------- | ------- | --------------------------------------------------------------------- |
| **Arquitectura do Produto**       | **92%** | Fase encerrada; revisões pontuais apenas                              |
| **Funcionalidades Implementadas** | **78%** | Módulos estruturantes existem; profundidade operacional ainda parcial |
| **Integrações Reais**             | **35%** | Supabase ligado; Multicaixa/EMIS/SMTP/SMS/WhatsApp pendentes          |
| **Operação da Empresa**           | **28%** | KOS + BCP/DRP v0.9 + KOCC; SLA/turnos reais ainda não                 |
| **Go Live Comercial**             | **48%** | Docs + Beta UX + checklist; gateways e canais bloqueiam receita real  |

## 6. Referências

| Documento                                      | Uso                                              |
| ---------------------------------------------- | ------------------------------------------------ |
| [GO_LIVE_READINESS.md](./GO_LIVE_READINESS.md) | Bloco Zero                                       |
| [docs/operations/](../operations/)             | BCP / DRP                                        |
| [docs/legal/](../legal/)                       | Termos, Privacidade, Cookies                     |
| [docs/help/](../help/)                         | Manual, FAQ, Glossário, Novidades, Estado        |
| KOCC                                           | `/app/super` → separador KOCC · migration `0032` |

---

## 7. Controlo de alterações

| Versão | Data       | Notas                                                                                                    |
| ------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| 1.0    | 2026-08-06 | Primeira edição (governação documental)                                                                  |
| 1.1    | 2026-08-06 | Alinhamento à Missão PO: sequência Beta 1–5 oficial; KOCC + Centro de Docs + Cookies no escopo da Beta 1 |
| 1.2    | 2026-08-08 | Beta 1 encerrada pelo PO; Beta 1.5A/1.5B; Painel Beta KOCC antes da Beta 2                               |
| 1.3    | 2026-08-08 | Gate Beta 1.6 (Trust Governance) bloqueia abertura da Beta 2                                             |
| 1.4    | 2026-08-08 | 1.6 completa: ciclo imóvel, social, Founder ops; regra pós–Beta 2 sem features estruturais               |

**Próxima revisão:** ao aplicar migrations `0032`–`0038`, validar gate e abrir Sprint Beta 2.
