# Doc 3 — Tabela de validação (sem KUT-IDs)

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-08-28 |
| **Total itens** | 80 (§29: 15 · Beta: 40 · Growth: 25) |
| **Execução código** | **PROIBIDA** Fase 0 |

**Legenda:** 🟢 · 🟡 · 🔴 | Class A/B/C/D/E

---

## §29 — Identidade Founder/Co-Founder

| ID | Requisito | Interpretação | Estado | Existe | Falta | Dep. | Risco | Prio | Class | Acção Fase 0 |
|----|-----------|---------------|--------|--------|-------|------|-------|------|-------|--------------|
| DOC3-29.1 | Separar identidade do email | Estatuto = user_id + founders | 🟢 | founders, RBAC | Audit email checks | 0036 | Perm por email | P0 | A | ADR-027 |
| DOC3-29.2 | Só fundadores alteram dados próprios | Nenhum outro papel edita | 🟡 | Sem UI cruzada | Fluxo formal | ADR-027 | Super edita Founder | P0 | B | Spec Security Center |
| DOC3-29.3 | Founder ≠ editar Co-Founder | Controlo individual | 🟡 | UI ok | Procedimento excepção | GOV-004 | Conflito fundadores | P1 | B | GOV pack |
| DOC3-29.4 | Sem sucessão complexa | Não CEO/Board/herança | 🟢 | Não impl. | — | — | Scope creep | P2 | E | ADR-027 |
| DOC3-29.5 | Estatuto vs papel operacional | Founder ≠ email admin | 🟡 | founders+roles | UX distinção | GOV-001 | Confusão | P1 | B | Copy doc |
| DOC3-29.6 | Continuidade conta | Email muda, user_id igual | 🟡 | Auth | Fluxo completo | 29.7 | Perda identidade | P0 | B | Spec fluxo |
| DOC3-29.7 | Processo seguro email | Security Center reauth | 🟡 | OTP parcial | Confirm old/new | 0030 | Alteração directa BD | P1 | B | ADR-027 |
| DOC3-29.8 | Protecção perda acesso | Recovery obrigatório | 🟡 | Parcial | Checklist | Auth | Bloqueio fundador | P0 | B | Checklist doc |
| DOC3-29.9 | Auditoria obrigatória | Evento imutável | 🟡 | Audit Center | Template email change | Audit | Apagar histórico | P0 | B | Spec evento |
| DOC3-29.10 | Não alterar founders | Migration ADD only | 🟢 | Tabela estável | — | — | Rebuild | P0 | A | ADR-027 |
| DOC3-29.11 | Email não chave permissões | Proibir if email=== | 🟢 | RBAC user_id | Legacy grep | RBAC | Perm quebram | P0 | A | Audit doc |
| DOC3-29.12 | Testes protecção (6) | E2E alteração/bloqueio | 🔴 | — | Suite testes | 29.7 | Regressão | P1 | C | QA playbook |
| DOC3-29.13 | Não risco plataforma | Não alterar hierarquia | 🟢 | Respeitado | — | — | RBAC regressão | P0 | A | Paragem |
| DOC3-29.14 | AGORA vs FUTURO | Infra agora; email futuro | 🟡 | Infra 🟢 | UI email | D5 | Activar cedo | P0 | D | Founder decide |
| DOC3-29.15 | Regra definitiva | Identidade ≠ email permanente | 🟡 | Parcial | ADR permanente | GOV | Drift | P1 | B | ADR-027 |

---

## Beta 1–40

| ID | Requisito | Interpretação | Estado | Existe | Falta | Dep. | Risco | Prio | Class | Acção Fase 0 |
|----|-----------|---------------|--------|--------|-------|------|-------|------|-------|--------------|
| BETA-01 | Objectivo Beta | Ecossistema + aprendizagem | 🟡 | Charter docs | Messaging i18n | — | Percepção negativa | P0 | B | Charter v2 |
| BETA-02 | Lançamento aberto | Registo/exploração; gates sensíveis | 🟡 | Auth | Mapa gates | KIS | KYC excessivo | P0 | B | Spec gates |
| BETA-03 | Beta honesta | Badge + estados serviço | 🟡 | KOCC status | UI consistente | Feature Mgmt | Confusão | P1 | B | Inventário labels |
| BETA-04 | Não DEMO enganar | Demo interno ≠ público | 🟡 | is_demo | Política D3 | Founder | Fictício confundido | P0 | D | Charter v2 |
| BETA-05 | Beta ≠ dev tudo | Estabilidade/feedback first | 🟡 | Governed | Enforcement | GOV | Scope creep | P0 | A | Protocol |
| BETA-06 | Utilizador entende Beta | Welcome modal | 🔴 | — | UX spec | i18n | Perdido | P1 | C | Spec only |
| BETA-07 | Onboarding intenção | Intenção ≠ papel | 🟡 | FlowNextSteps | Questionário | KAI | RBAC por intenção | P1 | C | Spec |
| BETA-08 | Registar ≠ publicar | Imóvel habitado ok | 🟢 | Lifecycle | Labels UX | 0037 | Ocupado no mercado | P0 | A/B | Reuse map |
| BETA-09 | Inventário vs Mercado | Dois universos | 🟡 | SQL | Terminologia | BETA-14 | Confusão | P0 | B | Glossário |
| BETA-10 | Dados procura | Avise-me sem oferta | 🟡 | availability_notify | UI | Notif | Perder procura | P1 | B | Spec |
| BETA-11 | Prestadores progressivo | Aderir antes vender | 🟡 | service_providers | % completo | Trust | Incompleto publicado | P1 | B | Spec |
| BETA-12 | Captação progressiva | Perfil X% | 🟡 | FlowNextSteps | Score UI | KAI | Abandono | P1 | C | Spec |
| BETA-13 | Feedback prioridade | Não menu escondido | 🟡 | BetaFeedbackForm | Contextual | BETA-14 | Pouco feedback | P0 | B | Charter |
| BETA-14 | Feedback contextual | Widget in-page | 🔴 | KOCC form | Widget+tipos | beta_feedback | Sem aprendizagem | P0 | C | Spec Bloco 1 |
| BETA-15 | Tipos feedback | BUG/UX/Sug/Recl/Aval | 🟡 | feedback\|bug | 5 tipos | BETA-24 | Mistura | P1 | C | Schema spec |
| BETA-16 | Contexto feedback | Metadados ricos | 🟡 | page_path | device/version | Analytics | Triagem fraca | P1 | B | Spec campos |
| BETA-17 | Screenshot | Anexo bug UI | 🔴 | — | Storage priv | Privacy | Exposição | P2 | C | Fase posterior |
| BETA-18 | Bug auto | Error ID attach | 🟡 | Parcial | Sanitize auto | Logging | Secrets leak | P1 | B | Spec |
| BETA-19 | Feedback KOCC | Dashboard triagem | 🟡 | 0035 counts | Panel completo | KOCC | Founder cego | P1 | B | Spec |
| BETA-20 | Agrupamento KAI | Agrupa; mantém originais | 🔴 | Rules only | Job agrupamento | KAI | Perder nuance | P2 | C | E até volume |
| BETA-21 | KAI não decide | Advisory only | 🟢 | Sim | — | GOV | Auto-moderação | P0 | A | Doc |
| BETA-22 | Ciclo estados | NOVO→FECHADO | 🔴 | — | Workflow | BETA-19 | Feedback morto | P1 | C | Spec |
| BETA-23 | Feedback ao user | Ack + resolução | 🔴 | — | Notificações | BETA-22 | Desmotiva | P2 | C | Fase 2 |
| BETA-24 | Reclamação ≠ feedback | Router operacional | 🟡 | Escalations | Matriz routing | INC | Ignorada | P1 | B | GOV spec |
| BETA-25 | Avaliações ligadas | Pós interacção real | 🟡 | Reviews | Gates | Trust | Fake reviews | P1 | B | LEG-033 |
| BETA-26 | Métricas Beta | Aquisição/activação/qualidade | 🟡 | 0035 | Pacote §26 | Analytics | Vanity | P1 | B | Scorecard |
| BETA-27 | Funil Beta | Visual Founder | 🔴 | — | Dashboard | BETA-26 | Sem dados | P1 | C | Bloco 2 spec |
| BETA-28 | Uso dados | Insights abandono/zonas | 🔴 | Dados raw | Learning panel | BETA-31 | Sem acção | P1 | C | Bloco 2 |
| BETA-29 | Não vigilância | Minimização | 🟡 | RLS | POL-002 | LEG | Over-collect | P1 | B | Privacy checklist |
| BETA-30 | Privacidade feedback | Isolamento por papel | 🟡 | RLS | Testes | RLS | Acesso indevido | P1 | B | QA playbook |
| BETA-31 | Painel aprendizagem | Maior problema hoje | 🔴 | — | KOCC learning | BETA-19 | Product blind | P1 | C | Bloco 2 |
| BETA-32 | Regra dev pós-Beta | Dados+feedback first | 🟡 | Fase 0 | Charter | GOV | Idea-driven | P1 | A | Protocol |
| BETA-33 | Sucesso Beta | Real users+dados+feedback | 🟡 | Parcial | Scorecard | BETA-26 | Vanity | P1 | B | Scorecard |
| BETA-34 | Não só quantidade | Retenção/activação | 🟡 | Parcial | Cohorts | Analytics | 10k vazios | P1 | B | Scorecard |
| BETA-35 | Critério v1.1 | TOP 10 listas | 🔴 | — | Template exit | BETA-28 | v1.1 cedo | P2 | C | Template |
| BETA-36 | Reutilizar arquitectura | KIS/KAI/KOCC/… | 🟢 | Módulos | — | — | Duplicação | P0 | A | Reuse map |
| BETA-37 | Execução obrigatória | Testes E2E | 🔴 | Ad hoc | Playbook | BETA-39 | Regressão | P1 | C | QA playbook |
| BETA-38 | Sprints Beta | Ondas priorizadas | 🟡 | SPRINT docs | Plano ondas | Roadmap | Desordem | P1 | A | Roadmap doc |
| BETA-39 | Testes obrigatórios | 8 cenários Doc 3 | 🔴 | Manual | Suite | QA | Bugs prod | P1 | C | QA playbook |
| BETA-40 | Critério final ciclo | Loop aprendizagem fechado | 🔴 | Incompleto | BETA-14–23 | Epic | Falso sucesso | P0 | C | Bloco 1 epic spec |

---

## Growth Engine 1–25

| ID | Requisito | Interpretação | Estado | Existe | Falta | Dep. | Risco | Prio | Class | Acção Fase 0 |
|----|-----------|---------------|--------|--------|-------|------|-------|------|-------|--------------|
| GROWTH-01 | Filosofia | Crescimento ético | 🟡 | — | Princípios GOV | GOV | Manipulação | P2 | B | Growth paper |
| GROWTH-02 | Objectivo | Loop mensurável | 🟡 | Share 🟢 | Loop end-to-end | Analytics | Não medido | P1 | C | Paper |
| GROWTH-03 | Growth Loop | Valor→Retenção | 🔴 | — | Event model | Feature Mgmt | Infra paralela | P1 | C | Paper N1 |
| GROWTH-04 | Não recompensar tudo | Elegibilidade configurável | 🔴 | — | Rules | Campaign | Contas fantasma | P0 | C | Paper |
| GROWTH-05 | Sistema recompensas | Pontos/benefícios config | 🔴 | Campaign stub | Architecture | D4 | Confusão Pay | P1 | D | Paper only |
| GROWTH-06 | Referral | Partilha + attribution | 🟡 | PropertySocial | Deep links | Auth | Não rastreado | P1 | C | Paper N2 |
| GROWTH-07 | Recompensa bilateral | Convidador+convidado | 🔴 | — | Campaign rules | Legal | Abuso | P2 | E | Paper |
| GROWTH-08 | Prestadores motor | Campanhas patrocinadas | 🟡 | Marketplace | Campaign UI | LEG-041 | Descontrolado | P2 | E | Paper |
| GROWTH-09 | Pub participativa | Tipos campanha | 🔴 | — | Model | Analytics | Banner-only | P2 | E | Paper |
| GROWTH-10 | Exemplo catering | Template campanha | 🔴 | — | — | GROWTH-08 | Scope | P3 | E | Backlog |
| GROWTH-11 | Exemplo imóveis | Funil partilha | 🟡 | Share | Events | Analytics | Sem métricas | P1 | B | Paper |
| GROWTH-12 | Metas colectivas | Desafio X/Y | 🔴 | — | Engine | Legal | Métricas fake | P3 | E | Paper |
| GROWTH-13 | Não manipulativo | Transparência; legal sorteios | 🟡 | — | Checklist | CMP | Regulatório | P0 | D | Paper |
| GROWTH-14 | Anti-fraude | Duplicados/bots | 🟡 | Trust | Growth rules | KAI | Exploração | P0 | C | Paper |
| GROWTH-15 | Orçamento campanhas | Budget auto-pause | 🔴 | — | Engine | Finance | Overspend | P2 | E | Paper |
| GROWTH-15.1 | Pontos ≠ dinheiro | Ledgers separados | 🔴 | Finance 🟢 | Points ledger | FIN | Confusão | P0 | D | Paper §3 |
| GROWTH-16 | KAI Growth | Recomenda ACTIVAR/PAUSAR | 🔴 | Rules | Module | KAI | Auto-activação | P2 | E | Paper |
| GROWTH-17 | Founder Growth Overview | CAC/ROI dashboard | 🔴 | — | Tab read-only | Feature Mgmt | Cego | P1 | C | Paper |
| GROWTH-18 | Activation Readiness | Checklist por mecanismo | 🔴 | Flags 🟡 | Matrix UI | GROWTH-19 | Activar cedo | P1 | C | Paper §8 |
| GROWTH-19 | Feature Management | Flags growth auditadas | 🟢 | KOCC 0032 | Growth flags | — | Sistema 2 | P1 | A | Reuse |
| GROWTH-20 | Analytics campanha | Funil por campanha | 🔴 | Stub | Events | Analytics | ROI ? | P1 | C | Paper N1 |
| GROWTH-21 | Não fábrica prémios | Framework decisão | 🟡 | — | Checklist | GOV | Distribuição | P1 | B | Paper |
| GROWTH-22 | Níveis maturidade | N1–N5 progressivo | 🟡 | Share N2 | Roadmap | D4 | Lançar tudo | P0 | D | Paper §2 |
| GROWTH-23 | Aprendizagem campanhas | Hipótese→dados | 🔴 | — | Experiment log | BETA-28 | Sem learn | P2 | C | Paper |
| GROWTH-24 | Objectivo final | Crescimento orgânico | 🔴 | — | Infra | All | Paid forever | P2 | E | Visão |
| GROWTH-25 | Regras implementação | Auditar antes codar | 🟢 | Fase 0 | — | Protocol | Codar directo | P0 | A | Paragem |

---

## Referências

- [ADR-027](../../architecture/ADR-027-founder-institutional-identity.md)
- [Beta Charter v2](../beta/KUTEKA_BETA_CHARTER_v2.md)
- [Growth Paper](../growth/KUTEKA_GROWTH_ARCHITECTURE_PAPER_v0.1.md)
