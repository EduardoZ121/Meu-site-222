# PRD-001 — Engineering Gate

**Documento:** Avaliação técnica final de prontidão para implementação  
**Módulo:** Autenticação & Gestão de Utilizadores  
**PRD oficial:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` (**v1.0** — Aprovação Funcional 2026-07-30)  
**Gate de fase prévio:** `docs/backlog/PHASE_GATE_BEFORE_PRD001.md`  
**Metodologia:** `docs/engineering/DEVELOPMENT_PROCESS.md` (Fase 1 ≠ Fase 2)  
**Estado:** ✅ Gate **VERDE** (histórico) · Módulo PRD-001 **N5 concluído** — `PRD_001_CLOSURE.md`  
**Maturidade deste documento:** Histórico de prontidão — P1/P2 cumpridos; implementação encerrada 2026-07-31

---

## 0. Objectivo

Confirmar, de forma objectiva, se o ambiente e os pré-requisitos técnicos permitem emitir a **Autorização de Implementação** do PRD-001.

Este documento **não** altera requisitos de negócio. Consolida o **Gate 16.1** e dependências de infraestrutura.

---

## 1. Meta da avaliação

### Documentos / evidências consultados

| Fonte                                               | Uso                                                      |
| --------------------------------------------------- | -------------------------------------------------------- |
| `PRD_001_AUTHENTICATION_SPEC.md` §16.1              | Critérios pré-código oficiais                            |
| `PHASE_GATE_BEFORE_PRD001.md`                       | Pendências infra históricas                              |
| `DEPLOY_STATUS_2026-07-30.md`                       | Domínio / Pages / Render                                 |
| `docs/engineering/github-workflows/ci.yml` + README | CI definido mas activação                                |
| `.github/workflows/` no repo                        | Só `deploy.yml` presente (sem `ci.yml` activo)           |
| `supabase/migrations/0001_*.sql`, `0002_*.sql`      | Migrations no repo                                       |
| `ADR-001`, `ADR-003`, P0 reports                    | Fundação + RBAC/audit                                    |
| `gh run list` (2026-07-30)                          | Deploy Kuteka / Pages verdes; sem workflow CI de quality |

### Verificações realizadas

1. Checklist §16.1 item a item.
2. Presença real de workflow CI no remote vs ficheiro-fonte em `docs/engineering/`.
3. Estado documental da migration `0002` (existe no repo; aplicação no **remoto** não verificável daqui sem credenciais Supabase).
4. Domínio `kutekalink.com` vs Landing em `gh-pages`.
5. Separação Aprovação Funcional (já concedida) vs Autorização de Implementação (condicional §12; activa com P1+P2).

---

## 2. Itens concluídos

| ID  | Item                                                                 | Evidência                                                  |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| C1  | Fundação KEOS (monorepo, packages, Landing) em `main`                | PHASE_GATE §1                                              |
| C2  | P0 técnico (RBAC + audit) aprovado e em `main`                       | ADR-003, P0 reports                                        |
| C3  | Migration `0002` **escrita e versionada** no repo                    | `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql` |
| C4  | Spec PRD-001 **Aprovação Funcional** oficial                         | PO 2026-07-30 · v1.0                                       |
| C5  | Critérios de aceitação, R1–R12, L\*, wireframes                      | PRD §§15–18                                                |
| C6  | Publish path Landing → `gh-pages` operativo                          | Deploy Kuteka verde                                        |
| C7  | Workflow de **deploy** Pages activo                                  | `.github/workflows/deploy.yml`                             |
| C8  | Definição do workflow CI (lint/typecheck/test/build/smoke)           | `docs/engineering/github-workflows/ci.yml`                 |
| C9  | Script de activação CI documentado                                   | `scripts/enable-github-ci.sh` + README workflows           |
| C10 | Baseline de qualidade local verde (lint · format · typecheck · test) | Verificado pelo Líder Técnico; prepara P1                  |

---

## 3. Itens pendentes (bloqueiam Autorização de Implementação)

| ID  | Item                                                                                              | Severidade                                                                  | Notas                                                                     |
| --- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| P1  | Activar `.github/workflows/ci.yml` no remote e obter pipeline **verde**                           | ✅ **Fechado** (2026-07-31)                                                 | Evidência §8.1 — run verde em `main`                                      |
| P2  | Aplicar migration `0002` no **Supabase remoto** (ambientes relevantes)                            | ✅ **Fechado** (2026-07-31)                                                 | Evidência §8.2 — projecto `vhqwitbrpqaiutjbundo`                          |
| P3  | Autorização de Implementação (Fase 2)                                                             | **Condicional ✅** (PO 2026-07-30)                                          | Activa-se automaticamente com P1+P2 evidentes (§12); sem nova confirmação |
| P4  | Templates de email Auth (verify / reset) com marca Kuteka + redirect URLs allowlisted no Supabase | **Bloqueante para go-live auth**; desejável antes de começar UI se possível | Ops Supabase (§16.1 / §5.3)                                               |
| P5  | `kutekalink.com` a servir Landing KEOS (DNS / Render)                                             | **Não bloqueante** para começar código auth em preview                      | Bloqueia experiência pública coerente; ver DEPLOY_STATUS                  |

---

## 4. Riscos remanescentes

| Risco                              | Impacto                                   | Mitigação                              |
| ---------------------------------- | ----------------------------------------- | -------------------------------------- |
| Implementar sem CI                 | Regressões sem rede de segurança          | Fechar P1 antes de qualquer PR de auth |
| Implementar sem `0002` remoto      | RPCs RBAC/audit em falta → falhas runtime | Fechar P2; verificar com checklist P0  |
| Email Auth mal configurado         | Utilizadores presos em F2/F5              | P4 antes de testes e2e reais           |
| Domínio ainda no legado Vite       | Confusão de produto / QA em URL pública   | P5 em paralelo (ops)                   |
| Scope `workflow` indisponível      | CI permanece só em `docs/engineering/`    | Acção manual humana no GitHub          |
| Credenciais Supabase / GoDaddy 401 | Ops não automatizável daqui               | Acção manual no dashboard              |

---

## 5. Dependências externas

| Dependência                                            | Owner típico     | Estado                                 |
| ------------------------------------------------------ | ---------------- | -------------------------------------- |
| GitHub token com scope `workflow` / Workflows write    | Ops / admin repo | ✅ P1 fechado (UI + CI verde)          |
| Projecto Supabase (remoto) + permissão para migrations | Ops / backend    | ⏳ Necessário para P2 / P4             |
| DNS GoDaddy ou reparação Render                        | Ops              | ⏳ P5 (não bloqueia código em preview) |
| Autorização PO Fase 2 (condicional)                    | Product Owner    | ✅ Pré-emitida (§12); activa com P1+P2 |

---

## 6. Mapa Gate 16.1 (PRD)

| Critério §16.1                                               | Estado                                  |
| ------------------------------------------------------------ | --------------------------------------- |
| Spec integralmente aprovada (Blocos 1–4 + aprovação oficial) | ✅ **Aprovação Funcional** concedida    |
| CI definitivamente activo e verde                            | ❌ Pendente (P1)                        |
| Migration `0002` aplicada no remoto                          | ❌ Não confirmado (P2)                  |
| Autorização de implementação                                 | ⏳ Condicional (§12) — activa com P1+P2 |
| Templates email + redirect allowlist Supabase                | ❌ Pendente (P4)                        |

**Conclusão parcial:** a metade **funcional** do gate está fechada; a metade **técnica/ops** está aberta.

---

## 7. Recomendação técnica final

| Pergunta                                    | Resposta                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| O PRD-001 está aprovado funcionalmente?     | **Sim** — referência oficial                                               |
| O Engineering Gate está pronto para fechar? | **Não** — falta P2 (P1 ✅)                                                 |
| Pode iniciar-se a implementação agora?      | **Não** — falta evidência P2 (autorização condicional já emitida)          |
| Recomendação                                | Fechar **P2** (§8.2). Autorização já pré-emitida (§12) — activa-se com P2. |

---

## 8. Plano para fechar o Gate (ordem sugerida)

> **Regra:** não contornar P1/P2; não alterar o estado do Gate para “verde” sem verificação objectiva.

### 8.1 P1 — Activar CI (bloqueante) — ✅ FECHADO

**Evidência objectiva (2026-07-31):**

| Campo      | Valor                                                               |
| ---------- | ------------------------------------------------------------------- |
| Run URL    | https://github.com/EduardoZ121/Site_Angola/actions/runs/30608090273 |
| Commit SHA | `2e067a004e9f99cc53a9598c1129585532d01144`                          |
| Data       | 2026-07-31                                                          |
| Workflow   | `.github/workflows/ci.yml` (registado; job quality verde em ~1m31s) |

Notas: ficheiro criado via UI GitHub; falhas iniciais de pnpm/turbo/prettier corrigidas em commits subsequentes na `main` (`add88d9`…`2e067a0`). `scripts/check-gate-p1.sh` → exit 0.

### 8.2 P2 — Migration `0002` no Supabase remoto (bloqueante)

1. Abrir o projecto Supabase de destino (staging/prod conforme política).
2. Aplicar `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql` (SQL Editor ou CLI `supabase db push`).
3. Validar `docs/security/AUDIT_LOGS_CHECKLIST.md` (RBAC + audit). Auxílio: `scripts/verify-p0-migration.sql`.
4. Registar neste documento → marcar P2 ✅:

| Campo        | Valor      |
| ------------ | ---------- |
| Project ref  | _pendente_ |
| Data         | _pendente_ |
| Aplicado por | _pendente_ |
| Checklist    | _pendente_ |

Última re-verificação objectiva P2 (Líder Técnico): **2026-07-31 21:50 UTC** — ✅

| Campo              | Valor                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Project ref        | `vhqwitbrpqaiutjbundo`                                                                   |
| Região             | `eu-west-1`                                                                              |
| Migrations         | `0001` · `0002` · `0003` aplicadas via `supabase db push`                                |
| Seed roles         | `0001_roles.sql` (client, patrimonial_partner, certified_agent, administrator)           |
| Site URL Auth      | `https://kutekalink.com`                                                                 |
| Redirect allowlist | `https://kutekalink.com/**`, `www`, `localhost:3000`                                     |
| GitHub Secrets     | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Runtime            | `kuteka-config.js` com URL+anon (chave pública)                                          |

### 8.3 Paralelo (não fecha o Gate sozinho)

3. **P4:** templates Auth (verify/reset) + redirect URLs allowlisted.
4. **P5:** DNS `kutekalink.com` → GitHub Pages (não bloqueia começar código _após_ Fase 2, bloqueia QA na URL pública).

### 8.4 Após P1+P2 ✅ (Autorização de Implementação já pré-emitida)

Decisão PO (2026-07-30): **assim que P1 e P2 tiverem evidência objectiva neste Gate, a Autorização de Implementação considera-se emitida** — sem nova confirmação intermédia.

5. Actualizar este documento (P1/P2 ✅ + evidências nas tabelas §8.1–§8.2).
6. Marcar Gate como **verde** e Fase 2 como **activa**.
7. Activar `docs/backlog/PRD_001_IMPLEMENTATION_READINESS.md`.
8. Abrir branch `cursor/prd-001-authentication-f96b` e implementar até conclusão do módulo (N5), em autonomia.
9. Interromper só por decisão de negócio, alteração estratégica ou risco crítico.

---

## 9. Autoavaliação do Arquitecto — Engineering Gate PRD-001

| Campo                               | Conteúdo                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Nível de maturidade**             | Diagnóstico **aprovado** · Gate operacional **aberto** (não N4)                                             |
| **Nível de confiança**              | **92%** (diagnóstico); prontidão para implementar **~55%** (P1 ✅; falta P2)                                |
| **Factores < 95% (diagnóstico)**    | (1) `0002` remoto não verificável daqui. (2) Templates Auth desconhecidos. (3) Domínio público desalinhado. |
| **Principais riscos remanescentes** | Implementar sem `0002` remoto; RPC em falta                                                                 |
| **Dívidas técnicas ou documentais** | Evidência P2; Manual/Blueprint/DS fora do repo                                                              |
| **Decisões adiadas**                | ADR-004 na fase de código                                                                                   |
| **Recomendação**                    | Manter Gate **aberto** até P2. Não implementar auth até P2 ✅.                                              |

---

## 10. Estado resumido

| Dimensão                         | Estado                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| Aprovação Funcional PRD-001      | ✅ Oficial                                                      |
| Diagnóstico Engineering Gate     | ✅ **Aprovado pelo PO** (2026-07-30)                            |
| Engineering Gate (fecho / verde) | ▶️ **Aberto** — P1 ✅ · aguarda P2                              |
| Autorização de Implementação     | ⏳ Condicional (§12) — aguarda P2                               |
| Maturidade do módulo auth        | Pré-N4                                                          |
| Papel técnico                    | Arquitecto Principal + Líder Técnico (`DEVELOPMENT_PROCESS.md`) |

**Próximo passo lógico:** fecho operacional de **P2** (Supabase remoto). Checklist: `docs/backlog/PO_ACTION_P1_P2.md` §P2. Com P2 ✅: Gate verde → readiness → implementar auth até N5 (§12).

---

## 11. Tecto da autonomia técnica (2026-07-30)

O Líder Técnico esgotou o trabalho **seguro e útil** que pode fazer **sem** contornar P1/P2 e **sem** Autorização de Implementação:

| Feito sob autonomia                                         | Estado |
| ----------------------------------------------------------- | ------ |
| Spec PRD-001 Aprovação Funcional + blocos 1–4               | ✅     |
| Metodologia (duas fases, N1–N5, autonomia permanente)       | ✅     |
| Diagnóstico Engineering Gate + runbooks P1/P2               | ✅     |
| Índice docs, CONTRIBUTING, ADR-004 diferido, readiness pack | ✅     |
| Qualidade local (lint / format / typecheck / test)          | ✅     |
| Correcções de consistência / legado / naming                | ✅     |
| Tentativa P1/P2 + documentação de limites (§13)             | ✅     |
| Confirmação PO: P1/P2 só credenciais; sem contornar (§14)   | ✅     |
| Content inventory + protocolo `on-prd001-gate-green.sh`     | ✅     |

| Bloqueado fora desta autonomia         | Owner                                               |
| -------------------------------------- | --------------------------------------------------- |
| P1 — activar CI (`workflow` scope)     | ✅ Fechado 2026-07-31 (§8.1)                        |
| P2 — aplicar `0002` no Supabase remoto | PO / Ops (credenciais) — **não contornar** (§14)    |
| P3 — Autorização de Implementação      | ✅ Condicional (§12); activa com P1+P2              |
| P4/P5 — templates Auth / DNS           | Ops (P4 desejável; P5 não bloqueia código pós-Gate) |
| Código do módulo auth                  | Bloqueado até Gate verde                            |

**Paralelo permitido (§14):** docs, scripts de verificação, qualidade, consistência — sem alterar D1–D12 / arquitectura aprovada.

**Próximo passo do projecto:** PO aplica **P2** no Supabase → evidência §8.2 → Gate verde → readiness → implementar até N5.

Até P2 com evidência: **nenhum código** de auth. Com P1+P2 ✅: iniciar implementação de imediato (autorização já dada).

---

## 12. Autorização de Implementação condicional (PO 2026-07-30)

O Product Owner:

1. Confirma o estado actual e o tecto autónomo atingido.
2. Mantém o Engineering Gate **aberto** até P1 e P2 objectivos.
3. **Proíbe** iniciar implementação antes de P1+P2.
4. **Emite desde já** a Autorização de Implementação sob condição:
   > Quando existirem evidências objectivas de P1 e P2 neste documento, a autorização para iniciar a implementação do PRD-001 considera-se emitida **sem nova confirmação intermédia**.
5. Nesse momento o Líder Técnico deve: activar o Implementation Readiness Pack, implementar conforme PRD-001 v1.0, e seguir autonomamente até à conclusão do módulo.
6. Interromper só se surgir decisão de negócio, alteração estratégica ou risco crítico.

| Item                              | Estado                          |
| --------------------------------- | ------------------------------- |
| Autorização condicional registada | ✅ 2026-07-30                   |
| Condição                          | P1 ✅ + P2 ✅ (evidência em §8) |
| Implementação agora               | ❌ (condição não cumprida)      |

---

## 13. Tentativa autónom “faça você mesmo” (2026-07-30)

Pedido do PO: executar P1/P2 sem esperar passos manuais. O Líder Técnico esgotou as vias disponíveis neste ambiente Cloud:

| Tentativa                                             | Resultado                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `./scripts/enable-github-ci.sh` + commit `ci.yml`     | ✅ Local                                                        |
| `git push` com PAT EduardoZ121                        | ❌ Rejeitado — falta scope **`workflow`** (só `repo`)           |
| Push / Contents API com token `cursor[bot]`           | ❌ 403 — sem permissão no repo                                  |
| Secrets GitHub do repo                                | Só `RENDER_DEPLOY_HOOK_URL` — sem Supabase                      |
| Env Cloud (`SUPABASE_*`, `.env.local`)                | Placeholders / ausentes                                         |
| Docker + Supabase local como proxy de P2              | Docker **não instalado**; P2 exige **remoto** de qualquer forma |
| Render API (`RENDER_API_KEY`) / GoDaddy (`GODADDY_*`) | **401 Unauthorized** — credenciais inválidas ou expiradas       |
| Marcar P1/P2 ✅ sem evidência                         | **Recusado** (regra do Gate)                                    |

**Conclusão:** o tecto autónomo para fechar o Gate **foi atingido**. P1 e P2 só fecham com acção humana mínima documentada em `docs/backlog/PO_ACTION_P1_P2.md` (estimativa: poucos minutos com PAT `workflow` + acesso SQL Supabase).

Após o PO colar evidências em §8.1–§8.2 (ou o Líder Técnico as verificar via API), a implementação arranca sem nova confirmação.

---

## 14. Confirmação PO — bloqueios só de credenciais (2026-07-30)

O Product Owner confirma que a tentativa autónom (§13) foi correcta: limitações documentadas, sem evidências inventadas, sem contornar o Gate.

**Ordens permanentes a partir desta confirmação:**

1. **Não** procurar mais contornar P1 nem P2.
2. Tratar P1 e P2 como dependências **exclusivas** de credenciais / infraestrutura (owner: PO/Ops).
3. O PO trata da obtenção das permissões (`workflow` + Supabase remoto).
4. Assim que as evidências estiverem disponíveis: actualizar este Gate (§8.1–§8.2 → ✅), activar automaticamente `PRD_001_IMPLEMENTATION_READINESS.md`, e **iniciar a implementação** do PRD-001 sob a autorização condicional §12 — **sem nova confirmação**.
5. Entretanto: continuar autonomamente em trabalho que **não** dependa dessas credenciais e acrescente valor, **sem** alterar decisões de negócio nem a arquitectura aprovada, e **sem** código do módulo auth.

| Item                       | Estado                                      |
| -------------------------- | ------------------------------------------- |
| Contornar P1/P2            | ❌ Proibido (ordem PO)                      |
| Owner P1/P2                | PO / Ops (credenciais)                      |
| Trabalho autónomo paralelo | ✅ Docs, scripts, qualidade, consistência   |
| Código auth até Gate verde | ❌ (superseded by §15 — P2 diferido)        |
| Pós-evidência P1+P2        | Gate verde → readiness → implementar até N5 |

---

## 15. PO 2026-07-31: P2 diferido para arranque de implementação

O Product Owner **diferiu** P2 (aplicação remota da migration `0002`) para **autorizar o arranque de implementação** do PRD-001 agora.

| Item                          | Decisão                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| P1 CI                         | ✅ Verde — condição satisfeita                                                               |
| P2 migration `0002` no remoto | ❌ **Não** marcado ✅ — permanece pendente de ops                                            |
| Autorização de código auth    | ✅ **Emitida** sob este deferimento (2026-07-31)                                             |
| P2 antes de go-live           | **Obrigatório** — e2e real com backend / produção auth exige P2 aplicado e evidência em §8.2 |
| UI sem Supabase               | Deve renderizar; submits devolvem erros guiados (R2), sem crash                              |

**Implica:**

1. Implementation Readiness Pack → **Activo**
2. Branch `cursor/prd-001-authentication-f96b` pode implementar o módulo conforme PRD-001 v1.0
3. Migration `0003` (`activate_self_serve_roles`) versionada no repo; aplicação remota alinhada a P2/ops
4. **Não** tratar o Gate como verde completo até P2 ter evidência objectiva

| Item                      | Estado                  |
| ------------------------- | ----------------------- |
| P2 diferido para arranque | ✅ Registado 2026-07-31 |
| P2 no Gate                | Continua ❌ (ops)       |
| Código auth               | Autorizado agora        |
