# Validação pós-deploy — Matriz B+C (produção)

| Campo                  | Valor                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Data**               | 2026-08-09                                                                                                        |
| **Ambiente**           | `https://kutekalink.com` + Supabase `vhqwitbrpqaiutjbundo`                                                        |
| **Código em produção** | merge PR #69 → `main` (`31ff391…`); prebuilt B+C                                                                  |
| **Migrations**         | `0029`→`0040` aplicadas via `supabase db push` (0029–0031 eram pré-requisito em falta; 0032–0040 pedidos pelo PO) |
| **Método**             | Auth/RPC/RLS no remoto · Playwright autenticado · confirmação de rotas/chunks                                     |
| **Beta 2**             | **NÃO autorizada** neste relatório                                                                                |

---

## O que foi feito (ops)

1. Confirmado remoto em `0001–0028` apenas.
2. Aplicadas **`0029` → `0040`** em ordem (não reexecutadas as já aplicadas).
3. Verificadas tabelas/RPCs/papéis/perms.
4. Merge da PR #69 em `main` → Render auto-deploy.
5. Confirmado `/app/fundador` **200** (deixou de 404 ~40s após merge).
6. Contas de teste criadas: `demo.supervisor@kuteka.local`, `demo.prestador@kuteka.local` (pwd demos: `DemoKuteka2026!`).
7. **Não** foi feito bootstrap Founder em conta real (decisão consciente — requer PO).

---

## 🟢 Passou

### Infra / deploy

- Migrations `0029–0040` no remoto.
- Papéis: `founder`, `co_founder`, `supervisor`, `auditor`, `service_provider`, etc.
- Perms: `properties.review`, `audit.read`, `moderation.manage`, `founder.manage`.
- Tabelas: `founders`, `operational_escalations`, social, `property_publication_reviews`, `audit_logs`, `content_reports`, `platform_feature_flags`.
- Produção serve B+C: `/app/fundador` = Founder Center (não 404).
- Chunks social com Gostar / Favoritar / Perguntar / Partilhar + RPCs.

### Social (persistência + UI autenticada)

- RPCs: like, favorite, comment, question, summary, list — OK.
- Browser (Cliente logado): barra **abaixo das fotos** com interacção; após click labels passam a «Remover gosto / Remover favorito»; Comentários / Perguntar / Avaliar / Partilhar visíveis; denúncia UI presente.

### Escalações

- Supervisor cria → Admin vê → Admin assume → Admin re-escala a Super → Super resolve.
- Auditoria regista `escalation.create` / `acknowledged` / `resolved`.

### Fila de publicação / ciclo parcial

- Admin `request_corrections` + Supervisor `request_documents` → item na fila.
- Admin `approve` → `lifecycle_status = janela_premium` no imóvel demo.

### Segurança (bloqueios medidos)

- Supervisor **não** aprova/rejeita: `administrator required for approve/reject`.
- Agente **não** decide publicação: `properties.review required`.
- Cliente **não** cria escalação: `properties.review required`.
- Demo **não** vira Founder: `system demo accounts cannot become Founder`.
- PP/Agente **não** alteram património alheio (RLS; título inalterado).

### Papéis (login + experiência browser/API)

| Papel       | Login              | Evidência                                                                   |
| ----------- | ------------------ | --------------------------------------------------------------------------- |
| Super Admin | 🟢 demo.super      | Menu Super/Admin; `/app/fundador` acessível                                 |
| Admin       | 🟢 demo.admin      | Queue + approve + audit                                                     |
| Supervisor  | 🟢 demo.supervisor | Browser: «Cockpit do Supervisor», Escalações, fila                          |
| Agente      | 🟢 demo.agente     | Hub `/app/agente`                                                           |
| Prestador   | 🟢 demo.prestador  | Browser: «Área do Prestador» + fluxo Pedido→…→Avaliação; `isProvider: true` |
| Parceiro    | 🟢 demo.parceiro   | Patrimónios + isolamento                                                    |
| Cliente     | 🟢 demo.cliente    | Browser: Missão / Pode / Não deve; social                                   |

### Chat (parcial infra)

- `kuteka_chat_list_conversations` / `unread_total` OK.

---

## 🟡 Parcial

### Founder / Owner real

- Bootstrap **aberto** (`bootstrapOpen: true`, `founders` vazio).
- UI `/app/fundador` viva; demos bloqueadas correctamente.
- **Conta real ainda não claimou Owner** — Founder Center completo (Pessoas/Flags/KOCC tabs) não validado com identidade Founder real.
- Super autenticado vê guia de bootstrap (esperado sem role `founder`).

### Chat ponta-a-ponta

- `kuteka_chat_start_direct` Cliente↔PP e Cliente↔Agente **recusado** por pairing (`contract or role pairing required`).
- Listagem OK; conversa real Cliente↔PP/Agente **não** fechada neste teste.

### Continuidade PP → … → Cliente → Agente

- Trecho validado: pendência/correcção → aprovação → `janela_premium`.
- **Não** validado ponta-a-ponta: submissão inicial PP → KAI automático → visita Agente → contrato.
- Fila estava vazia antes do smoke; após decisões há 1 item tratado.

### Prestador ciclo completo

- Inbox/contexto provider OK; UI fluxo mínimo visível.
- Criação de pedido (`marketplace_create_order` etc.) não encontrada sob esses nomes — ciclo Pedido→Pagamento **não** exercitado de ponta a ponta neste turno.

### Super/Admin e `properties.manage`

- Continuam com `properties.manage` no remoto (além de `properties.review`). Lens UI B+C mitiga no browser; desalinhamento de perms reais permanece.

### Notificações

- Catálogo shell + eventos de auditoria; entrega push/inbox dedicada não revalidada como produto completo.

### Favoritar label

- Funcional (estado «Remover favorito» após toggle); chip inicial «Favoritar» confirmado no bundle.

---

## 🔴 Falhou

1. **Founder real em produção** — ainda sem Owner claimado (bloqueia Gestão Institucional real e topo da escalação a Founder).
2. **Chat entre papéis sem contrato/pairing** — mensagens Cliente↔PP/Agente não arrancam no smoke.
3. **Fluxo completo Agente (visitas/assignments)** — `agent_assignments` continua vazio; Agenda→Relatórios sem trabalho real ligado.
4. **Escalação até Founder** — sem Founder real, último degrau institucional não testável.
5. **Browser visual 100% de partilha** (WhatsApp / Web Share / copiar link) — não clicado neste smoke (UI Partilhar visível).

---

## 🔒 Segurança

| Tentativa                     | Resultado                  |
| ----------------------------- | -------------------------- |
| Supervisor approve/reject     | 🔒 bloqueado               |
| Agente decide publicação      | 🔒 bloqueado               |
| Cliente cria escalação        | 🔒 bloqueado               |
| Demo bootstrap Founder        | 🔒 bloqueado               |
| PP/Agente PATCH imóvel alheio | 🔒 RLS (0 rows)            |
| Escalação auditada            | 🔒 eventos em `audit_logs` |

**Atenção residual:** Admin/Super ainda possuem `properties.manage` na BD — risco se lens UI falhar. Founder Owner ainda não existe — governação institucional aberta a claim da primeira conta real elegível.

---

## 🐛 Bugs / gaps

1. Chat pairing demasiado restritivo para smoke operacional sem contrato (ou falta seed de relação).
2. Super demo acumula roles client+partner+super — pode confundir seletor (mitigado por default preferencial no código).
3. Título página «Founder Center · Kuteka · Kuteka» (duplicação «Kuteka»).
4. Marketplace: RPC de criação de pedido não descoberto sob nomes óbvios — validar nome real no cliente antes do próximo smoke Prestador.
5. Contas `demo.supervisor` / `demo.prestador` criadas só para validação — **não** usar como Founder; remover/banir antes de beta pública alargada (política já documentada).

---

## 🚫 Bloqueadores da Beta 2

1. **Claim Founder/Owner com conta real** (não demo) + validação Gestão Institucional / email seguro.
2. **Confirmação visual PO** nos 8 papéis (este relatório não substitui a vossa passagem humana).
3. **Chat útil no fluxo** (Cliente↔PP/Agente ou decisão explícita de aceitar limitação até contrato).
4. **Pelo menos um fluxo Agente com assignment real** (visita/follow-up).
5. **Política demos** antes de convidar utilizadores reais em massa (`demo.*` ainda activas).

---

## Contas de teste (internas)

| Email                          | Uso                   |
| ------------------------------ | --------------------- |
| `demo.cliente@kuteka.local`    | Cliente               |
| `demo.parceiro@kuteka.local`   | Parceiro              |
| `demo.agente@kuteka.local`     | Agente                |
| `demo.admin@kuteka.local`      | Admin                 |
| `demo.super@kuteka.local`      | Super                 |
| `demo.supervisor@kuteka.local` | Supervisor (**nova**) |
| `demo.prestador@kuteka.local`  | Prestador (**nova**)  |
| Password                       | `DemoKuteka2026!`     |

Founder: usar conta real (ex. PO) em `/app/fundador` → Assumir Founder/Owner — **não executado por este agente**.

---

## Conclusão

**Produção + Supabase remoto passaram a hospedar a matriz B+C.**  
Muitos bloqueadores da validação anterior foram eliminados (deploy, migrations, social, escalação, supervisor, prestador experience, fila/approve → janela premium).

**Beta 2 continua bloqueada** até o PO:

1. claimar Founder real,
2. confirmar visualmente os 8 papéis,
3. aceitar ou corrigir gaps de Chat/Agente/demos.
