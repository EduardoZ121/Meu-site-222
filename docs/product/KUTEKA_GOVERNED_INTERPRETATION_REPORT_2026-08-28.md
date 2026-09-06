# KUTEKA — Relatório Governado de Interpretação, Auditoria e Plano

| Campo | Valor |
|-------|-------|
| **Data** | 2026-08-28 |
| **Fonte** | Documento único em 3 partes (PDFs entregues pelo Founder) |
| **Plataforma auditada** | `EduardoZ121/Site_Angola` — produção `https://kutekalink.com` |
| **Fases cobertas** | 1 Interpretação · 2 Auditoria · 3 Riscos · 4 Plano |
| **Fase 6** | **PARAR — sem alterações de código autorizadas** |

Legenda de classificação por requisito:

| Class. | Significado |
|--------|-------------|
| **A** | Reutilizar existente |
| **B** | Modificar existente |
| **C** | Criar novo |
| **D** | Aguardar decisão/autorização |
| **E** | Não implementar nesta fase |
| 🟢 | Implementado |
| 🟡 | Parcial |
| 🔵 | Preparado (infra/SQL sem UI ou sem uso real) |
| 🔴 | Inexistente |
| ⚪ | Documentar para futuro |

---

## 0. Protocolo aceite

Entendi que este documento **não é uma lista de features para execução imediata**. O fluxo obrigatório é:

**INTERPRETAR → AUDITAR → VALIDAR (Founder) → AUTORIZAR POR FASE → EXECUTAR → TESTAR → REPORTAR**

O Cursor actua como **executor técnico**; não decide modelo comercial, comissões, jurídico, fiscal, AML/KYC ou estrutura institucional.

---

## 1. Mapa do documento (3 partes = 1)

| Parte | Páginas | Conteúdo principal |
|-------|---------|-------------------|
| **Doc 1** | ~129 | FASE 0 protocolo; ecossistema vs portal; governação; delegação Founder; políticas KUT-POL/GOV/FIN/CMP/BCP; compliance; neutralidade institucional |
| **Doc 2** | ~205 | Founder Management Ecosystem; pacotes contabilista/advogado; modelo financeiro 7.x; cockpit contabilista; rede Prestadores 28.x; Business Canvas |
| **Doc 3** | ~157 | Identidade Founder/Co-Founder (sec. 29); Beta aquisição/inventário; feedback contextual; Growth Engine / referrals |

**IDs formais detectados:** ~68 entradas `KUT-*` (POL, GOV, FIN, LEG, CMP, BCP, DRP, ADVICE, etc.).

---

## 2. FASE 1 — Interpretação por domínio

### 2.1 FASE 0 — Governed Development Protocol

**Entendi que:** Antes de qualquer código, devo produzir este relatório; correcções do Founder usam formato `CORRECÇÃO DO FOUNDER — ITEM KUT-XXX`; autorização é **por fase e escopo**, nunca global.

| Aspecto | Plataforma actual | Falta | Class. |
|---------|-------------------|-------|--------|
| Protocolo formal no repo | 🟡 ADRs/docs existem; não há `GOVERNED_DEVELOPMENT_PROTOCOL.md` dedicado | Documento de processo | **C** ou **E** (só doc) |
| Bloqueio de execução | N/A (processo) | Founder validar interpretação | **D** |

**Não implementar ainda:** qualquer módulo até autorização explícita.

---

### 2.2 Visão estratégica — Ecossistema económico

**Entendi que:** Kuteka = infraestrutura que liga habitação → serviços → transacções → dados → confiança → receita recorrente; imóvel é **porta de entrada**, não produto final.

| Aspecto | Existe | Onde | Class. |
|---------|--------|------|--------|
| Módulos serviços (Mudança, Encontrar Casa, Concierge, Garantia, Assistência) | 🟡 | `/app/mudanca`, `/app/encontrar-casa`, etc. + SQL monetization | **B** — alinhar UX/monetização |
| Marketplace Prestadores | 🟡 | `/app/servicos`, `service_provider` | **B** |
| Ledger / Pay sandbox | 🟢 | `0022` Kuteka Pay, Super tabs | **A** |
| Loop económico completo ponta-a-ponta | 🔴 | — | **E** até validação comercial |

---

### 2.3 Founder Management Ecosystem (“Founder OS”)

**Entendi que:** Founder Center deve consolidar visão executiva (Estratégia → … → KPI/Riscos) com cadeia **Dado → Indicador → Alerta → Problema → Decisão → Acção → Resultado**; **não** substituir contabilista/advogado; sistema **mostra**, Founder **decide**.

| Área pedida | Existe | Evidência | Class. |
|-------------|--------|-----------|--------|
| Founder Center | 🟡 | `/app/fundador` — tabs Empresa, Pessoas, Operação, Financeiro (link Super), Segurança, KOCC, Auditoria, Flags, Escalações | **B** |
| Super Command | 🟢 | `/app/super` — 17+ tabs finance/ops | **A** |
| KOCC + métricas Beta | 🟡 | `KoccCenterClient`, `0035` | **A/B** |
| Estratégia/OKR/KPI dedicados | 🔴 | — | **C** |
| Marketing/SEO analytics | 🔴 | `modules/analytics/` stub | **C/E** |
| BCP/DRP operacional | 🔴 UI | Só `docs/operations/BCP/DRP v0.9` | **C** (doc-first) |
| Painel aprendizagem Beta | 🔴 | — | **C** |

**Dependências:** KOCC, Audit, Finance RPCs, `kos_ops_metrics`.

**Não implementar ainda:** “dashboard gigante” sem arquitectura; duplicar Super/Finance.

---

### 2.4 Governação, delegação e papéis (Doc 1 §14)

**Entendi que:** Separar **cargo / função / responsabilidade / autoridade / permissão / delegação**; Founder delega **domínios** a Super Admin com início/fim/revogação/auditoria; delegação **≠** transferir ownership; SoD em operações críticas.

| Requisito | Existe | Evidência | Class. |
|-----------|--------|-----------|--------|
| RBAC + experience lens | 🟢 | `role-experience.ts`, `0037`, `0040` | **A** |
| `founders` por `user_id` | 🟢 | `0036` tabela `founders` | **A** |
| Promover papéis (Founder→Co-Founder/Super) | 🟢 | `founder_promote_user`, InstitutionalCenter | **A** |
| **Delegação formal por domínio** (temporal, revogável) | 🔴 | Sem tabela/RPC `delegation` | **C** |
| Relatório delegações | 🔴 | — | **C** |
| Board/Investor/Auditor UI | 🔴 | Papéis SQL reservados, sem ExperienceMode | **E** v1.1+ |
| Co-Founder configurável (limites Owner) | 🟡 | Badge; sem matriz configurável | **D** |

**Conflito potencial:** Doc pede delegação granular; hoje promover Super Admin dá `super_administrator` (largo). **Decisão Founder:** delegação como overlay vs papéis actuais?

---

### 2.5 Identidade Founder/Co-Founder (Doc 3 §29)

**Entendi que:** Estatuto institucional = `user_id` + tabela `founders`; email só autenticação; alteração só pelo próprio via Centro de Segurança com reauth; **não** rebuild hierarquia; sucessão complexa **futuro**.

| Requisito | Existe | Evidência | Class. |
|-----------|--------|-----------|--------|
| `founders.user_id` como fonte | 🟢 | `0036`, bootstrap `0040` | **A** |
| Permissões não atadas a email | 🟢 | RBAC por user_id | **A** |
| Alterar email seguro | 🟡 | `SecurityCenterClient` — OTP flow; marcar beta | **B** |
| Founder não edita Co-Founder | 🟡 | UI não expõe edição cruzada; validar RLS | **B** |
| Auditoria alteração email | 🟡 | `sensitive-change.ts`, audit events | **B** |

**AGORA (doc):** auditar compatibilidade — **não activar** fluxo completo até testes.

---

### 2.6 Financeiro, comissões, Kuteka Pay (Doc 1–2 §7)

**Entendi que:** Modelo financeiro completo; comissão activação **35%** controlada **exclusivamente Founder/Owner** via parâmetro versionado; **sem retroactividade**; reconciliação; sandbox vs real claramente separados; sequência **modelo → dossiê → contabilista → advogado → PSP → registo → activação real**.

| Requisito | Existe | Evidência | Class. |
|-----------|--------|-----------|--------|
| Ledger + intents + invoices | 🟢 | `0019–0023` | **A** |
| Kuteka Pay sandbox | 🟢 | `kuteka_pay_*` | **A** |
| `platform_commission_params` + `founder_set_commission_param` (35%) | 🔵 | `0036` SQL; **sem UI** | **B** |
| Super `finance_set_commission` | 🟢 | `PricingPanel`, `finance_commission_rules` | **A** — **duplicação** |
| PSP real (Multicaixa/EMIS) | 🔴 | `ready:false` | **E** |
| Cockpit contabilista | 🔴 | Sem role `contabilista` | **C** |
| Fecho mensal / pacote AGT | 🔴 | Export stub `finance_create_accounting_export` | **C/D** |
| Scraping AGT | 🔴 proibido doc | — | **E** |

**Conflito crítico:** Duas vias de comissão (`founder_set_commission_param` vs `finance_set_commission`). **Decisão Founder:** qual é fonte de verdade para activação 35%?

**Não implementar ainda:** pagamentos reais, alteração comercial sem parecer.

---

### 2.7 Pacotes profissionais (contabilista / advogado)

**Entendi que:** Entregar dossiês estruturados (KUT-FIN-001…008, KUT-LEG-001…043); Registo Pareceres (KUT-ADVICE-001…005); advogado **sem** admin global; versionamento documentos.

| Requisito | Existe | Class. |
|-----------|--------|--------|
| Termos/Privacidade/Cookies estáticos | 🟢 `docs/legal`, `/termos` | **A** |
| Master Business Dossier gerado pela plataforma | 🔴 | **C** |
| Registo Pareceres | 🔴 | **C** |
| Legal cockpit completo | 🔴 | **E** (doc pede só dossier primeiro) |

**Dependências:** Founder Management docs; export financeiro.

---

### 2.8 Compliance, BCP/DRP, incidentes (KUT-CMP/BCP/DRP/INC/POL)

**Entendi que:** Framework compliance; BCP/DRP operacionalizável; incident management; document management; neutralidade perante autoridades (Government Access ≠ Admin Access).

| Requisito | Existe | Class. |
|-----------|--------|--------|
| Políticas escritas (POL-001…010) | 🟡 Parcial em docs | **B/C** — formalizar KUT-POL |
| BCP/DRP v0.9 | 🟡 Só markdown | **A** doc + **C** tracking |
| Incident procedure UI | 🔴 | **C/E** |
| Audit enriched | 🟢 `AuditCenterPanel`, `0037` | **A** |
| Solicitações regulatórias workflow | 🔴 | **C/D** |

---

### 2.9 Operações — fila, SLA, escalações, publicação

**Entendi que:** Central de Trabalho; pendência com motivos reais; Supervisor sem approve/reject; escalação formal; ciclo património completo.

| Requisito | Existe | Class. |
|-----------|--------|--------|
| Publication queue + decisões | 🟢 `PublicationReviewQueue`, `0036/0039` | **A** |
| Motivos pendência | 🟢 `publication_pending_reasons` | **A** |
| Escalações | 🟢 `EscalationPanel`, `0040` | **A** |
| KAI preliminar | 🟡 Rule-based RPC | **A/B** |
| Chat Cliente↔PP/Agente | 🟡 pairing/contrato | **B/D** |

---

### 2.10 Beta — aquisição, inventário, feedback (Doc 3)

**Entendi que:** Primeira Beta = **construir base real** (clientes, PP, imóveis, prestadores, procura); separar **registar** vs **activar/publicar**; registo rápido imóvel sem publicação imediata; Beta **honesta**; **não** usar contas demo como substituto; feedback **contextual** (bug/UX/sugestão/reclamação) com contexto rico; KOCC agrupamento; métricas funil.

| Requisito | Existe | Class. |
|-----------|--------|--------|
| Activar património completo | 🟢 `/app/patrimonios/novo` | **A** |
| Registo rápido (mínimo) separado | 🟡 Parcial — fluxo longo | **B/C** |
| Estados rascunho/submetido sem publicar | 🟢 lifecycle SQL | **A** |
| Beta feedback form | 🟡 `BetaFeedbackForm` → KOCC | **B** |
| Feedback contextual in-page | 🔴 | **C** |
| Contas demo.* | 🟢 Existem (bloqueadas Founder) | **D** — doc diz reduzir dependência |
| Painel Founder inventário Beta | 🔴 | **C** |

**Conflito:** Doc 3 pede Beta aberta sem “demo”; produção usa demos para validação PO. **Decisão Founder:** política contas demo em Beta pública.

---

### 2.11 Rede Prestadores (Doc 2 §28)

**Entendi que:** P0 experiência comercial completa (onboarding, perfil, publicações, pedidos, comissão, Ledger); P1 publicidade/destaque; **não** concluído só por `service_provider` + página.

| Aspecto | Estado | Class. |
|---------|--------|--------|
| Inbox + ciclo order | 🟡 | **B** |
| Perfil público prestador | 🟡 | **B/C** |
| Monetização publicidade | 🔴 | **E** P1 |
| Analytics receita por prestador | 🟡 Super parcial | **B** |

---

### 2.12 Growth Engine (Doc 3 final)

**Entendi que:** Infraestrutura referrals/recompensas éticas; medir loop atração→retenção; **não** recompensar acções vazias; parte do **primeiro lançamento** segundo doc.

| Requisito | Existe | Class. |
|-----------|--------|--------|
| Share social imóvel | 🟢 PropertySocialPanel | **A** |
| Referral tracking / rewards | 🔴 | **C/D** |
| Campanhas colectivas | 🔴 | **E** |

**Conflito:** Growth Engine “primeiro lançamento” vs freeze Beta 2 anterior. **Decisão Founder:** incluir no escopo Beta 1 pública?

---

## 3. FASE 2 — Auditoria da plataforma (snapshot)

### 3.1 Arquitectura

| Camada | Estado | Notas |
|--------|--------|-------|
| **Frontend** | 🟢 | Next.js 15 `apps/web`, static prebuilt → Render |
| **Backend activo** | 🟢 | Supabase RPC + RLS (~200 RPCs) |
| **Backend legacy** | 🔴 | `legacy/backend` Express — não produção |
| **BD** | 🟢 | Migrations `0001–0040` |
| **Packages** | 🟢 | ui, types, auth, database, validation |

### 3.2 Autenticação e RBAC

- Auth: Supabase email/password; sessão + `get_user_role_codes` / `get_user_permission_codes`
- 9 ExperienceModes + lens (UI não escala permissões reais)
- Papéis: client, patrimonial_partner, certified_agent, service_provider, supervisor, administrator, super_administrator, founder (+ co_founder, board, investor, auditor reservados)
- **Sem** contabilista/advogado como papéis

### 3.3 Cockpits

| Cockpit | Rota | Maturidade |
|---------|------|------------|
| Founder Center | `/app/fundador` | 🟡 |
| Super | `/app/super` | 🟢 |
| Admin | `/app/admin` | 🟢 |
| Agente | `/app/agente` | 🟡 demo parcial |
| Prestador | `/app/servicos` | 🟡 |
| Cliente/PP | `/app`, patrimónios | 🟢 |

### 3.4 Kuteka Pay / Ledger

- Sandbox funcional; gateways AO stubbed
- Dupla via comissões (ver §2.6)

### 3.5 Notificações

- RPC real + catálogo estático fallback (`TopbarActions`)

### 3.6 Feedback / KOCC

- `kocc_submit_beta_feedback`; flags; audit — **sem** feedback contextual rico

### 3.7 KAI

- Rule-based: fila publicação + insights home + regras Super — **sem** ML/job queue

### 3.8 Documentação

- Manuais v2, `/documentacao`, `/app/ajuda` por papel — 🟢

### 3.9 Integrações

- Supabase Storage 🟢 · Stripe/Multicaixa/EMIS 🔴 stub · AGT export comentário 🟡

### 3.10 Segurança / Auditoria

- Security Center OTP 🟡 · Audit Center 🟢 · RLS hardened 🟢

---

## 4. FASE 3 — Riscos e conflitos

### 4.1 Conflitos documento ↔ código

| ID | Conflito | Impacto | Decisão necessária |
|----|----------|---------|-------------------|
| C1 | Duas APIs comissão | Valores divergentes Super vs Founder param | Founder: fonte única |
| C2 | Growth Engine “lançamento 1” vs freeze Beta | Scope creep | Founder: prioridade |
| C3 | Beta aberta vs contas demo | Confusão utilizador/teste | Founder: política demo |
| C4 | Cockpit contabilista vs sem role | RBAC novo + SoD | Founder + contabilista |
| C5 | Delegação vs promover Super | Super recebe tudo vs domínio | Founder: modelo |
| C6 | Activar pagamentos reais vs sequência legal | Risco regulatório | Advogado + contabilista primeiro |
| C7 | Registo rápido imóvel vs RLS/review actual | Novos estados/transições | Arquitectura lifecycle |
| C8 | Doc 3 §29 email vs auth Supabase | Regressão login se mal feito | Testes Founder real |

### 4.2 Riscos de implementação (se autorizado sem plano)

| Risco | Severidade |
|-------|------------|
| Quebrar fila publicação / Supervisor gates | **Alta** |
| Alterar RLS permissões ops | **Alta** |
| Duplicar finance/ledger | **Alta** |
| Expor dados cross-tenant | **Crítica** |
| Regressão prebuilt deploy | **Média** |
| Dependência de uma pessoa (sem delegação doc) | **Estratégica** |

---

## 5. FASE 4 — Plano de implementação (ordem segura)

**Nota:** Cada linha requer `AUTORIZO: FASE X — escopo …` antes de execução.

### Onda 0 — Só documentação / validação (risco mínimo)

| # | Requisito | Componente | Class. | Prioridade | Teste |
|---|-----------|------------|--------|------------|-------|
| 0.1 | Governed Development Protocol | `docs/product/` | C doc | P0 | Revisão Founder |
| 0.2 | Master Business Dossier export | institutional module | C | P0 | PDF pack |
| 0.3 | Registo Pareceres KUT-ADVICE | SQL+UI mínima | C | P0 | CRUD + audit |
| 0.4 | Formalizar KUT-POL/GOV docs | `docs/legal` | B | P1 | Legal review |

### Onda 1 — Auditoria e alinhamento (sem novos módulos grandes)

| # | Requisito | Componente | Class. | Prioridade | Teste |
|---|-----------|------------|--------|------------|-------|
| 1.1 | Mapa comissão única | SQL+Super+Founder | B | P0 | RPC + UI |
| 1.2 | Audit identidade Founder §29 | founders+security | B | P0 | Founder claim real |
| 1.3 | Inventário gaps por papel (doc 2 §28.17) | product doc | A | P0 | Checklist PO |
| 1.4 | Marcar 🟢/🟡/🔴 em ESTADO_SERVICOS | help docs | B | P1 | UI |

### Onda 2 — Beta pública (após decisões C2/C3)

| # | Requisito | Componente | Class. | Prioridade | Teste |
|---|-----------|------------|--------|------------|-------|
| 2.1 | Registo rápido património | patrimonios wizard | B/C | P0 | E2E PP |
| 2.2 | Feedback contextual | shell+KOCC | C | P0 | Context capture |
| 2.3 | Painel Founder Beta metrics | fundador/kocc | B | P1 | Browser |
| 2.4 | Política demo accounts | auth/seed | D | P0 | Policy doc |

### Onda 3 — Founder OS (incremental)

| # | Requisito | Componente | Class. | Prioridade | Teste |
|---|-----------|------------|--------|------------|-------|
| 3.1 | Tabs Estratégia/KPI (read-only) | FounderCenter | C | P1 | Founder UX |
| 3.2 | BCP/DRP status surface | fundador | C | P2 | Link docs |
| 3.3 | Delegação formal | SQL+Founder UI | C | P1 | SoD tests |

### Onda 4 — Financeiro profundo (após pareceres)

| # | Requisito | Componente | Class. | Prioridade | Teste |
|---|-----------|------------|--------|------------|-------|
| 4.1 | Role contabilista + cockpit | RBAC+UI | C | P0* | *após legal |
| 4.2 | Fecho mensal / pacote | finance RPC | C | P1 | Export |
| 4.3 | PSP real | gateways | E | P2 | Sandbox first |

### Onda 5 — Growth Engine

| # | Requisito | Class. | Prioridade |
|---|-----------|--------|------------|
| 5.1 | Referral infra | C | P2 — **D** até Founder confirma C2 |
| 5.2 | Rewards ledger | C | P2 |

---

## 6. Pontos que precisam de esclarecimento do Founder

1. **Fonte de verdade comissão 35%:** `platform_commission_params` ou `finance_commission_rules`?
2. **Beta pública:** activar Growth Engine e registo aberto na mesma fase?
3. **Contas demo:** manter para PO, remover, ou separar ambiente?
4. **Delegação:** nova tabela overlay ou evoluir papéis actuais?
5. **Contabilista:** papel interno Kuteka vs acesso externo read-only ao dossiê?
6. **Prioridade P0 Prestadores:** confirma doc 2 §28 decisão (não Beta 2 sem rede comercial)?
7. **Founder claim produção:** bloqueia validação §29 e institucional — quando PO executa?

---

## 7. Não implementar ainda (E)

- Pagamentos reais / PSP AO live
- Scraping AGT
- Board/Investor/Auditor cockpits
- Sucessão CEO/Chairman/herança automática
- Legal cockpit completo (antes do dossier)
- ML KAI / job queue
- Reconstrução arquitectura ou remoção funcionalidades 🟢
- Qualquer migration não autorizada

---

## 8. Apenas documentar para futuro (⚪)

- Políticas KUT-POL completas (versão formal)
- Growth campanhas colectivas / sorteios
- Importação massiva inventário
- Assinaturas Prestador P2
- Integração SAF-T completa

---

## 9. Estado FASE 6 — PARAGEM

**Nenhuma alteração de código foi feita nesta entrega.**

Próximo passo **somente após Founder**:

1. Rever este relatório  
2. Corrigir interpretações (`CORRECÇÃO — KUT-XXX`)  
3. Aprovar interpretação global  
4. Autorizar explicitamente: `AUTORIZO: FASE X — [escopo]`  

---

## Apêndice A — Matriz resumida A/B/C/D/E por bloco

| Bloco | A | B | C | D | E |
|-------|---|---|---|---|---|
| Protocolo FASE 0 | — | — | doc | ✓ | — |
| Ecossistema/serviços | ✓ | ✓ | — | — | loop completo |
| Founder OS | ✓ parcial | ✓ | ✓ | ✓ | dashboard monolito |
| Delegação | — | — | ✓ | ✓ | — |
| Identidade §29 | ✓ | ✓ | — | ✓ | sucessão |
| Financeiro/Pay | ✓ | ✓ | ✓ | ✓ | real PSP |
| Dossiês profissionais | ✓ legal static | ✓ | ✓ | ✓ | legal cockpit |
| Compliance/BCP | ✓ docs | ✓ | ✓ | ✓ | — |
| Ops fila/escalação | ✓ | ✓ | — | chat | — |
| Beta/feedback | ✓ parcial | ✓ | ✓ | demo | — |
| Prestadores | ✓ | ✓ | ✓ | P0 scope | ads P1 |
| Growth Engine | share | — | ✓ | ✓ | — |

---

*Relatório produzido em conformidade com FASE 0–6 do documento e instrução do Founder (2026-08-28).*
