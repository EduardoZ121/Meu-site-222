# Fase 3 — Spec funcional: Shell da Plataforma

**Documento:** Especificação funcional para Aprovação Funcional  
**Versão:** 1.0  
**Estado:** ✅ Aprovação Funcional · ✅ Autorização §12 · ✅ Implementação N5  
**Maturidade:** **N5** · Encerramento: `docs/backlog/PHASE_3_CLOSURE.md`  
**Depende de:** PRD-001 N5 · baseline `docs/PROJECT_BASELINE_PRD001.md` (congelada)  
**Preparação:** `docs/backlog/PHASE_3_PLATFORM_SHELL_PREP.md`  
**Autoridade:** Manual > Blueprint > Design System Nº 003 > PASSO 0 > `AI_CONTEXT` > esta spec  
**Seguinte após encerramento:** PRD-002 — Parceiro Patrimonial

---

## 0. Registo de autorização

| Item                                     | Estado                          |
| ---------------------------------------- | ------------------------------- |
| Baseline PRD-001                         | ✅ Congelada / aprovada pelo PO |
| Elaboração desta spec                    | ✅ Autorizada (foco Fase 3)     |
| Aprovação Funcional (Fase 1 do processo) | ✅ PO 2026-07-31 — D1–D12       |
| Autorização de Implementação (Fase 2)    | ✅ Condicional §12 activada     |
| Implementação                            | ✅ N5 — `PHASE_3_CLOSURE.md`    |

---

## 1. Problema e objectivo

### 1.1 Problema

Após o PRD-001, o utilizador entra num stub `/app` com chrome mínimo. Falta o **esqueleto estável** da plataforma onde os módulos de negócio (a partir do PRD-002) serão montados — sem redesenhar auth e sem prometer produto inexistente.

### 1.2 Objectivo

Entregar o **Shell autenticado** da Kuteka:

1. Layout profissional (Sidebar + Topbar + Main) coerente com `AI_CONTEXT` §9
2. Identidade Kuteka sempre visível (BrandMark)
3. Contexto de sessão (nome, email, papéis, logout)
4. Navegação preparada para módulos futuros, **sem activar** funcionalidades fora de âmbito
5. Home `/app` como conteúdo dentro do Shell (evolução do stub, não regressão auth)
6. Zero regressão nos fluxos F1–F6 do PRD-001

### 1.3 Não-objectivos (fora de âmbito)

- Activar Património, listagens, contratos, pagamentos, wallet
- Passaporte Digital, SCK, KTK Score, KAI (presença/dock)
- Command palette, notificações, busca global
- Mudança de “dashboard por papel” (ainda não há dashboards)
- OAuth / MFA / novos fluxos auth
- Melhorias cosméticas isoladas do PRD-001 fora do Shell

---

## 2. Princípios (herdados e específicos)

| #   | Princípio                                                                                  |
| --- | ------------------------------------------------------------------------------------------ |
| P1  | Conta única multi-papel (PRD-001) — o Shell **mostra** papéis; não cria segunda identidade |
| P2  | Um ecrã = uma missão — o Shell enquadra; o conteúdo da página decide a missão              |
| P3  | Não mentir sobre disponibilidade — itens futuros = “Em breve”, não links activos falsos    |
| P4  | Static-export safe — compatível com `prebuilt` / Render / gh-pages e sessão `kuteka-auth`  |
| P5  | Baseline PRD-001 intocável excepto bug crítico de funcionamento                            |
| P6  | Sem Passaporte / KAI / SCK na UI desta fase                                                |
| P7  | Mobile first; WCAG 2.2 AA nos controlos do Shell                                           |

---

## 3. Decisões candidatas (D1–D12)

Pedidos de **Aprovação Funcional** — aprovar em bloco ou assinalar reservas.

| ID      | Decisão candidata                                                                                                                  | Notas                                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **D1**  | Layout oficial = **Sidebar (desktop) + Topbar + Main**. Sem painel de widgets KAI nesta fase.                                      | Alinha `AI_CONTEXT` §9; KAI adiado                            |
| **D2**  | Destino pós-auth permanece **`/app`** (home dentro do Shell).                                                                      | Continuidade PRD-001 R1/R3                                    |
| **D3**  | Nav primária **única** (não muda de itens por papel no MVP do Shell). Papéis influenciam **badges/contexto**, não menus paralelos. | Evita over-build antes de PRD-002                             |
| **D4**  | Itens de nav MVP: ver §5.1                                                                                                         | Placeholders “Em breve” excepto Início (+ Admin se permissão) |
| **D5**  | `/app/admin` continua gated por `admin.panel`; link Admin só se permitido.                                                         | Herança PRD-001                                               |
| **D6**  | Topbar: Brand (mobile) / título da área · identidade do utilizador · papéis · Terminar sessão. **Sem** busca nem sino nesta fase.  | Simplicidade                                                  |
| **D7**  | Sidebar colapsável em viewport estreita (drawer / overlay); Topbar sempre presente autenticado.                                    | Mobile first                                                  |
| **D8**  | Home `/app` mantém secções: boas-vindas, estado da conta, papéis, próximos módulos — **reorganizadas** dentro do Main do Shell.    | Evolução do stub QA-002                                       |
| **D9**  | CTA “Actualizar o meu nome” permanece (rota onboarding perfil já existente).                                                       | Sem novo módulo                                               |
| **D10** | Rotas `(auth)` **fora** do Shell (ecrãs full-bleed auth mantêm-se).                                                                | Separação clara                                               |
| **D11** | Nenhuma migration Supabase nova obrigatória para o Shell.                                                                          | Só UI + estrutura                                             |
| **D12** | Após Aprovação Funcional, aplica-se Autorização de Implementação **condicional** §12 (mesmo modelo PRD-001).                       | Velocidade com controlo                                       |

---

## 4. Arquitectura de informação

### 4.1 Áreas da UI

```
┌────────────┬────────────────────────────────────────────┐
│  Sidebar   │  Topbar                                    │
│            │  Brand · Utilizador · Papéis · Sair        │
│  Nav       ├────────────────────────────────────────────┤
│  Início    │  Main                                      │
│  … Em breve│  Conteúdo da rota (/app, /app/admin, …)    │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

Mobile:

```
┌────────────────────────────────────────────┐
│ Topbar  [☰] Brand · Utilizador · Sair      │
├────────────────────────────────────────────┤
│ Main                                       │
│ (Drawer abre Sidebar por cima)             │
└────────────────────────────────────────────┘
```

### 4.2 Relação com auth

| Zona          | Shell?                           |
| ------------- | -------------------------------- |
| `/auth/*`     | Não — AuthShell actual (PRD-001) |
| `/` marketing | Não                              |
| `/app/*`      | **Sim** — Platform Shell         |

Sessão: reutilizar `AppShell` gate + `AppSession` / `kuteka-auth` (baseline). Evoluir o chrome actual para Sidebar+Topbar+Main **sem** mudar o contrato de sessão.

---

## 5. Navegação

### 5.1 Itens MVP (candidatos D4)

| Item              | Estado      | Destino / comportamento                                  |
| ----------------- | ----------- | -------------------------------------------------------- |
| **Início**        | Activo      | `/app`                                                   |
| **Patrimónios**   | Em breve    | Não navega; indicação visual desactivada                 |
| **Confiança**     | Em breve    | Idem                                                     |
| **Habitação**     | Em breve    | Idem                                                     |
| **Administração** | Condicional | `/app/admin` só com `admin.panel`; oculto caso contrário |

Ordem visual: Início → Patrimónios → Confiança → Habitação → (Administração).

Copy de estado desactivado: **«Em breve»** (já usado na baseline `/app`).

### 5.2 Itens explicitamente adiados

Receitas, Visitas, Propostas, Contratos, Pagamentos, Documentos, Passaporte, Score, Notificações, KAI, Command Palette, “Actuar como…”, Favoritos, Agenda — **não** entram na nav do Shell MVP.

### 5.3 Multi-papel

- Mostrar **todos** os papéis activos do utilizador (badges), como hoje.
- **Não** implementar switch de contexto de dashboard nesta fase.
- Quando PRD-002+ existirem, poderá filtrar-se conteúdo; a nav base permanece estável (D3).

---

## 6. Rotas

| Rota               | Papel no Shell                                      |
| ------------------ | --------------------------------------------------- |
| `/app`             | Home autenticada (Main)                             |
| `/app/admin`       | Stub admin (Main), gate `admin.panel`               |
| Futuras `/app/...` | Montam no Main; Shell partilhado via `(app)/layout` |

Allowlist `next` (PRD-001 R3) **inalterada** salvo necessidade crítica.

---

## 7. Conteúdo da home (`/app`)

Missão do ecrã: confirmar entrada na plataforma e orientar para o que vem a seguir.

Elementos (continuidade QA Review 002):

1. Título da área + boas-vindas (nome; email separado)
2. Cartão / secção Estado da conta
3. Cartão / secção Papéis activos
4. Secção Próximos módulos (itens desactivados)
5. CTAs: Voltar à Landing · Actualizar o meu nome

O Shell **não** duplica logout na home se já estiver na Topbar (pode manter atalho discreto — decisão de implementação, não de negócio).

---

## 8. Estados e erros

| Estado                            | Comportamento                                                      |
| --------------------------------- | ------------------------------------------------------------------ |
| Sem sessão                        | Gate actual → CTA Entrar (sem Shell completo)                      |
| Config Supabase ausente           | Mensagem guiada (baseline)                                         |
| A carregar sessão                 | Skeleton / “A carregar…” no chrome mínimo com Brand                |
| Falha ao carregar perfil/papéis   | Erro específico no Main; Brand + Sair acessíveis se sessão existir |
| Sem `admin.panel` em `/app/admin` | Mensagem forbidden (baseline)                                      |
| Item “Em breve”                   | Não navega; foco teclado não activa rota falsa                     |

---

## 9. Critérios de aceitação

### 9.1 Funcionais

- [ ] Utilizador autenticado vê Sidebar + Topbar + Main em `/app` e `/app/admin`
- [ ] BrandMark (símbolo + KUTEKA) visível no Shell
- [ ] Nome (ou fallback), papéis e Terminar sessão acessíveis na Topbar
- [ ] Início navega para `/app`
- [ ] Patrimónios / Confiança / Habitação visíveis como Em breve e **não** activam rotas de produto
- [ ] Link Administração só com `admin.panel`
- [ ] Fluxos F1–F6 do PRD-001 sem regressão
- [ ] Static export + Deploy Kuteka continuam viáveis

### 9.2 UX / a11y

- [ ] Drawer mobile operável por teclado e dismissível
- [ ] Contraste e alvos de toque alinhados ao DS
- [ ] Motion ≤ 250 ms; respeitar `prefers-reduced-motion` quando houver animação
- [ ] Sem copy Passaporte / KAI / SCK

### 9.3 Documentação

- [ ] ADR-005 (Shell) após Autorização de Implementação
- [ ] Baseline PRD-001 referenciada; CONTINUIDADE / AI_CONTEXT actualizados

---

## 10. Wireframes textuais

### 10.1 Desktop — `/app`

```
┌──────────────┬─────────────────────────────────────────────┐
│ ✦ KUTEKA     │  O seu espaço          Ana · Cliente · [Sair]│
│              ├─────────────────────────────────────────────┤
│ ● Início     │  Bem-vindo, Ana                             │
│ ○ Patrimónios│  Email: ana@…                               │
│   Em breve   │                                             │
│ ○ Confiança  │  [ Estado da conta ]  [ Papéis activos ]    │
│   Em breve   │                                             │
│ ○ Habitação  │  Próximos módulos                           │
│   Em breve   │  ○ Patrimónios — Em breve                   │
│              │  ○ Confiança — Em breve                     │
│              │  ○ Habitação — Em breve                     │
│              │                                             │
│              │  [ Voltar à Landing ] [ Actualizar nome ]   │
└──────────────┴─────────────────────────────────────────────┘
```

### 10.2 Mobile — `/app`

```
┌────────────────────────────────────┐
│ [☰] ✦ KUTEKA          Ana  [Sair]  │
├────────────────────────────────────┤
│  (Main — mesmo conteúdo home)      │
└────────────────────────────────────┘
     ↓ ☰ abre
┌────────────────────────────────────┐
│ Início                             │
│ Patrimónios · Em breve             │
│ Confiança · Em breve               │
│ Habitação · Em breve               │
│ (Administração)                    │
└────────────────────────────────────┘
```

---

## 11. Plano técnico (pós-autorização — não implementação ainda)

| Passo | Entrega                                                                        |
| ----- | ------------------------------------------------------------------------------ |
| 1     | Extrair / evoluir `AppShell` → `PlatformShell` (Sidebar, Topbar, Main, drawer) |
| 2     | Config de nav declarativa (activo / em breve / permission)                     |
| 3     | Manter `AppSession` + gate sessão                                              |
| 4     | Adaptar `AppHomeClient` / `AdminPanelClient` ao Main                           |
| 5     | Copy em `content/pt.ts` (chaves shell)                                         |
| 6     | Rebuild `prebuilt/web-out` + Deploy Kuteka                                     |
| 7     | ADR-005 + encerramento N5 da Fase 3                                            |

**Packages:** `@kuteka/ui`, `@kuteka/auth`, `@kuteka/shared`, módulo web (novo `modules/shell` ou evolução sob `(app)` + authentication chrome — decisão técnica na implementação).

---

## 12. Autorização de Implementação — proposta condicional

O Product Owner pode emitir, juntamente com a Aprovação Funcional:

> Após Aprovação Funcional desta spec v0.9 (ou revisão controlada), e mantendo CI quality verde na `main`, a Autorização de Implementação da Fase 3 considera-se **activa sem nova confirmação intermédia**.  
> O Líder Técnico implementa até N5 com autonomia (commits, merge, deploy por marco), interrompendo só por decisão de negócio, conflito arquitectural, bloqueio técnico real ou escolha estratégica.

Pré-requisitos técnicos já satisfeitos pela baseline: CI ✅ · Supabase ✅ · domínio ✅ · PRD-001 N5 ✅.

Engineering Gate Fase 3: checklist curto em `docs/backlog/PHASE_3_ENGINEERING_GATE.md` (a activar com a aprovação) — foco static export, a11y nav, ausência de regressão auth.

---

## 13. Riscos e dívidas

| Risco                                   | Mitigação                                                      |
| --------------------------------------- | -------------------------------------------------------------- |
| Over-building menu “completo” por papel | D3 + §5.2 — adiado                                             |
| Regressão auth no refactor do layout    | Testes manuais F3→F6→`/app`; não tocar `auth-client` salvo bug |
| Static export + drawer                  | Implementação cliente-only; sem middleware novo obrigatório    |
| Expectativa de KAI                      | Explicitamente fora de âmbito (P6)                             |

---

## 14. Autoavaliação do Arquitecto

| Campo                | Conteúdo                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Maturidade           | **N3** — candidata a Aprovação Funcional                                          |
| Confiança            | **93%**                                                                           |
| Factores < 95%       | Confirmação PO de D3 (nav única vs nav por papel) e D4 (lista exacta Em breve)    |
| Riscos remanescentes | Pressão para incluir KAI/notificações cedo; scope creep do menu                   |
| Dívidas              | Gate Fase 3 checklist ainda por ficheiro dedicado (cria-se com a aprovação)       |
| Decisões adiadas     | Role switch, command palette, widgets, deep-links por papel                       |
| Recomendação         | **Aprovar** D1–D12 (com autorização condicional §12) para avançar à implementação |

---

## 15. Pedido ao Product Owner

1. **Aprovar Funcionalmente** esta spec (D1–D12), ou indicar reservas pontuais.
2. **Confirmar** a Autorização de Implementação condicional §12.
3. Após isso, o Líder Técnico avança directamente para implementação e deploy contínuo até N5 da Fase 3.

**Não** se pede nova ronda de QA do PRD-001.  
**Não** se reabre polish cosmético do stub auth fora do Shell.
