# Auditoria real — Matriz Operacional Kuteka

| Campo         | Valor                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data**      | 2026-08-09                                                                                                                                                                 |
| **Método**    | Experiência real = o que o utilizador vê/executa na UI com o `ExperienceMode` activo + rotas/menus/CTAs/filas existentes. Não se conta “existe na BD”.                     |
| **Limitação** | Contas Board / Investor / Auditor / Prestador dedicadas podem não existir em produção; nestes casos a ausência de `ExperienceMode` + menu = **🔴 Ausente** na experiência. |
| **Regra**     | Home com “Missão / Pode / Não deve” **não** equivale a matriz implementada.                                                                                                |

Legenda: 🟢 Implementado e funcional · 🟡 Parcial · 🔴 Ausente

---

## Tabela-resumo (pedido PO)

| Papel         | Experiência própria                                      | Dashboard | Menu | Tarefas | Ações                     | Permissões | Limitações | Estado                   |
| ------------- | -------------------------------------------------------- | --------- | ---- | ------- | ------------------------- | ---------- | ---------- | ------------------------ |
| Founder/Owner | 🟢 modo `founder` + Founder Center `/app/fundador`       | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟡         | **🟢 Ops B+C** (validar) |
| Co-Founder    | 🟢 mesmo modo `founder` (badge Co-Founder)               | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟡         | **🟢 Ops B+C** (validar) |
| Super Admin   | 🟢 (modo `super_administrator`)                          | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟡         | **🟢**                   |
| Admin         | 🟢 (`administrator`)                                     | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟡         | **🟢**                   |
| Supervisor    | 🟢 cockpit + menu ops + escalação                        | 🟢        | 🟢   | 🟢      | 🟢 (sem aprovar/rejeitar) | 🟢         | 🟢         | **🟢 Ops B+C** (validar) |
| Agente        | 🟢 hub Agenda→Relatórios                                 | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟡         | **🟢 Ops B+C** (validar) |
| Prestador     | 🟢 modo `service_provider` + fluxo mínimo em `/servicos` | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟡         | **🟢 Ops B+C** (validar) |
| Parceiro      | 🟢 (`patrimonial_partner`)                               | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟢         | **🟢 Mais avançado**     |
| Cliente       | 🟢 (`client`)                                            | 🟢        | 🟢   | 🟢      | 🟢                        | 🟢         | 🟢         | **🟢 Mais avançado**     |
| Board         | 🔴 backlog v1.1+                                         | 🔴        | 🔴   | 🔴      | 🔴                        | 🔴         | 🔴         | **🔴 Fora de escopo**    |
| Investor      | 🔴 backlog v1.1+                                         | 🔴        | 🔴   | 🔴      | 🔴                        | 🔴         | 🔴         | **🔴 Fora de escopo**    |
| Auditor       | 🔴 backlog v1.1+                                         | 🔴        | 🔴   | 🔴      | 🟡                        | 🟡         | 🔴         | **🔴 Fora de escopo**    |

> **Actualização 2026-08-09 (sprint B+C):** gaps Founder / Supervisor / Agente / Prestador / Escalação fechados em código (`0040` + UI).  
> **Critério PO:** só considerar concluído após login real em cada papel e validação visual/funcional. Beta 2 continua bloqueada.

---

## Verificação por papel (perguntas do PO)

### Founder / Owner

| Pergunta               | Achado                                                                                                                                                                                              | Class. |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Dashboard inicial      | Entra como **Superadministrador** (`availableExperiences` mapeia founder → `super_administrator`). Home = missão Super + CTAs Super. `/app/fundador` é guia/bootstrap, não Founder Center completo. | 🟡     |
| Menu                   | Menu do Super (Admin, Super, Financeiro, Contratos…). Sem grupo “Empresa / Founders”.                                                                                                               | 🟡     |
| Tarefas                | CTAs Super: Centro de Comando, Central Trabalho, KOCC, Fundador, Segurança.                                                                                                                         | 🟡     |
| Acções concretas       | Bootstrap, promover papéis (Gestão Institucional), Super tabs (flags, comissões se `finance.manage`), fila Admin.                                                                                   | 🟡     |
| Iniciar processos      | Sim (via Super/Admin) — não há fluxo “estratégia Founder” separado.                                                                                                                                 | 🟡     |
| Aprovar                | Sim (via Super = Adminish).                                                                                                                                                                         | 🟢     |
| Pendenciar             | Sim.                                                                                                                                                                                                | 🟢     |
| Contactar utilizadores | Chat + Contactar Parceiro na fila.                                                                                                                                                                  | 🟡     |
| Dados consulta         | Quase tudo Super.                                                                                                                                                                                   | 🟢     |
| Dados ocultos          | Lens sem `properties.manage` (não Activa como PP).                                                                                                                                                  | 🟡     |
| Notificações           | Catálogo Super (estático demo + real).                                                                                                                                                              | 🟡     |
| Indicadores            | AdminOps executive + KOS no Admin.                                                                                                                                                                  | 🟡     |
| Central de Trabalho    | `/app/admin` + `/app/super` — não Founder Center `Empresa→…→Auditoria`.                                                                                                                             | 🟡     |
| Escalar                | N/A (topo).                                                                                                                                                                                         | 🟢     |
| Auditoria              | Bootstrap/promote/email change/decisões publicação registam eventos.                                                                                                                                | 🟢     |

### Co-Founder

| Pergunta                   | Achado                                                                                              | Class. |
| -------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Dashboard / Menu / Tarefas | Idêntico ao Super se promovido com `super_administrator`. Sem modo `co_founder`. Badge Co-Founder.  | 🟡     |
| Limites Owner              | SQL impede promover Owner sem ser Owner; UI não expõe matriz de poderes configuráveis pelo Founder. | 🟡     |
| Experiência própria        | 🔴→🟡 colapsada.                                                                                    | 🟡     |

### Super Admin

| Pergunta             | Achado                                                                                                                                            | Class. |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Dashboard            | `/app` missão Super + AdminOps executive; primário CTA `/app/super`.                                                                              | 🟢     |
| Menu                 | Super + Admin + contratos/confiança/financeiro; **já não** mostra Activar/Explorar como nav cliente/parceiro. Ainda partilha alguns itens gerais. | 🟡     |
| Tarefas              | Centro Comando, Central Trabalho, KOCC, Fundador, Segurança.                                                                                      | 🟢     |
| Acções               | Aprovar/rejeitar/pendenciar, atribuir, moderação, flags, KOCC, utilizadores.                                                                      | 🟢     |
| Aprovar / Pendenciar | Sim (Adminish).                                                                                                                                   | 🟢     |
| Contactar            | Contactar Parceiro na fila/ficha.                                                                                                                 | 🟢     |
| Central              | `/app/super` + `/app/admin`.                                                                                                                      | 🟢     |
| Escalar              | Para Founder (documentado na missão; sem botão “escalar para Founder”).                                                                           | 🟡     |
| Auditoria            | Decisões + Super ops.                                                                                                                             | 🟢     |
| Limitações           | UI impede Activar PP no cockpit; RLS real ainda pode ter `properties.manage` na conta — lens esconde.                                             | 🟡     |

### Admin

| Pergunta   | Achado                                                                         | Class. |
| ---------- | ------------------------------------------------------------------------------ | ------ |
| Dashboard  | `/app` → Central Trabalho; AdminOps (não executive).                           | 🟢     |
| Menu       | Admin, contratos, confiança, agente (se perms), financeiro leitura.            | 🟡     |
| Tarefas    | Fila, utilizadores, KYC, contratos.                                            | 🟢     |
| Acções     | Aprovar/rejeitar/pendenciar/docs/visita/contactar PP/atribuir.                 | 🟢     |
| Central    | `/app/admin`.                                                                  | 🟢     |
| Escalar    | Para Super (missão; sem fluxo UI dedicado de escalação).                       | 🟡     |
| Limitações | Sem `finance.manage` no lens; não Activa como PP (lens sem properties.manage). | 🟢     |

### Supervisor

| Pergunta     | Achado                                                                                                                                 | Class.               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Dashboard    | Modo existe; home CTAs → `/app/admin`. Cockpit = AdminOps genérico (não “Supervisor”).                                                 | 🟡                   |
| Menu         | Quase vazio: na prática **Mensagens + Administração** (`supervisor` só listado nesses itens; falta em contratos/confiança/financeiro). | 🔴                   |
| Tarefas      | Central Trabalho, Confiança revisão, Mensagens.                                                                                        | 🟡                   |
| Acções       | Pendenciar, pedir docs/visita/correcções, contactar PP, atribuir. **Não** aprovar/rejeitar (UI + SQL 0039).                            | 🟡                   |
| Aprovar      | Não.                                                                                                                                   | 🟢 (limite correcto) |
| Pendenciar   | Sim.                                                                                                                                   | 🟢                   |
| Central      | `/app/admin` (partilhada, não dedicada).                                                                                               | 🟡                   |
| Escalar      | Texto “escalar para Admin”; sem botão de escalação formal.                                                                             | 🟡                   |
| Notificações | Catálogo supervisor (estático).                                                                                                        | 🟡                   |

### Agente

| Pergunta               | Achado                                                                            | Class. |
| ---------------------- | --------------------------------------------------------------------------------- | ------ |
| Dashboard              | AgentOps + CTA `/app/agente`.                                                     | 🟡     |
| Menu                   | Agente, explorar, futuro, contratos, confiança…                                   | 🟢     |
| Tarefas                | Pipeline / acompanhamentos.                                                       | 🟡     |
| Acções                 | Acompanhamentos reais + **muito** ainda demo/pré-visualização Beta (agenda demo). | 🟡     |
| Aprovar publicações    | Não.                                                                              | 🟢     |
| Central                | `/app/agente` (não Agenda→CRM→Relatórios completo).                               | 🟡     |
| Relatórios PDK terreno | Parcial / não fechado como matriz.                                                | 🟡     |

### Prestador

| Pergunta                   | Achado                                                                                                                                 | Class. |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Experiência própria        | **Não há** `ExperienceMode` nem entrada em `availableExperiences`. Login cai em Cliente se tiver role client.                          | 🔴     |
| Menu / Dashboard / Tarefas | Sem menu Prestador.                                                                                                                    | 🔴     |
| Acções                     | Se `service_providers` ligado à conta: inbox em `/app/servicos` (orçamento, aceitar, executar, concluir). Rota partilhada com Cliente. | 🟡     |
| Central                    | Pedidos→Orçamentos→… **não** como home própria.                                                                                        | 🔴     |

### Parceiro Patrimonial

| Pergunta                   | Achado                                                                | Class. |
| -------------------------- | --------------------------------------------------------------------- | ------ |
| Dashboard                  | PartnerOps; CTA Activar património.                                   | 🟢     |
| Menu                       | Patrimónios, Activar, relatórios, planos, contratos, confiança.       | 🟢     |
| Tarefas / Acções           | Registar/activar, docs, fotos, submeter a análise, planos, contratos. | 🟢     |
| Aprovar própria publicação | Não (correcto).                                                       | 🟢     |
| Central                    | Cockpit patrimonial / `/app/patrimonios`.                             | 🟢     |
| Ocupação/Receitas/PDK/ICK  | Painéis na ficha existem; cockpit home é parcial vs matriz completa.  | 🟡     |

### Cliente

| Pergunta  | Achado                                                                                    | Class. |
| --------- | ----------------------------------------------------------------------------------------- | ------ |
| Dashboard | ClientOps + Feed; Explorar.                                                               | 🟢     |
| Menu      | Explorar, residência, favoritos, visitas, propostas, serviços comerciais.                 | 🟢     |
| Acções    | Procurar, interesse, social (like/fav/comment/ask/share), contratos, serviços, confiança. | 🟢     |
| Aprovar   | Não.                                                                                      | 🟢     |
| Central   | Feed / Habitação.                                                                         | 🟢     |

### Board Member

| Pergunta | Achado                                                                                                                 | Class. |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| Tudo     | Papel `board_member` na BD (0037) com só `platform.access`. **Sem** ExperienceMode, menu, dashboard, KPIs, relatórios. | 🔴     |

### Investor Read Only

| Pergunta | Achado                                   | Class. |
| -------- | ---------------------------------------- | ------ |
| Tudo     | Papel `investor_readonly` na BD. Sem UI. | 🔴     |

### Auditor

| Pergunta      | Achado                                                                                                              | Class. |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| Experiência   | Sem modo UI.                                                                                                        | 🔴     |
| Permissões BD | `audit.read` + `moderation.manage` (0037) se papel atribuído.                                                       | 🟡     |
| UI            | Audit Center está em `/app/admin` — exige entrar como Admin/Supervisor/Super; **não** há “Modo Auditor” só-leitura. | 🔴     |

---

## A — Já funciona (experiência utilizável na Beta)

- **Cliente** — explorar, feed, social na ficha, interesses, contratos/confiança básicos.
- **Parceiro Patrimonial** — activar património, lista, submissão a análise, planos.
- **Super Admin / Admin** — home alinhado à missão; Central de Trabalho com aprovar/pendenciar/contactar PP; Super/KOCC/flags para Super.
- **Limite Supervisor** — não aprova/rejeita (correcto na fila se migration 0039 aplicada).
- **Founder bootstrap** — `/app/fundador` + Gestão Institucional (se migrations e claim).

## B — Existe parcialmente

- **Founder / Co-Founder** — badge + institucional; experiência = Super, não Founder Center.
- **Supervisor** — acções de fila OK; menu/cockpit próprios fracos.
- **Agente** — hub + assignments; agenda/CRM/relatórios ainda demo/parcial.
- **Prestador** — ciclo marketplace em `/app/servicos` se provider linked; sem papel/experiência.
- **Auditor** — dados/RPC possíveis via Admin; sem modo só-leitura.
- **Escalação formal** (12h → KOCC) e “escalar para X” como acção UI.
- **Notificações por papel** — mistura catálogo estático + notificações reais.
- **Indicadores** — cockpits estatísticos existem; nem sempre = indicadores da matriz.

## C — Falta implementar (experiência da matriz)

- ExperienceMode + home + menu para: **Founder**, **Co-Founder** (configurável), **Prestador**, **Board**, **Investor**, **Auditor**.
- Founder Center completo: `Empresa → Pessoas → Patrimónios → Operação → Financeiro → Segurança → Receita → KAI → Auditoria`.
- Supervisor: menu operacional próprio (não só Admin partilhado).
- Agente: Agenda → CRM → Visitas → Relatórios (fechar demo).
- Escalação UI + trilha Audit explícita “próximo responsável”.
- Matriz de poderes Co-Founder configurável pelo Owner.

## D — Não é necessário para a Beta 2 (recomendação)

- **Board / Investor** UI completa (papel institucional reservado — OK adiar).
- Founder Center “empresa inteira” em profundidade financeira avançada (Super+KOCC cobre Beta).
- Split Supervisor Comercial / Ops / Finance.
- Academia Agente, medalhas, exclusividade premium por produto.
- Rede social global / follow (fora do social da ficha).

---

## Conclusão honesta

O pacote **B+C** (Founder Center, Supervisor cockpit, Agente min-ops, Prestador experience, Escalação formal) está **em código** e preserva Cliente/Parceiro 🟢.

**Ainda não autorizar Beta 2** até o PO validar login real:

`Founder → Super Admin → Admin → Supervisor → Agente → Prestador → Parceiro → Cliente`

e confirmar em cada conta: missão, o que fazer hoje, o que pode, para quem escalar.

Board / Investor / Auditor / Academia / Founder financeiro profundo = **v1.1+** (explícito fora de escopo).
