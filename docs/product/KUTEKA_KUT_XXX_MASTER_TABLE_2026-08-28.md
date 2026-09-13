# KUTEKA — Tabela integral KUT-XXX (validação Founder)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-08-28 |
| **Total IDs** | **65** (63 originais + FIN-009 + FIN-010) |
| **Doc 3** | Sem IDs KUT — ver [`KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md`](./KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md) |
| **Normalização FIN** | Ver [`../finance/C1_FIN_ID_NORMALIZATION_2026-08-28.md`](../finance/C1_FIN_ID_NORMALIZATION_2026-08-28.md) |
| **Execução código** | **PROIBIDA** até `AUTORIZO: FASE X` |

## Conflitos FIN — RESOLVIDOS (2026-08-28)

| ID canonical | Título | Notas |
|--------------|--------|-------|
| KUT-FIN-002 | Financial Flow Map | Doc 2 prevalece |
| KUT-FIN-003 | Payment & Financial RACI | Doc 2 prevalece |
| KUT-FIN-004 | Financial Classification Map | Doc 2 prevalece |
| KUT-FIN-007 | Reconciliation Procedure | Doc 1 (procedimento) |
| **KUT-FIN-009** | Refund Policy | **Novo** — ex-doc1 FIN-004 |
| **KUT-FIN-010** | Payment Responsibility Matrix | **Novo** — ex-doc1 FIN-002 |

---

### KUT-ADVICE-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Registo de parecer profissional — Kuteka Pay — custódia/fundos e enquadramento regulatório |
| **Interpretação** | Entendi que cada parecer (advogado/contabilista) deve ficar registado com questão, profissional, data, recomendação, condições, documentos, estado Validado/Pendente/Rejeitado e histórico — fundamento de decisões futuras. |
| **Estado actual** | 🔴 |
| **O que já existe** | Nenhuma tabela/UI de pareceres; decisões só em conversas/docs dispersos |
| **O que falta** | Entidade advice_registry + UI Founder + export PDF |
| **Dependências** | KUT-LEG-003; KUT-FIN-005; sequência pagamentos reais |
| **Riscos** | Activar Pay/comissões reais sem parecer registado |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Propor schema mínimo + UI Registo Pareceres no Founder Center — aguardar autorização |

### KUT-ADVICE-002

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Registo de parecer profissional — Tratamento contabilístico das comissões |
| **Interpretação** | Entendi que cada parecer (advogado/contabilista) deve ficar registado com questão, profissional, data, recomendação, condições, documentos, estado Validado/Pendente/Rejeitado e histórico — fundamento de decisões futuras. |
| **Estado actual** | 🔴 |
| **O que já existe** | Nenhuma tabela/UI de pareceres; decisões só em conversas/docs dispersos |
| **O que falta** | Entidade advice_registry + UI Founder + export PDF |
| **Dependências** | KUT-LEG-003; KUT-FIN-005; sequência pagamentos reais |
| **Riscos** | Activar Pay/comissões reais sem parecer registado |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Propor schema mínimo + UI Registo Pareceres no Founder Center — aguardar autorização |

### KUT-ADVICE-003

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Registo de parecer profissional — Facturação e documentos fiscais |
| **Interpretação** | Entendi que cada parecer (advogado/contabilista) deve ficar registado com questão, profissional, data, recomendação, condições, documentos, estado Validado/Pendente/Rejeitado e histórico — fundamento de decisões futuras. |
| **Estado actual** | 🔴 |
| **O que já existe** | Nenhuma tabela/UI de pareceres; decisões só em conversas/docs dispersos |
| **O que falta** | Entidade advice_registry + UI Founder + export PDF |
| **Dependências** | KUT-LEG-003; KUT-FIN-005; sequência pagamentos reais |
| **Riscos** | Activar Pay/comissões reais sem parecer registado |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Propor schema mínimo + UI Registo Pareceres no Founder Center — aguardar autorização |

### KUT-ADVICE-004

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Registo de parecer profissional — Comissão paga antecipadamente pelo cliente |
| **Interpretação** | Entendi que cada parecer (advogado/contabilista) deve ficar registado com questão, profissional, data, recomendação, condições, documentos, estado Validado/Pendente/Rejeitado e histórico — fundamento de decisões futuras. |
| **Estado actual** | 🔴 |
| **O que já existe** | Nenhuma tabela/UI de pareceres; decisões só em conversas/docs dispersos |
| **O que falta** | Entidade advice_registry + UI Founder + export PDF |
| **Dependências** | KUT-LEG-003; KUT-FIN-005; sequência pagamentos reais |
| **Riscos** | Activar Pay/comissões reais sem parecer registado |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Propor schema mínimo + UI Registo Pareceres no Founder Center — aguardar autorização |

### KUT-ADVICE-005

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Registo de parecer profissional — Incentivo comercial 0,5% ao cliente |
| **Interpretação** | Entendi que cada parecer (advogado/contabilista) deve ficar registado com questão, profissional, data, recomendação, condições, documentos, estado Validado/Pendente/Rejeitado e histórico — fundamento de decisões futuras. |
| **Estado actual** | 🔴 |
| **O que já existe** | Nenhuma tabela/UI de pareceres; decisões só em conversas/docs dispersos |
| **O que falta** | Entidade advice_registry + UI Founder + export PDF |
| **Dependências** | KUT-LEG-003; KUT-FIN-005; sequência pagamentos reais |
| **Riscos** | Activar Pay/comissões reais sem parecer registado |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Propor schema mínimo + UI Registo Pareceres no Founder Center — aguardar autorização |

### KUT-BCP-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Business Continuity Plan |
| **Interpretação** | Entendi que plano continuidade operacional Kuteka (processos, RTO, comunicação, backups). |
| **Estado actual** | 🟡 |
| **O que já existe** | `docs/operations/BUSINESS_CONTINUITY_PLAN_v0.9.md` |
| **O que falta** | KUT-BCP-001 formal; UI status Founder; testes trimestrais registados |
| **Dependências** | KUT-DRP-001; KUT-INC-001 |
| **Riscos** | Plano só papel |
| **Prioridade** | P2 |
| **Classificação** | B |
| **Acção proposta** | Promover v0.9 a KUT-BCP-001; registar testes — C UI depois |

### KUT-CMP-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Compliance Framework |
| **Interpretação** | Entendi que framework compliance: políticas, procedimentos, monitorização, alterações legislativas, responsáveis. |
| **Estado actual** | 🔴 |
| **O que já existe** | Docs dispersos; sem framework CMP-001 |
| **O que falta** | KUT-CMP-001 documento + roadmap compliance Founder Center |
| **Dependências** | KUT-POL-*; KUT-GOV-001 |
| **Riscos** | Compliance ad hoc |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir framework; ligar a registo pareceres — documentação fase 0 |

### KUT-CMP-002

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Tax Compliance Procedure |
| **Interpretação** | Entendi que procedimento cumprimento fiscal Angola (AGT): calendário, obrigações, evidências, sem scraping. |
| **Estado actual** | 🔴 |
| **O que já existe** | Comentários SAF-T export; calendário fiscal 🔴 |
| **O que falta** | CMP-002 + calendário manual + alertas (futuro) |
| **Dependências** | KUT-FIN-008; contabilista; AGT |
| **Riscos** | Scraping AGT; credenciais inseguras |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Documentar procedimento; E scraping; D validação contabilista |

### KUT-CMP-003

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Payment Compliance Framework |
| **Interpretação** | Entendi que compliance pagamentos: BNA, PSP, AML quando aplicável, Kuteka Pay. |
| **Estado actual** | 🔴 |
| **O que já existe** | Gateways stub; sem framework |
| **O que falta** | CMP-003 + KUT-LEG-003 + parecer Pay |
| **Dependências** | KUT-ADVICE-001; PSP/banco |
| **Riscos** | Operar Pay real ilegalmente |
| **Prioridade** | P0 |
| **Classificação** | D |
| **Acção proposta** | Aguardar parecer; documentar framework — E activação real |

### KUT-DOC-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Document Management Policy |
| **Interpretação** | Entendi que política gestão documental: versionamento, validação, substituição, histórico, não apagar versões. |
| **Estado actual** | 🟡 |
| **O que já existe** | Docs legais/manuais estáticos; sem versionamento formal plataforma |
| **O que falta** | KUT-DOC-001 + workflow versões (Legal Pack) |
| **Dependências** | KUT-ADVICE-*; todos POL/LEG |
| **Riscos** | Sobrescrever versão validada |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Implementar versionamento documental mínimo no dossiê — aguardar autorização |

### KUT-DRP-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Disaster Recovery Plan |
| **Interpretação** | Entendi que plano recuperação catastrofe (Supabase, domínio, email, gateway). |
| **Estado actual** | 🟡 |
| **O que já existe** | `docs/operations/DISASTER_RECOVERY_PLAN_v0.9.md` |
| **O que falta** | KUT-DRP-001 formal; simulações semestrais registadas |
| **Dependências** | KUT-BCP-001 |
| **Riscos** | Sem testes DR |
| **Prioridade** | P2 |
| **Classificação** | B |
| **Acção proposta** | Formalizar DRP; agendar simulação — documentar resultados |

### KUT-FIN-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Modelo Financeiro e Contabilístico / Financial Governance Policy |
| **Interpretação** | Entendi que documento-mestre explica actividade Kuteka, fontes receita, comissões, despesas, tratamento contabilístico. Doc1 chama "Financial Governance Policy"; doc2 "Modelo Financeiro e Contabilístico" — mesmo ID, mesmo intent. |
| **Estado actual** | 🟡 |
| **O que já existe** | Ledger+Pay sandbox+Super finance UI; docs finance parciais; sem KUT-FIN-001 formal |
| **O que falta** | Documento FIN-001 completo + export automático dossiê |
| **Dependências** | KUT-STR-001; KUT-FIN-002–008; parecer contabilista |
| **Riscos** | CONFLITO doc1/doc2 título; modelo incompleto antes Pay real |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Redigir FIN-001 unificado; mapear receitas reais 🟢/🟡/🔴 — zero código financeiro novo |

### KUT-FIN-002

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Financial Flow Map |
| **Interpretação** | Mapa de fluxos dinheiro (quem paga/recebe/quando/documento). Responsabilidades → KUT-FIN-010. |
| **Estado actual** | 🟡 |
| **O que já existe** | Kuteka Pay engine+Ledger RPCs; fluxos parciais implementados sandbox |
| **O que falta** | Diagrama FIN-002 validado contabilista — ver FIN Pack v0.1 |
| **Dependências** | KUT-FIN-003; KUT-FIN-010; KUT-LEG-003; PSP |
| **Riscos** | Custódia fundos indefinida antes parecer |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Redigir mapa no Master Dossier finance pack — aguardar contabilista |

### KUT-FIN-003

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Payment & Financial RACI |
| **Interpretação** | Matriz R/A/C/I financeira. Procedimento reconciliação → KUT-FIN-007. |
| **Estado actual** | 🟡 |
| **O que já existe** | Reconciliation UI Super 🟡; RACI draft GOV/FIN pack |
| **O que falta** | Publicar KUT-FIN-003 + validação cruzada RBAC |
| **Dependências** | KUT-GOV-003; KUT-FIN-007; finance RPCs |
| **Riscos** | Responsável reconciliação indefinido |
| **Prioridade** | P0 |
| **Classificação** | B |
| **Acção proposta** | Consolidar RACI Master Dossier — RBAC após autorização |

### KUT-FIN-004

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Financial Classification Map |
| **Interpretação** | Plano de contas / classificação contabilística Kuteka. Reembolso procedimental → KUT-FIN-009. |
| **Estado actual** | 🟡 |
| **O que já existe** | Refunds RPC Super 🟢; classificação contabilística 🔴 |
| **O que falta** | Documento FIN-004 + validação contabilista |
| **Dependências** | KUT-FIN-001; contabilista |
| **Riscos** | Classificação incorrecta antes Pay real |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Redigir no FIN Pack v0.1 — aguardar contabilista |

### KUT-FIN-005

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Commission Management Policy / Commission Policy |
| **Interpretação** | Entendi que política comissões (activação, serviços, prestadores, publicidade, incentivos) versionada; 35% activação só Founder; sem retroactividade contratos. |
| **Estado actual** | 🟡 |
| **O que já existe** | `platform_commission_params`+`founder_set_commission_param` (SQL); Super `finance_set_commission` (UI) — duplicação |
| **O que falta** | Política FIN-005 escrita; UI única Founder; histórico versões |
| **Dependências** | KUT-POL-005; KUT-ADVICE-002; Founder |
| **Riscos** | Duas fontes comissão; alteração comercial não autorizada |
| **Prioridade** | P0 |
| **Classificação** | D |
| **Acção proposta** | Documentar política C2; Founder escolhe fonte verdade (D1) — unificação código fase posterior |

### KUT-FIN-006

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Payment & Collection Policy |
| **Interpretação** | Entendi que regras nascimento obrigação, pago, falha, duplicado, reembolso, chargeback, pendente. |
| **Estado actual** | 🟡 |
| **O que já existe** | Kuteka Pay estados sandbox; sem política documentada |
| **O que falta** | KUT-FIN-006 documento + alinhamento estados Pay |
| **Dependências** | KUT-FIN-007; KUT-LEG-003 |
| **Riscos** | Estados Pay divergem de política |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Redigir política; mapear estados Pay existentes — B se gaps menores |

### KUT-FIN-007

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Reconciliation Procedure |
| **Interpretação** | Entendi que procedimento passo-a-passo: importar transacções, comparar Ledger/gateway/banco, excepções, aprovar, fechar. |
| **Estado actual** | 🟡 |
| **O que já existe** | Super recon panel + `finance_create_accounting_export` stub |
| **O que falta** | Procedimento FIN-007 + workflow excepções auditável |
| **Dependências** | KUT-FIN-003; contabilista cockpit futuro |
| **Riscos** | Divergências não fechadas |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Documentar procedimento; evoluir Super recon — aguardar autorização |

### KUT-FIN-008

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Monthly Accounting & Tax Report Specification |
| **Interpretação** | Entendi que spec relatório mensal (receitas, comissões, despesas, divergências, impostos) para contabilista; apoia AGT, não substitui. |
| **Estado actual** | 🟡 |
| **O que já existe** | Export contabilístico JSON/CSV stub; sem pacote mensal completo |
| **O que falta** | Spec FIN-008 + botão "Gerar pacote contabilístico" (doc 2 §7.27) |
| **Dependências** | KUT-FIN-001; role contabilista; AGT |
| **Riscos** | Scraping AGT proibido; relatório fiscal incorrecto |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Definir spec; implementar export fase contabilista — E scraping AGT |

### KUT-FIN-009

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Refund Policy *(novo ID — ex-doc1 FIN-004)* |
| **Interpretação** | Procedimento financeiro operacional de reembolso no Ledger/Pay. Distinto LEG-043 (contrato) e POL-006 (regra). |
| **Estado actual** | 🟡 |
| **O que já existe** | Refunds RPC Super 🟢; sem política FIN-009 documentada |
| **O que falta** | Documento FIN-009 no FIN Pack v0.1 |
| **Dependências** | KUT-FIN-006; KUT-FIN-007; KUT-LEG-043; KUT-POL-006 |
| **Riscos** | Reembolso inconsistente com contrato/política |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Redigir FIN-009 Master Dossier — zero código Fase 0 |

### KUT-FIN-010

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Payment Responsibility Matrix *(novo ID — ex-doc1 FIN-002)* |
| **Interpretação** | Matriz quem é responsável financeiramente por cada tipo de pagamento. Complementa FIN-002 Flow Map. |
| **Estado actual** | 🟡 |
| **O que já existe** | Fluxos parciais Pay/Ledger; matriz não publicada |
| **O que falta** | Documento FIN-010 no FIN Pack v0.1 |
| **Dependências** | KUT-FIN-002; KUT-FIN-003; KUT-LEG-003 |
| **Riscos** | Ambiguidade responsabilidade pagamentos |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Redigir matriz Master Dossier — aguardar contabilista |

### KUT-GOV-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Governance Framework |
| **Interpretação** | Entendi que define estrutura de governação Kuteka: papéis institucionais vs operacionais, separação poderes, delegação, auditoria, decisões estratégicas. |
| **Estado actual** | 🟡 |
| **O que já existe** | RBAC+founders+matriz ops em código/docs; sem framework document KUT-GOV-001 |
| **O que falta** | Documento GOV-001 + mapa papéis oficial alinhado código |
| **Dependências** | KUT-GOV-002/003/004; delegação §14 doc1 |
| **Riscos** | Divergência doc vs RBAC real |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar GOV-001 a partir código existente + doc — não alterar RBAC até aprovação |

### KUT-GOV-002

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Decision Register |
| **Interpretação** | Entendi que registo formal de decisões estratégicas (quem decidiu, quando, motivo, impacto, documentos). |
| **Estado actual** | 🔴 |
| **O que já existe** | Audit logs operacionais; sem registo decisões estratégicas dedicado |
| **O que falta** | Tabela/UI Decision Register ligada a Founder Center |
| **Dependências** | KUT-GOV-001; KUT-MIN-2026 |
| **Riscos** | Decisões comerciais sem rastreio |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Propor Decision Register mínimo — documentar primeiro em spreadsheet/dossier se autorizado fase 0 |

### KUT-GOV-003

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | RACI Matrix |
| **Interpretação** | Entendi que matriz Processo×Papel (R/A/C/I) para operações críticas: comissão, aprovação imóvel, reconciliação, fiscal, segurança. |
| **Estado actual** | 🟡 |
| **O que já existe** | Matriz permissões código; KUT-FIN-003 pede RACI financeiro; sem RACI global publicada |
| **O que falta** | KUT-GOV-003 documento + validação cruzada com RBAC |
| **Dependências** | KUT-FIN-003; todos POL |
| **Riscos** | Ambiguidade responsabilidades ("pensei que era ele") |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Produzir RACI master a partir matriz ops existente — alinhar com Founder antes de RBAC changes |

### KUT-GOV-004

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Meeting & Minutes Policy |
| **Interpretação** | Entendi que política de reuniões institucionais e formato/registo de atas. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem módulo atas |
| **O que falta** | KUT-GOV-004 policy + template KUT-MIN-2026 |
| **Dependências** | KUT-MIN-2026-001 |
| **Riscos** | Decisões reunião não registadas |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Documentar política + template; registo digital fase posterior |

### KUT-INC-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Incident Management Procedure |
| **Interpretação** | Entendi que procedimento gestão incidentes (classificação, resposta, comunicação, pós-mortem). |
| **Estado actual** | 🔴 |
| **O que já existe** | Audit logs; KOCC flags; sem procedimento INC formal |
| **O que falta** | KUT-INC-001 + template registo incidente |
| **Dependências** | KUT-BCP-001; KUT-INC-2026-001 |
| **Riscos** | Incidentes não aprendidos |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir procedimento; template registo — C módulo incidentes depois |

### KUT-INC-2026-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Registo de Incidente (exemplo/template) |
| **Interpretação** | Entendi que exemplifica registo incidente: data, serviço, causa, impacto, acção preventiva — não é feature por si. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem registo incidentes na plataforma |
| **O que falta** | Template + futura tabela incidents |
| **Dependências** | KUT-INC-001 |
| **Riscos** | Confundir exemplo com implementação |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Criar template MD; ligar a INC-001 quando autorizado |

### KUT-LEAD-2026-000123

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Identificador lead/exemplo comercial |
| **Interpretação** | Entendi que exemplo formato ID lead comercial (CRM) — ilustração, não requisito CRM completo. |
| **Estado actual** | 🔴 |
| **O que já existe** | CRM Super tab 🟡 parcial; sem IDs lead padronizados |
| **O que falta** | Convenção ID leads se CRM evoluir |
| **Dependências** | Super CRM; Growth Engine doc3 |
| **Riscos** | Implementar CRM completo prematuramente |
| **Prioridade** | P2 |
| **Classificação** | E |
| **Acção proposta** | Documentar convenção; E CRM até Growth autorizado |

### KUT-LEG-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Modelo Jurídico e Operacional da Kuteka |
| **Interpretação** | Entendi que KUT-LEG-001 é instrumento jurídico/compliance para Modelo Jurídico e Operacional da Kuteka. papel Kuteka no mercado; intermediação; responsabilidades. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-001 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-002

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Legal Activity Matrix |
| **Interpretação** | Entendi que KUT-LEG-002 é instrumento jurídico/compliance para Legal Activity Matrix. actividades×risco jurídico; licenças necessárias. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-002 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-003

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Kuteka Pay Regulatory & Operating Model |
| **Interpretação** | Entendi que KUT-LEG-003 é instrumento jurídico/compliance para Kuteka Pay Regulatory & Operating Model. custódia vs agregador; BNA; fluxo regulatório. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Pay engine sandbox; sem modelo regulatório documentado |
| **O que falta** | Documento LEG-003 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P0 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-010

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Termos do Cliente |
| **Interpretação** | Entendi que KUT-LEG-010 é instrumento jurídico/compliance para Termos do Cliente. contrato utilizador final. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Termos Utilização v1 `/termos` |
| **O que falta** | Documento LEG-010 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-011

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Contrato/Termos do PP |
| **Interpretação** | Entendi que KUT-LEG-011 é instrumento jurídico/compliance para Contrato/Termos do PP. relação parceiro patrimonial. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-011 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-012

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Contrato/Termos do Agente |
| **Interpretação** | Entendi que KUT-LEG-012 é instrumento jurídico/compliance para Contrato/Termos do Agente. agente certificado. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-012 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-013

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Contrato/Termos do Prestador |
| **Interpretação** | Entendi que KUT-LEG-013 é instrumento jurídico/compliance para Contrato/Termos do Prestador. prestador serviços. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-013 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-014

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Termos B2B |
| **Interpretação** | Entendi que KUT-LEG-014 é instrumento jurídico/compliance para Termos B2B. empresas. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-014 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-015

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Advertising Terms |
| **Interpretação** | Entendi que KUT-LEG-015 é instrumento jurídico/compliance para Advertising Terms. publicidade plataforma. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-015 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-016

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Service Terms |
| **Interpretação** | Entendi que KUT-LEG-016 é instrumento jurídico/compliance para Service Terms. serviços Kuteka (mudança, concierge, etc.). Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-016 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-020

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Privacidade |
| **Interpretação** | Entendi que KUT-LEG-020 é instrumento jurídico/compliance para Política de Privacidade. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Privacidade v1 publicados |
| **O que falta** | Documento LEG-020 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-021

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Cookies |
| **Interpretação** | Entendi que KUT-LEG-021 é instrumento jurídico/compliance para Política de Cookies. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Cookies v1 publicados |
| **O que falta** | Documento LEG-021 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-022

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de retenção de dados |
| **Interpretação** | Entendi que KUT-LEG-022 é instrumento jurídico/compliance para Política de retenção de dados. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-022 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-023

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de acesso a dados |
| **Interpretação** | Entendi que KUT-LEG-023 é instrumento jurídico/compliance para Política de acesso a dados. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-023 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-024

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Procedimento incidente de dados |
| **Interpretação** | Entendi que KUT-LEG-024 é instrumento jurídico/compliance para Procedimento incidente de dados. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-024 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-030

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de KYC/Verificação |
| **Interpretação** | Entendi que KUT-LEG-030 é instrumento jurídico/compliance para Política de KYC/Verificação. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Trust/KYC/moderação/reviews parcialmente em código |
| **O que falta** | Documento LEG-030 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-031

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Moderação |
| **Interpretação** | Entendi que KUT-LEG-031 é instrumento jurídico/compliance para Política de Moderação. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Trust/KYC/moderação/reviews parcialmente em código |
| **O que falta** | Documento LEG-031 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-032

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Denúncias |
| **Interpretação** | Entendi que KUT-LEG-032 é instrumento jurídico/compliance para Política de Denúncias. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Trust/KYC/moderação/reviews parcialmente em código |
| **O que falta** | Documento LEG-032 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-033

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Avaliações/Reputação |
| **Interpretação** | Entendi que KUT-LEG-033 é instrumento jurídico/compliance para Política de Avaliações/Reputação. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🟡 |
| **O que já existe** | Trust/KYC/moderação/reviews parcialmente em código |
| **O que falta** | Documento LEG-033 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-034

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Suspensão de Contas |
| **Interpretação** | Entendi que KUT-LEG-034 é instrumento jurídico/compliance para Política de Suspensão de Contas. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-034 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-035

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Conflitos de Interesse |
| **Interpretação** | Entendi que KUT-LEG-035 é instrumento jurídico/compliance para Política de Conflitos de Interesse. . Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-035 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-040

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Agent Code of Conduct |
| **Interpretação** | Entendi que KUT-LEG-040 é instrumento jurídico/compliance para Agent Code of Conduct. conduta agente; anti-desvio clientes. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-040 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-041

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Provider Terms & Commercial Policy |
| **Interpretação** | Entendi que KUT-LEG-041 é instrumento jurídico/compliance para Provider Terms & Commercial Policy. prestador: comissão, pub, campanhas. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-041 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-042

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Advertising Policy |
| **Interpretação** | Entendi que KUT-LEG-042 é instrumento jurídico/compliance para Advertising Policy. conteúdos; aprovação; patrocinado. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-042 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-LEG-043

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Refund & Cancellation Policy |
| **Interpretação** | Entendi que KUT-LEG-043 é instrumento jurídico/compliance para Refund & Cancellation Policy. cancelamento; reembolso; fraude. Validar por advogado — Cursor não inventa requisitos legais. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem documento KUT-LEG formal |
| **O que falta** | Documento LEG-043 versionado no Legal Pack; parecer KUT-ADVICE quando aplicável |
| **Dependências** | KUT-ADVICE-001; Master Dossier; advogado externo |
| **Riscos** | Tratar rascunho Cursor como válido juridicamente |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Consolidar rascunho a partir docs existentes → revisão advogado → publicar versão oficial |

### KUT-MIN-2026-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Ata de reunião (exemplo/template) |
| **Interpretação** | Entendi que template ata decisões reunião Founder/contabilista/advogado. |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem módulo atas |
| **O que falta** | Template MIN + Decision Register |
| **Dependências** | KUT-GOV-004; KUT-GOV-002 |
| **Riscos** | Decisões orais perdidas |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Template documental; registo digital fase 2 |

### KUT-POL-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Segurança da Informação |
| **Interpretação** | Entendi que KUT-POL-001 define a regra empresarial de nível 1 sobre cibersegurança, acessos, incidentes, MFA, logs; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem política formal KUT-POL na plataforma |
| **O que falta** | Documento POL-001 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-002

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Protecção de Dados |
| **Interpretação** | Entendi que KUT-POL-002 define a regra empresarial de nível 1 sobre LGPD/RGPD-style; bases legais; retenção; direitos titular; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🟡 |
| **O que já existe** | Política Privacidade v1 (`docs/legal`, `/privacidade`) — não mapeada como KUT-POL-002 |
| **O que falta** | Documento POL-002 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | B |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-003

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política Financeira |
| **Interpretação** | Entendi que KUT-POL-003 define a regra empresarial de nível 1 sobre princípios receita, despesa, segregação, aprovações financeiras; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem política formal KUT-POL na plataforma |
| **O que falta** | Documento POL-003 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-004

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Pagamentos |
| **Interpretação** | Entendi que KUT-POL-004 define a regra empresarial de nível 1 sobre quando nasce/paga/falha/reembolsa; sandbox vs real; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem política formal KUT-POL na plataforma |
| **O que falta** | Documento POL-004 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-005

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Comissões |
| **Interpretação** | Entendi que KUT-POL-005 define a regra empresarial de nível 1 sobre activação 35% Founder-only; sem retroactividade; versionamento; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🟡 |
| **O que já existe** | SQL `platform_commission_params` 35%; sem política documentada KUT-POL-005 |
| **O que falta** | Documento POL-005 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P1 |
| **Classificação** | B |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-006

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Reembolsos |
| **Interpretação** | Entendi que KUT-POL-006 define a regra empresarial de nível 1 sobre cancelamentos, prazos, responsável, fraude; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem política formal KUT-POL na plataforma |
| **O que falta** | Documento POL-006 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-007

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Gestão de Prestadores |
| **Interpretação** | Entendi que KUT-POL-007 define a regra empresarial de nível 1 sobre onboarding, moderação, comissão, publicidade; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem política formal KUT-POL na plataforma |
| **O que falta** | Documento POL-007 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-008

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Gestão de Agentes |
| **Interpretação** | Entendi que KUT-POL-008 define a regra empresarial de nível 1 sobre conduta, leads, conflitos, visitas; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem política formal KUT-POL na plataforma |
| **O que falta** | Documento POL-008 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-009

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Conflitos de Interesse |
| **Interpretação** | Entendi que KUT-POL-009 define a regra empresarial de nível 1 sobre agente/prestador/PP; declaração e sanções; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🔴 |
| **O que já existe** | Sem política formal KUT-POL na plataforma |
| **O que falta** | Documento POL-009 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | C |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-POL-010

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Política de Continuidade do Negócio |
| **Interpretação** | Entendi que KUT-POL-010 define a regra empresarial de nível 1 sobre BCP/DRP; RTO/RPO; responsáveis; procedimentos (PRO) descem o "como". |
| **Estado actual** | 🟡 |
| **O que já existe** | BCP/DRP v0.9 em `docs/operations/` — não POL formal |
| **O que falta** | Documento POL-010 versionado; referência no Compliance pack; eventual aceite interno |
| **Dependências** | KUT-DOC-001; KUT-GOV-001; pareceres |
| **Riscos** | Implementar regra técnica sem política escrita |
| **Prioridade** | P2 |
| **Classificação** | B |
| **Acção proposta** | Redigir política formal → versionar → publicar no dossiê — implementação técnica só após validação Founder |

### KUT-STR-001

| Campo | Conteúdo |
|-------|----------|
| **Requisito** | Business Model Canvas da Kuteka |
| **Interpretação** | Entendi que devo formalizar o modelo de negócio (segmentos, proposta valor, canais, receitas, custos) como documento vivo entregue ao contabilista/advogado e referenciado no Founder OS. |
| **Estado actual** | 🔴 |
| **O que já existe** | Análise negócio em doc 2 (texto); sem canvas formal versionado na plataforma |
| **O que falta** | Canvas PDF/MD; secção estratégia Founder Center |
| **Dependências** | KUT-FIN-001; Master Dossier; pareceres |
| **Riscos** | Contabilista e advogado analisarem modelos diferentes |
| **Prioridade** | P1 |
| **Classificação** | C |
| **Acção proposta** | Redigir KUT-STR-001 a partir do dossiê; publicar em /documentacao interno; link no pack profissional — sem código até autorizado |

---

## Tabela compacta (65 linhas)

| ID | Requisito (curto) | Estado | Prio | Class | Risco principal |
|----|-------------------|--------|------|-------|-----------------|
| KUT-ADVICE-001 | Registo de parecer profissional — Kuteka Pay — custódia… | 🔴 | P0 | C | Activar Pay/comissões reais sem parecer … |
| KUT-ADVICE-002 | Registo de parecer profissional — Tratamento contabilís… | 🔴 | P0 | C | Activar Pay/comissões reais sem parecer … |
| KUT-ADVICE-003 | Registo de parecer profissional — Facturação e document… | 🔴 | P0 | C | Activar Pay/comissões reais sem parecer … |
| KUT-ADVICE-004 | Registo de parecer profissional — Comissão paga antecip… | 🔴 | P1 | C | Activar Pay/comissões reais sem parecer … |
| KUT-ADVICE-005 | Registo de parecer profissional — Incentivo comercial 0… | 🔴 | P1 | C | Activar Pay/comissões reais sem parecer … |
| KUT-BCP-001 | Business Continuity Plan | 🟡 | P2 | B | Plano só papel |
| KUT-CMP-001 | Compliance Framework | 🔴 | P2 | C | Compliance ad hoc |
| KUT-CMP-002 | Tax Compliance Procedure | 🔴 | P1 | C | Scraping AGT; credenciais inseguras |
| KUT-CMP-003 | Payment Compliance Framework | 🔴 | P0 | D | Operar Pay real ilegalmente |
| KUT-DOC-001 | Document Management Policy | 🟡 | P1 | C | Sobrescrever versão validada |
| KUT-DRP-001 | Disaster Recovery Plan | 🟡 | P2 | B | Sem testes DR |
| KUT-FIN-001 | Modelo Financeiro e Contabilístico / Financial Governan… | 🟡 | P0 | C | CONFLITO doc1/doc2 título; modelo incomp… |
| KUT-FIN-002 | Financial Flow Map | 🟡 | P0 | C | Custódia fundos indefinida |
| KUT-FIN-003 | Payment & Financial RACI | 🟡 | P0 | B | Responsável reconciliação indefinido |
| KUT-FIN-004 | Financial Classification Map | 🟡 | P0 | C | Classificação incorrecta |
| KUT-FIN-005 | Commission Management Policy | 🟡 | P0 | D | Duas fontes comissão (ver C2) |
| KUT-FIN-006 | Payment & Collection Policy | 🟡 | P1 | C | Estados Pay divergem de política |
| KUT-FIN-007 | Reconciliation Procedure | 🟡 | P1 | B | Divergências não fechadas |
| KUT-FIN-008 | Monthly Accounting & Tax Report Specification | 🟡 | P1 | C | Scraping AGT proibido |
| KUT-FIN-009 | Refund Policy | 🟡 | P1 | C | Reembolso inconsistente |
| KUT-FIN-010 | Payment Responsibility Matrix | 🟡 | P0 | C | Ambiguidade responsabilidade |
| KUT-GOV-001 | Governance Framework | 🟡 | P1 | B | Divergência doc vs RBAC |
| KUT-GOV-002 | Decision Register | 🔴 | P2 | C | Decisões comerciais sem rastreio |
| KUT-GOV-003 | RACI Matrix | 🟡 | P1 | B | Ambiguidade responsabilidades ("pensei q… |
| KUT-GOV-004 | Meeting & Minutes Policy | 🔴 | P2 | C | Decisões reunião não registadas |
| KUT-INC-001 | Incident Management Procedure | 🔴 | P2 | C | Incidentes não aprendidos |
| KUT-INC-2026-001 | Registo de Incidente (exemplo/template) | 🔴 | P2 | C | Confundir exemplo com implementação |
| KUT-LEAD-2026-000123 | Identificador lead/exemplo comercial | 🔴 | P2 | E | Implementar CRM completo prematuramente |
| KUT-LEG-001 | Modelo Jurídico e Operacional da Kuteka | 🔴 | P0 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-002 | Legal Activity Matrix | 🔴 | P0 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-003 | Kuteka Pay Regulatory & Operating Model | 🟡 | P0 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-010 | Termos do Cliente | 🟡 | P1 | B | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-011 | Contrato/Termos do PP | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-012 | Contrato/Termos do Agente | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-013 | Contrato/Termos do Prestador | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-014 | Termos B2B | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-015 | Advertising Terms | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-016 | Service Terms | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-020 | Política de Privacidade | 🟡 | P1 | B | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-021 | Política de Cookies | 🟡 | P1 | B | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-022 | Política de retenção de dados | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-023 | Política de acesso a dados | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-024 | Procedimento incidente de dados | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-030 | Política de KYC/Verificação | 🟡 | P1 | B | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-031 | Política de Moderação | 🟡 | P1 | B | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-032 | Política de Denúncias | 🟡 | P1 | B | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-033 | Política de Avaliações/Reputação | 🟡 | P1 | B | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-034 | Política de Suspensão de Contas | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-035 | Política de Conflitos de Interesse | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-040 | Agent Code of Conduct | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-041 | Provider Terms & Commercial Policy | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-042 | Advertising Policy | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-LEG-043 | Refund & Cancellation Policy | 🔴 | P1 | C | Tratar rascunho Cursor como válido jurid… |
| KUT-MIN-2026-001 | Ata de reunião (exemplo/template) | 🔴 | P2 | C | Decisões orais perdidas |
| KUT-POL-001 | Política de Segurança da Informação | 🔴 | P2 | C | Implementar regra técnica sem política e… |
| KUT-POL-002 | Política de Protecção de Dados | 🟡 | P2 | B | Implementar regra técnica sem política e… |
| KUT-POL-003 | Política Financeira | 🔴 | P2 | C | Implementar regra técnica sem política e… |
| KUT-POL-004 | Política de Pagamentos | 🔴 | P1 | C | Implementar regra técnica sem política e… |
| KUT-POL-005 | Política de Comissões | 🟡 | P1 | B | Implementar regra técnica sem política e… |
| KUT-POL-006 | Política de Reembolsos | 🔴 | P2 | C | Implementar regra técnica sem política e… |
| KUT-POL-007 | Política de Gestão de Prestadores | 🔴 | P2 | C | Implementar regra técnica sem política e… |
| KUT-POL-008 | Política de Gestão de Agentes | 🔴 | P2 | C | Implementar regra técnica sem política e… |
| KUT-POL-009 | Política de Conflitos de Interesse | 🔴 | P2 | C | Implementar regra técnica sem política e… |
| KUT-POL-010 | Política de Continuidade do Negócio | 🟡 | P2 | B | Implementar regra técnica sem política e… |
| KUT-STR-001 | Business Model Canvas da Kuteka | 🔴 | P1 | C | Contabilista e advogado analisarem model… |