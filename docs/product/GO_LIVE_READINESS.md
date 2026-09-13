# Go Live Readiness — Bloco Zero

| Campo          | Valor                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Versão**     | 1.0 (checklist vivo)                                                                                                                          |
| **Data**       | 2026-08-06                                                                                                                                    |
| **Natureza**   | Referência **oficial** de prontidão para abrir a Kuteka ao público — substitui leituras dispersas noutros documentos                          |
| **Governação** | [SPRINT_BETA_CHARTER.md](./SPRINT_BETA_CHARTER.md) — item obrigatório da Sprint Beta 1                                                        |
| **Relação**    | [GO_LIVE_CHECKLIST.md](../backlog/GO_LIVE_CHECKLIST.md) (histórico de execução) · [KOS §8](./KUTEKA_OPERATING_SYSTEM.md) (checklist original) |

---

## Como ler

Este é o **Bloco Zero**: a lista honesta de tudo o que falta, está parcial ou já está pronto para o público poder usar a Kuteka com confiança. É actualizado a cada Sprint Beta — não é um documento de arquitectura, é um espelho de estado.

| Símbolo | Significado                                                          |
| ------- | -------------------------------------------------------------------- |
| 🟢      | Concluído — em produção, verificado                                  |
| 🟡      | Parcial — existe, mas incompleto, sandbox, ou dependente de terceiro |
| 🔴      | Pendente — não iniciado ou bloqueado por decisão/conta externa       |

**Nenhum item aqui bloqueia a Sprint Beta 1** (documental). Os itens 🔴 de Produto/Financeiro/Segurança **bloqueiam a abertura pública alargada** (Sprint Beta 5) e devem ser resolvidos nas Sprints Beta 2–4, pela ordem definida no [Charter §3](./SPRINT_BETA_CHARTER.md#3-sequência-de-sprints-beta-15).

---

## 1. Produto

| Item                                                                                                       | Estado | Nota                                                                              |
| ---------------------------------------------------------------------------------------------------------- | :----: | --------------------------------------------------------------------------------- |
| Core v1.0 congelado (Landing, Auth, Shell, Patrimónios, Habitação, Agente, Admin, Confiança)               |   🟢   | ADR-011; em produção                                                              |
| Contratos + Identidade/KYC self-serve                                                                      |   🟢   | ADR-012, ADR-014; sem vendor eID externo                                          |
| Kuteka Pay — motor unificado (sandbox)                                                                     |   🟢   | Único caminho de pagamento; adaptadores reais inactivos                           |
| Marketplace + serviços D1–D5 (ciclo completo)                                                              |   🟢   | Sandbox — dinheiro simulado                                                       |
| Feature flags no Super Admin                                                                               |   🟢   | Config-first, já em uso                                                           |
| KOCC — controlo de estado público por módulo (Beta/Acesso antecipado/Disponível em breve/Comercial activo) |   🟢   | MVP em `/app/super` → KOCC; migration `0032` (aplicar no Supabase remoto)         |
| KOCC — Painel Beta (métricas + feedback/bugs)                                                              |   🟡   | UI + migration `0035` no código; aplicar no Supabase remoto                       |
| Aprovação de publicações + Founders (Trust Governance)                                                     |   🟡   | Sprint Beta 1.6 Fase A — migration `0036`; **gate antes da Beta 2**               |
| Upload real de documentos de Confiança                                                                     |   🔴   | Hoje apenas notes/metadata                                                        |
| i18n cobertura total de módulos comerciais                                                                 |   🟡   | Fichas/badges/heroes/hubs localizados (Sprint 1.5B); metadata de páginas ainda PT |

## 2. Jurídico

| Item                                                        | Estado | Nota                                            |
| ----------------------------------------------------------- | :----: | ----------------------------------------------- |
| Termos de Utilização v1.0 Beta publicados                   |   🟢   | `/termos` + PDF/Word                            |
| Política de Privacidade v1.0 Beta publicada                 |   🟢   | `/privacidade` + PDF/Word                       |
| Política de Cookies v1.0 Beta                               |   🟢   | `/cookies` + PDF/Word + Markdown                |
| Revisão jurídica externa (Termos/Privacidade/Cookies)       |   🔴   | Recomendada; não realizada                      |
| Decisão explícita: escrow desligado (`custody_mode = none`) |   🟢   | Documentado em Termos + Arquitectura Financeira |
| Conformidade fiscal AGT / SAF-T                             |   🔴   | Fase E da doc financeira; não iniciada          |

## 3. Financeiro / Canais

| Item                                                  | Estado | Nota                                                                                 |
| ----------------------------------------------------- | :----: | ------------------------------------------------------------------------------------ |
| Ledger financeiro (schema + UI Super/Hub)             |   🟢   | Entradas imutáveis, créditos, reembolsos                                             |
| Kuteka Pay — engine e intents                         |   🟢   | Sandbox único activo                                                                 |
| Conta comercial Multicaixa e/ou EMIS                  |   🔴   | **Bloqueador nº1** de receita real (Roadmap P0)                                      |
| Webhooks + reconciliação bancária real                |   🔴   | Depende da conta comercial                                                           |
| Email transaccional (pagamentos, KYC, contratos, SLA) |   🟡   | SMTP cobre autenticação (Supabase Auth); **sem templates transaccionais de negócio** |
| SMS / OTP telefone (fornecedor Angola)                |   🟡   | Arquitectura pronta; fornecedor não contratado                                       |
| Billing recorrente da Garantia Kuteka                 |   🔴   | Activação hoje é mensal/sandbox                                                      |

## 4. Operações

| Item                                                     | Estado | Nota                                                    |
| -------------------------------------------------------- | :----: | ------------------------------------------------------- |
| KOS v1.0 escrito (org, papéis, SLA, KPIs, manuais D1–D5) |   🟢   | Documento aprovado                                      |
| Filas D1–D5 + Marketplace operacionais                   |   🟢   | Ciclo sandbox completo                                  |
| SLA/KPIs medidos em regime real e continuado             |   🔴   | KOS existe no papel; medição semanal ainda não iniciada |
| Plantão / cobertura Assistência 24h                      |   🔴   | "24h" hoje é melhor esforço em horário comercial        |
| Cron SLA em produção                                     |   🟡   | RPCs existem; agendamento a confirmar                   |

## 5. Comercial / Documentação

| Item                                                                 | Estado | Nota                                                                         |
| -------------------------------------------------------------------- | :----: | ---------------------------------------------------------------------------- |
| Manual do Utilizador v1.0 Beta                                       |   🟢   | `/app/ajuda` + PDF/Word                                                      |
| Centro de Ajuda — fontes FAQ/Glossário/Novidades/Estado dos Serviços |   🟢   | Publicadas nesta Sprint Beta 1 (`docs/help/`)                                |
| Integração dessas fontes na UI (`/app/ajuda`, `/documentacao`)       |   🟢   | Centro de Documentação Kuteka operativo                                      |
| Página / mensagem oficial de "o que é a Beta" (incluído/excluído)    |   🟡   | Parcial via Novidades + Estado dos Serviços; página dedicada opcional        |
| Canal oficial de suporte com horário publicado                       |   🟡   | Email existe (`contacto@kutekalink.com`); horário/SLA de resposta a publicar |

## 6. Empresa

| Item                                                      | Estado | Nota                                                 |
| --------------------------------------------------------- | :----: | ---------------------------------------------------- |
| Estrutura organizacional descrita (departamentos, papéis) |   🟢   | KOS §1–§2                                            |
| Equipa mínima cobrindo departamentos (chapéus empilhados) |   🟡   | Modelo aceite pelo KOS; cobertura real por confirmar |
| Marca e domínio institucional                             |   🟢   | kutekalink.com                                       |
| Contas bancárias / comerciais para operação real          |   🔴   | Depende do gateway (ver §3)                          |

## 7. Segurança

| Item                                                      | Estado | Nota                                                                                                                                            |
| --------------------------------------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS + papéis (`finance.manage` etc.)                      |   🟢   | Implementado; revisão de detalhe recomendada antes do público                                                                                   |
| Centro de Segurança / OTP dual                            |   🟢   | ADR-026                                                                                                                                         |
| Contas `demo.*@kuteka.local` fora do caminho crítico      |   🟡   | Inventário interno permitido; etiqueta pública é “Beta” (nunca “Demo”); ban/remoção de contas demo de login público = Sprint Beta 2             |
| Privacidade do storage (`property-media`, documentos KYC) |   🟡   | Decisão de privacidade por confirmar                                                                                                            |
| Backup Supabase verificado + restore testado              |   🔴   | Ver [BUSINESS_CONTINUITY_PLAN_v0.9.md](../operations/BUSINESS_CONTINUITY_PLAN_v0.9.md) — processo definido, execução/verificação ainda pendente |
| Alertas de falha de deploy / 5xx / intents Pay falhados   |   🔴   | Monitorização mínima ainda não activa                                                                                                           |

---

## Leitura conservadora

Esta checklist confirma a leitura do [Sprint Beta Charter §5](./SPRINT_BETA_CHARTER.md#5-cinco-indicadores-de-progresso): **Produto e Jurídico** têm a maior proporção de 🟢; **Financeiro/Canais**, **Operações** e **Segurança** concentram os 🔴. A Sprint Beta 1 fecha a base documental + KOCC + Centro de Docs. O **Beta Público controlado** (Sprint Beta 2) depende de aplicar migration `0032`, estabilizar e convidar utilizadores — não de Multicaixa. Receita real (Sprint Beta 5) depende dos 🔴 de gateway/canais (Sprints Beta 4–5).

## Controlo de alterações

| Versão | Data       | Notas                                                       |
| ------ | ---------- | ----------------------------------------------------------- |
| 1.0    | 2026-08-06 | Primeira publicação — Bloco Zero oficial, Sprint Beta 1     |
| 1.1    | 2026-08-06 | KOCC MVP, Cookies page e Centro de Documentação marcados 🟢 |

**Próxima revisão:** ao fechar cada Sprint Beta (Charter §3), reavaliar todos os itens 🟡/🔴.
