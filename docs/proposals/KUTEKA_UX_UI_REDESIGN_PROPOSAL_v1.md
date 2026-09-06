# Kuteka — Proposta Oficial de Reestruturação UX/UI

**Documento:** Proposta de Redesign & Experiência  
**Versão:** 1.0  
**Estado:** Aguardando aprovação — **nenhuma linha de código da aplicação será alterada até aprovação explícita**  
**Fontes obrigatórias (não substituídas):**

1. Manual Operacional da Kuteka (v1.0)
2. Kuteka Software Architecture Blueprint (Documento 001)
3. Kuteka Design System & UX Blueprint (Documento Oficial Nº 003)

**Posicionamento respeitado:** A Kuteka não é um site de anúncios. É uma PropTech africana de gestão de património, confiança, contratos, pagamentos, inteligência e ecossistema imobiliário.

---

## 0. Princípios que esta proposta não viola

| Princípio oficial                                       | Compromisso nesta proposta          |
| ------------------------------------------------------- | ----------------------------------- |
| Parceiro Patrimonial (não “senhorio”)                   | Linguagem, painéis e fluxos usam PP |
| Ativar um Património (não só “publicar”)                | Framing e jornada de activação      |
| Passaporte Digital do Imóvel                            | Componente e ecrãs dedicados        |
| Índice Kuteka (KTK Score)                               | Widget e critério de confiança      |
| Multi-role por utilizador                               | RBAC, não `role` único              |
| KAI como presença constante                             | Dock/assistente sempre acessível    |
| Next.js + TypeScript + Tailwind + Supabase + PostgreSQL | Stack alvo; migração planeada       |
| Clean Architecture / domínios / KEOS                    | Estrutura de apps e packages        |
| Simplicidade absoluta / um ecrã = uma missão            | UX e wireframes                     |
| Mobile first                                            | Desenho desde o telefone            |
| Cores oficiais (Primary = Kuteka Orange)                | Design System v1                    |

---

## 1. Avaliação crítica da interface actual

A plataforma actual (`Site_Angola` / kutekalink) é um **marketplace SPA** (Vite + React + CSS + localStorage, com API Express opcional). Cumpre bem o papel de “classificados com moderação”, mas **não materializa** a visão PropTech dos três documentos oficiais.

### O que a interface actual comunica

- Site de anúncios (comprar / arrendar / veículos / publicar).
- Confiança baseada em selos locais e texto, não em Passaporte Digital / SCK.
- “Proprietário” e “comprador” como papéis binários — contradiz multi-role.
- Identidade visual verde/âmbar própria do protótipo — **não** a Primary Orange do Design System oficial.
- Tipografia Inter/system sem sistema tipográfico aplicado de forma consistente.
- Shell de marketing (top nav + páginas longas), não **Sidebar + Topbar + Área principal** exigida pelo Design System.

### O que a interface actual já acerta (a preservar conceptualmente)

- Separação de secções (comprar / arrendar / veículos).
- Fluxo de moderação de anúncios (pendente → aprovado/rejeitado).
- Intenção de onboarding (cadastro → perfil → preferências).
- Tokens CSS parciais (`styles/tokens.css`) como semente de Design System.
- Painéis demo de proprietário / agente / admin (protótipos, não produtos).

### Gap estratégico

O Manual Operacional descreve **ciclo de vida, património, confiança, academia de agentes, gestão financeira, conflitos, IA**. A UI actual descreve **listagens**. Há um desfasamento de produto, não apenas de “bonito vs feio”.

---

## 2. Problemas encontrados

### 2.1 UX / produto

1. **Primeiro contacto confuso** — cadastro estilo “Facebook clone”, depois escolha binária, depois questionário longo; viola Regra 2 e 3 do Design System.
2. **Home sobrecarregada** — hero com stats, múltiplos CTAs, hub, categorias, benefícios: várias missões no mesmo ecrã.
3. **Navegação role-blind** — comprador vê “Publicar”; proprietário vê o mesmo peso de “Comprar”.
4. **Dois fluxos de publicação** — `/publicar` e `/adicionar-propriedade` competem.
5. **Sem dashboard shell** — painéis são páginas longas com secções, não ferramentas profissionais.
6. **Sem pesquisa universal** (estilo Notion) — pesquisa só de imóveis.
7. **KAI inexistente como produto** — só botões isolados de IA em publicação.
8. **Sem Passaporte Digital, KTK Score, Painel de Saúde do Património** na UI.
9. **Estados incompletos** — empty/error/offline/pending pouco padronizados.
10. **Mobile** é adaptação, não desenho first.

### 2.2 UI / Design System

11. **Cores inconsistentes** (`#0d5c44`, `#0f6a49`, `#125f49`, âmbares vários) vs Orange oficial.
12. **Três dialectos CSS** (`App.css`, `layout.css`, `home.css`) + tokens ignorados.
13. **Botões pill** vs radius do sistema.
14. **Cards e secções a mais** — contradiz “poucos botões, muito espaço”.
15. **Duplicação massiva** de CrossNav / InsightsBar / StatsCards (~16 variantes).

### 2.3 Arquitectura / engenharia (impacto UX)

16. Stack actual ≠ Blueprint (Vite/JS/localStorage vs Next/TS/Supabase).
17. Auth insegura para produção (`btoa`, Google decode client-side).
18. Admin por email hardcoded — não RBAC.
19. God-object `MarketplaceContext` — impede dashboards por domínio.
20. Deploy do domínio ainda desalinhado com ambientes oficiais (Vercel + Cloudflare no Blueprint).

---

## 3. Melhorias propostas (visão)

### 3.1 Experiência

- **Landing pública** (descoberta) separada da **App autenticada** (trabalho diário).
- Após login → **Dashboard inteligente** conforme papéis activos (Manual Cap. 28.5).
- Linguagem oficial: _Parceiro Patrimonial_, _Ativar património_, _Passaporte Digital_, _KTK Score_, _KAI_.
- Cada ecrã = uma missão; complexidade atrás de drawers/modais.
- Pesquisa Command Palette (⌘K) global.
- KAI dock permanente (nunca página escondida).

### 3.2 Interface

- Redesign total com Design System Nº 003 (Orange primary, Slate secondary, escala 4–96).
- Shell: **Sidebar + Topbar + Main + Widgets**.
- Minimalismo premium 2030: tipografia clara, espaçamento generoso, motion &lt; 250ms.
- Mobile-first: bottom nav + drawers; desktop: sidebar colapsável.

### 3.3 Produto

- Dashboards por stakeholder (PP, Cliente, Agente, Admin) com widgets inteligentes.
- Domínios: Auth, Users, Properties, Visits, Offers, Contracts, Payments, Documents, Trust, KAI, Admin.
- Migração controlada para monorepo KEOS (Blueprint).

---

## 4. Nova arquitectura de navegação

### 4.1 Dois mundos

```
[Público]  kutekalink.com
  Landing
  Explorar patrimónios (somente leitura / teaser)
  Autenticação
  Conteúdo institucional

[App]  app.kutekalink.com  (ou /app)
  Shell autenticado
  Dashboards + domínios
  KAI sempre presente
```

### 4.2 Shell autenticado (obrigatório)

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │ Topbar: busca ⌘K · notificações · avatar │
│ (role)   ├──────────────────────────────────────────┤
│          │ Breadcrumbs                               │
│          │ Main content                              │
│          │                                           │
│  [KAI]   │                                           │
└──────────┴──────────────────────────────────────────┘
```

### 4.3 Navegação por papel (itens primários)

**Parceiro Patrimonial**  
Visão geral · Patrimónios · Receitas · Visitas · Propostas · Contratos · Pagamentos · Documentos · Passaporte · Score · Notificações · KAI

**Cliente**  
Início · Favoritos · Alertas · Visitas · Propostas · Contratos · Pagamentos · Documentos · Mensagens · KAI

**Agente**  
Agenda · Tarefas · Leads · Clientes · Imóveis · Comissões · Ranking · Documentos · KAI

**Administrador**  
Métricas · Validações · Utilizadores · Agentes · Parceiros · Imóveis · Financeiro · Relatórios · Auditoria · Configurações · KAI

### 4.4 Mudança de papel (multi-role)

No avatar: “Actuar como…” — muda o dashboard sem nova conta (Manual: mesma identidade digital, vários papéis).

### 4.5 Atalhos

- `⌘K` / `Ctrl+K` — Command Palette
- `G` depois `H` — home do papel
- `G` depois `P` — patrimónios / pesquisa
- `?` — ajuda contextual

---

## 5. Mapa completo da plataforma

### 5.1 Domínios (Blueprint)

| Domínio                 | Rotas App (exemplo)          | MVP              | Pós-MVP                |
| ----------------------- | ---------------------------- | ---------------- | ---------------------- |
| Auth                    | `/auth/*`                    | ✓                | MFA                    |
| Users & Profiles        | `/settings/profile`          | ✓                | KYC completo           |
| Properties / Património | `/patrimonios/*`             | ✓                | Passaporte histórico   |
| Search & Discovery      | `/explorar`, `/pesquisa`     | ✓                | Alertas                |
| Visits                  | `/visitas/*`                 | ✓                | Avaliação pós-visita   |
| Offers / Negotiation    | `/propostas/*`               | Fase 3           | —                      |
| Contracts               | `/contratos/*`               | Fase 4           | Assinatura electrónica |
| Payments / Wallet       | `/pagamentos/*`, `/carteira` | Fase 5–7         | Escrow                 |
| Documents               | `/documentos/*`              | ✓ (básico)       | Conservatória          |
| Trust / SCK / Score     | `/confianca/*`               | ✓ (score básico) | Selos                  |
| Marketplace serviços    | `/servicos/*`                | Fase 6           | Prestadores            |
| Agents / Academy        | `/agente/*`, `/academia`     | Fase agente      | Carreira               |
| Admin                   | `/admin/*`                   | ✓                | BI                     |
| KAI                     | dock global                  | presença         | contexto total         |
| Analytics / BI          | `/insights`                  | Fase 9           | CEK                    |

### 5.2 Fluxo macro (Manual)

```
Descoberta → Registo → Verificação → Escolha/activação de papéis
    → Dashboard
    → (PP) Ativar património → Verificação → Score → Publicação
    → (Cliente) Preferências → Pesquisa → Visita → Proposta → Contrato → Pagamento
    → (Agente) Agenda/tarefas → mediação
    → (Admin) Validação/auditoria
```

---

## 6. Estrutura dos dashboards

### 6.1 Template universal (Design System Cap. 13)

1. Resumo contextual (saudação + missão do dia)
2. KPIs (máx. 4 no above-the-fold)
3. Actividades recentes (timeline)
4. Acções rápidas (máx. 3)
5. Alertas
6. Sugestões KAI
7. Relatórios / atalhos

### 6.2 Parceiro Patrimonial — widgets

- Saúde do património (valor, valorização, dias vazios, ROI)
- Receitas vs despesas (mês)
- Visitas agendadas
- Propostas pendentes
- Contratos activos
- Documentos em falta
- KTK Score médio da carteira
- Recomendação KAI (ex.: “agendar fotos”, “ajustar preço”)

### 6.3 Cliente — widgets

- Favoritos recentes
- Alertas de novos patrimónios
- Próximas visitas
- Propostas em curso
- Pagamentos / cauções
- Documentos
- Sugestão KAI (“3 opções em Talatona no seu orçamento”)

### 6.4 Agente — widgets

- Agenda do dia
- Tarefas (verificações técnicas)
- Leads quentes
- Pipeline de imóveis
- Comissões
- Ranking Academia
- KAI (“priorize visita KTK-IMM-00012”)

### 6.5 Administrador — widgets

- Validações pendentes (imóveis / identidades / agentes)
- Utilizadores activos
- SLA de moderação
- Financeiro resumo
- Auditoria recente
- Riscos / compliance
- KAI operacional

---

## 7. Design System (aplicação do Documento Nº 003)

### 7.1 Cores (oficiais)

| Token                               | Uso                           |
| ----------------------------------- | ----------------------------- |
| Primary — Kuteka Orange             | CTAs principais, marca activa |
| Secondary — Slate                   | Texto, bordas, sidebar        |
| Success — Green                     | Aprovado, pago                |
| Warning — Amber                     | Pendente, atenção             |
| Danger — Red                        | Erro, rejeição                |
| Info — Blue                         | Informação                    |
| Background — White / Dark Slate 950 | Superfícies                   |

> A paleta verde actual do protótipo **não** é a identidade oficial. A migração visual adopta Orange como primary, mantendo verde só para estados de sucesso.

### 7.2 Tipografia

- Heading / Body: **Inter** (oficial)
- Mono: **JetBrains Mono** (IDs, scores, valores)

### 7.3 Espaçamento

Escala: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 — **proibidos** valores aleatórios.

### 7.4 Linguagem visual

Clean · glassmorphism muito discreto · cards elegantes · muito espaço · animações &lt; 250ms · personalidade: calma, segura, premium, humana, inteligente.

### 7.5 Arquitectura visual

Sempre: Sidebar · Topbar · Área principal · Painéis · Widgets.  
Nunca páginas “infinitas” de marketing dentro da App.

---

## 8. Biblioteca de componentes

### 8.1 Fundação (`packages/ui`)

Botões · Inputs · Textarea · Checkbox · Radio · Switch · Dropdown · Select · DatePicker · Upload · Avatar · Badge · Tag · Tooltip · Accordion · Tabs · Modal · Drawer · Toast · Alert · Progress · Skeleton · Empty · Error · Offline · Pagination · Breadcrumbs · Command Palette · Search Field

### 8.2 Compostos de produto

- `PropertyCard` / `PropertyGallery` / `PropertyMap`
- `KutekaScore`
- `TrustIndex` / selos SCK
- `DigitalPassport`
- `HeritageHealthPanel`
- `WalletSummary`
- `AgendaCalendar`
- `TimelineLegal`
- `VisitScheduler`
- `OfferNegotiator`
- `DocumentVault`
- `NotificationCenter`
- `KpiGrid` / `ChartCard`
- `StepForm` (wizard)
- `ChatThread`
- `KaiDock` / `KaiSuggestion`

### 8.3 Estados obrigatórios (Cap. 24)

Loading · Success · Error · Empty · Offline · Pending · Approved · Rejected · Archived · Suspended — **todos** os componentes de domínio devem suportá-los.

---

## 9. Fluxos dos utilizadores

### 9.1 Autenticação (Blueprint FASE 1 + Manual)

1. Criar conta (email/telefone + password **ou** OAuth)
2. Verificar email
3. Completar perfil mínimo
4. Aceitar Termos
5. (Opcional MVP) verificar telefone
6. Seleccionar / activar papéis iniciais (pode adicionar depois)
7. Entrar no dashboard do papel activo

**Regra:** não forçar questionário de 5 passos antes de valor. Preferências do Cliente = perfil inteligente progressivo (Manual 21.7).

### 9.2 Parceiro Patrimonial — Activar património

Descoberta → Registo → Verificação identidade → Registo património (código `KTK-IMM-…`) → Verificação técnica → Avaliação / Score → Contratação serviço → Activação → Gestão (visitas, propostas, contratos, pagamentos, documentos) → Renovação / valorização

### 9.3 Cliente

Preferências leves → Pesquisa / recomendações → Favoritos/alertas → Pedido visita → Visita → Proposta → Negociação → Contrato → Pagamento → Entrada → Acompanhamento

### 9.4 Agente

Onboarding Academia → Agenda → Verificação técnica → Mediação visitas/propostas → Comissões → Ranking

### 9.5 Admin

Fila de validações → Aprovar/rejeitar com motivo → Auditoria → Relatórios

### 9.6 Feedback transversal

- Toast em guardar/enviar/aprovar/rejeitar
- Skeleton em listas
- Confirmação destrutiva em drawer
- Offline banner
- Empty com uma CTA clara

---

## 10. Wireframes de baixo nível (descritos)

### W-L1 Landing (mobile first)

- Marca Kuteka (logo + nome grande)
- Uma frase de valor (“Património. Confiança. Habitação.”)
- Um CTA: “Começar”
- Link secundário: “Explorar”
- Sem stats, sem grelha de features no primeiro viewport

### W-L2 Auth

- Card centrado: email, password, Continuar
- Divider “ou”
- Google
- Links: criar conta / recuperar
- Zero marketing lateral agressivo

### W-L3 Role activation

- Título: “Como quer usar a Kuteka hoje?”
- Cards: Cliente · Parceiro Patrimonial · (Agente — se elegível)
- Nota: “Pode activar mais papéis depois”
- Uma escolha → dashboard

### W-L4 App shell

- Sidebar ícones+labels (colapsa em ícones)
- Topbar: search · bell · avatar
- Main: título da página + conteúdo
- Canto: botão flutuante KAI

### W-L5 Lista de patrimónios

- Toolbar: filtros chips + mapa toggle
- Grelha de cards (foto, preço Kz, zona, Score badge)
- Empty state se zero resultados

### W-L6 Detalhe património

- Galeria full-bleed
- Preço + Score + selos confiança
- Passaporte (resumo)
- CTA única principal (Pedir visita / Contactar via plataforma)
- Secundárias em menu

### W-L7 Dashboard PP

- 4 KPIs
- Lista “precisa da sua atenção”
- Timeline
- Bloco KAI

---

## 11. Wireframes de alto nível (descritos)

### H1 — Experiência “2030 premium”

- Atmosfera: espaços amplos, contraste controlado, Orange pontual
- Motion: fade/slide curtos ao mudar de secção
- Densidade: dashboards com ar; listas densas só onde há trabalho

### H2 — Detalhe património (alto nível)

- Plano visual dominante (galeria)
- Coluna sticky de decisão (preço, score, CTA)
- Abaixo: Passaporte · Documentos · Histórico · Mapa · Serviços próximos

### H3 — Negociação

- Timeline vertical de propostas
- Estado visual (enviada / contraproposta / aceite / retirada)
- Painel lateral de documentos e KAI (“faixa de preço justa”)

### H4 — Admin validações

- Fila kanban ou lista com preview de fotos
- Acções Aprovar / Pedir correcção / Rejeitar
- Motivo obrigatório em rejeição
- Log de auditoria visível

### H5 — KAI

- Dock direito (desktop) / bottom sheet (mobile)
- Contexto: “Está no património KTK-IMM-00012”
- Sugestões accionáveis (botões), não só texto

---

## 12. Estratégia UX

1. **Regra do clique útil** — cada clique aproxima do objectivo (venda, arrendamento, visita, validação).
2. **Progressive disclosure** — perfil inteligente e documentos pedem-se quando necessários.
3. **Confiança visível** — Score, Passaporte e selos no sítio da decisão.
4. **Linguagem operacional** — termos do Manual, não jargão de classificados.
5. **Multi-role sem fricção** — uma conta, vários papéis, switch explícito.
6. **Antecipação (Regra 5)** — ao activar património, sugerir fotos, docs, preço, agente.
7. **Acessibilidade WCAG 2.2 AA** — teclado, contraste, leitores de ecrã.
8. **Mobile first** — fluxos críticos desenhados no telemóvel primeiro.
9. **Feedback obrigatório** — nada “parado”.
10. **Métricas UX** — tempo até primeira visita pedida; tempo até activação de património; taxa de abandono no auth.

---

## 13. Estratégia UI

1. Adoptar **100%** o Design System Nº 003 (tokens → Tailwind theme).
2. Construir `packages/ui` antes de páginas de domínio.
3. Dark mode preparado (Slate 950), light default.
4. Iconografia única (set consistente; sem emoji como UI primária).
5. Fotografia real de contexto angolano — evitar stock genérico como identidade.
6. Densidade: Marketing (landing) ≠ Ferramenta (app).
7. Motion &lt; 250ms; `prefers-reduced-motion` respeitado.
8. Microcopy curta; erros accionáveis.
9. IDs humanos (`KTK-IMM-…`, KID) em mono.
10. QA visual: checklist por componente + estados.

---

## 14. Plano de implementação por fases

> Alinhado ao Blueprint: **nunca desenvolver o módulo N+1 antes de concluir e testar o N**.  
> **Sem código até aprovação desta proposta.**

### Fase 0 — Fundação documental & repo (1 ciclo)

- Criar árvore `/docs` (AI_CONTEXT, architecture, UX guidelines) a partir dos 3 documentos oficiais
- Inicializar monorepo KEOS (`apps/web`, `packages/ui`, `supabase/`)
- Design tokens Tailwind = Design System
- **Entrega:** repo base + Storybook/`packages/ui` skeleton

### Fase 1 — Auth, Users, RBAC, Shell

- Supabase Auth + `users` / `roles` / `user_roles` / `profiles` / `audit_logs`
- App shell (Sidebar/Topbar/KAI dock placeholder)
- Dashboards vazios por papel
- **Entrega:** login real + redirecionamento por papel

### Fase 2 — Patrimónios (Imóveis)

- CRUD, fotos (Storage), pesquisa, favoritos
- Código patrimonial `KTK-IMM-…`
- Score básico + Passaporte v0
- Moderação admin
- **Entrega:** activar património → listagem pública aprovada

### Fase 3 — Visitas & agenda

- Pedidos, confirmação, lembretes, avaliação
- Agenda do agente

### Fase 4 — Propostas & contratos (MVP)

- Proposta → estados → contrato simples + documentos

### Fase 5 — Pagamentos / Wallet (base)

- Registo de pagamentos, recibos, cauções (integrações depois)

### Fase 6 — Marketplace de serviços

- Prestadores, pedidos, avaliações

### Fase 7–8 — Wallet avançada + KAI contextual

- Assistente com contexto de ecrã/papel

### Fase 9 — BI / CEK

- KPIs oficiais do Manual

### Fase 10 — Mobile apps

- Depois da web estável

### Migração do protótipo actual

- Tratar `Site_Angola` (Vite) como **protótipo de validação**, não como base de produção.
- Extrair aprendizagens (fluxos de listagem, moderação) para o monorepo Next/Supabase.
- Deploy alvo: **Vercel + Cloudflare + Supabase** (Blueprint), não prolongar Render+localStorage como arquitectura final.

---

## Decisões que precisam da sua aprovação

Antes de qualquer código, confirmo:

1. **Aprovar esta proposta v1** como direcção oficial de UX/UI?
2. **Confirmar Primary = Kuteka Orange** (abandono do verde como marca)?
3. **Confirmar migração para monorepo Next.js + TypeScript + Tailwind + Supabase** (deixar Vite como legado)?
4. **MVP de papéis no lançamento:** Cliente + Parceiro Patrimonial + Admin (+ Agente em seguida)?
5. **Auth primeiro ecrã** vs **Landing pública primeiro** — proposta recomenda Landing → Auth → App; confirma?
6. **Nome de produto na UI:** manter “Kuteka”; usar sempre “Parceiro Patrimonial” e “Ativar património”?

---

## Nota final

Esta proposta **não resume nem substitui** o Manual Operacional, o Architecture Blueprint nem o Design System. Traduz esses documentos em decisões de experiência e num plano executável.

**Próximo passo após a sua aprovação:**  
Especificação funcional detalhada da **Fase 0 + Fase 1** (Auth + Shell + RBAC), com modelo de dados, APIs e prompts de engenharia — ainda **antes** de escrever código de funcionalidade.

---

_Documento preparado pela equipa virtual (Product Design · UX · UI · Architecture · Front-end · Design System · PM · Full Stack) sob as regras oficiais Kuteka._
