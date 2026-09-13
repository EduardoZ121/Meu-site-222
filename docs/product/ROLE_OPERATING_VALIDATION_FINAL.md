# Validação Final — Matriz Operacional (antes da Beta 2)

| Campo                    | Valor                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data**                 | 2026-08-09                                                                                                                                                                                |
| **Ambiente testado**     | Produção `https://kutekalink.com` + Supabase `vhqwitbrpqaiutjbundo`                                                                                                                       |
| **Código de referência** | branch `cursor/sprint-beta-16-trust-gov-f96b` (PR #69), commits `2e6bef7` / `8cc3504`                                                                                                     |
| **Método**               | Probes HTTP da UI em produção · Auth/REST/RPC no Supabase remoto · login demos · verificação de RLS com escrita real · contraste com `prebuilt/web-out` local · testes unitários de shell |
| **Não feito**            | Browser autenticado visual completo (sem browser MCP) · bootstrap Founder com conta real · fluxo PP→Supervisor→Admin ponta-a-ponta (infra em falta)                                       |
| **Regra PO**             | Código ≠ concluído. Beta 2 **não** autorizada neste relatório.                                                                                                                            |

---

## Veredicto

**A matriz operacional B+C NÃO está validada na plataforma real.**

O código na branch tem a implementação B+C, mas:

1. **Produção (kutekalink.com) não serve o build B+C** — `/app/fundador` → **404**; chunks novos (`page-b412…`, `fundador/page-9e49…`) → **404**; barra social ausente nos JS da ficha em prod.
2. **Supabase remoto está muito atrás das migrations 0037–0040** — faltam `founders`, `operational_escalations`, social (`property_likes` / posts), fila de publicação, auditoria, papéis `supervisor` / `founder`, permissões `properties.review` / `audit.read` / `moderation.manage` / `founder.manage`, e RPCs de chat.

Enquanto deploy + migrations não estiverem aplicados e revalidados, **convidar utilizadores reais para Beta 2 é bloqueado**.

---

## 1. Teste por papel (prática no ambiente real)

### Contas usadas

| Conta                        | Login remoto | Papéis remotos                                                                                                               |
| ---------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `demo.cliente@kuteka.local`  | 🟢           | `client`                                                                                                                     |
| `demo.parceiro@kuteka.local` | 🟢           | `patrimonial_partner`                                                                                                        |
| `demo.dual@kuteka.local`     | 🟢           | `client` + `patrimonial_partner`                                                                                             |
| `demo.agente@kuteka.local`   | 🟢           | `certified_agent`                                                                                                            |
| `demo.admin@kuteka.local`    | 🟢           | `administrator`                                                                                                              |
| `demo.super@kuteka.local`    | 🟢           | `super_administrator` (+ client + partner)                                                                                   |
| Supervisor dedicado          | 🔴           | papel **inexistente** no catálogo remoto                                                                                     |
| Founder/Owner real           | 🔴           | tabela `founders` **inexistente**                                                                                            |
| Prestador dedicado           | 🔴           | role `service_provider` existe no catálogo, mas **nenhuma demo** com esse papel; PP demo está linked a 2 `service_providers` |

Password demos (doc): `DemoKuteka2026!`

### Matriz por papel

| Papel             | Quem sou / missão / dashboard / menu / tarefas                                                                                                   | Ações executáveis no real                             | Escalação                  | Notificações                                   | Auditoria          | Estado           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------- | ---------------------------------------------- | ------------------ | ---------------- |
| **Founder/Owner** | Não testável: sem `founders`, sem role `founder`, `/app/fundador` 404 em prod                                                                    | Bootstrap/promote RPCs 404                            | N/A                        | N/A                                            | N/A                | 🔴               |
| **Super Admin**   | Login OK; UI Super `/app/super` 200; perms finance/admin presentes; **também** tem `properties.manage` + roles client/partner (desvio da matriz) | Super surface existe; KOCC/flags/founders tables 404  | RPC escalação 404          | Catálogo UI estático (não validado persistido) | `audit_events` 404 | 🔴/🟡            |
| **Admin**         | Login OK; `/app/admin` 200; **falta** `properties.review` / `audit.read` / `moderation.manage` no remoto; tem `properties.manage`                | Fila/decisão publicação RPC 404                       | 404                        | Idem                                           | 404                | 🔴               |
| **Supervisor**    | Papel ausente no DB; sem conta; UI B+C não deployada                                                                                             | N/A                                                   | N/A                        | N/A                                            | N/A                | 🔴               |
| **Agente**        | Login OK; `/app/agente` 200; `agent_assignments` vazio; **sem** `housing.explore` remoto                                                         | Hub abre; pipeline real vazio                         | Sem workflow formal remoto | Estático                                       | 404                | 🟡               |
| **Prestador**     | Sem conta `service_provider`; UI B+C não em prod; `marketplace_my_context` OK para cliente (não-provider)                                        | Ciclo Pedido→… não validado com provider real         | N/A                        | Estático                                       | —                  | 🔴               |
| **Parceiro**      | Login OK; patrimónios próprios editáveis; isolamento escrita OK                                                                                  | Publicar/editar próprio 🟢                            | —                          | Estático                                       | 404                | 🟡→🟢 ops básico |
| **Cliente**       | Login OK; `housing.explore` OK; social RPCs 404                                                                                                  | Explorar inventário activo 🟢; social/persistência 🔴 | —                          | Estático                                       | 404                | 🟡               |

---

## 2. Cadeia de escalação Supervisor → Admin → Super → Founder

| Passo                                                          | Resultado                                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Supervisor cria escalação                                      | 🔴 Impedido — sem papel Supervisor + tabela/RPC `operational_escalations` ausentes |
| Admin recebe / trata / re-escala                               | 🔴 Impedido                                                                        |
| Super recebe                                                   | 🔴 Impedido                                                                        |
| Founder recebe só decisão institucional                        | 🔴 Impedido                                                                        |
| Responsável, estado, prioridade, prazo, notificação, auditoria | 🔴 Só existem em SQL da migration `0040` **não aplicada**                          |

**Conclusão escalação:** 🔴 FALHOU no ambiente real.

---

## 3. Limites / segurança (tentativas deliberadas)

| Tentativa                                        | Resultado medido                                                                                                     | Class.             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Cliente PATCH título de imóvel de outro owner    | HTTP 200 `[]` · título **não** alterou                                                                               | 🔒 bloqueado (RLS) |
| Agente PATCH imóvel de PP                        | Idem · sem alteração                                                                                                 | 🔒 bloqueado       |
| Parceiro PATCH imóvel de outro owner real        | Idem · sem alteração                                                                                                 | 🔒 bloqueado       |
| Parceiro PATCH o próprio imóvel                  | 200 com row · update OK                                                                                              | 🟢 permitido       |
| Agente chama `admin_decide_property_publication` | 404 função inexistente (não dá para provar deny vs missing)                                                          | 🟡 infra em falta  |
| Cliente chama `create_operational_escalation`    | 404 função inexistente                                                                                               | 🟡 infra em falta  |
| Supervisor aprovar/rejeitar                      | 🔴 Não testável (sem Supervisor + sem RPC) — gate existe **só no código** (`0039` + UI)                              | 🔴 não validado    |
| Agente / Cliente aceder Admin via UI             | Rotas `/app/admin` 200 (HTML estático); gate efectivo depende de sessão JS — **não** validado em browser autenticado | 🟡                 |
| Admin acções exclusivas Founder                  | RPCs founder 404                                                                                                     | 🔴 não validado    |
| Super alterar privilégios Owner                  | Sem `founders` / promote                                                                                             | 🔴 não validado    |
| Contas `demo.*` como Founder                     | Regra no SQL `0040`/`0038` — **não aplicada** no remoto                                                              | 🔴 não validado    |

---

## 4. Continuidade entre papéis (PP → … → Cliente → Agente)

Fluxo pedido: PP publica → KAI → Supervisor → pendência → PP corrige → Admin aprova → premium → publicação → Cliente → Agente visita.

| Etapa                                            | Estado no real                                              |
| ------------------------------------------------ | ----------------------------------------------------------- |
| PP tem patrimónios / lifecycle `publicado`       | 🟢 dados demo existem                                       |
| Fila `property_publication_reviews` / decide RPC | 🔴 ausente                                                  |
| Supervisor / pendência / Contactar PP            | 🔴 ausente                                                  |
| Chat / mensagens imóvel                          | 🔴 RPCs `kuteka_chat_*` 404                                 |
| Admin aprova                                     | 🔴 ausente                                                  |
| Janela premium / ciclo                           | 🟡 campos lifecycle existem em properties; workflow ops não |
| Cliente interage (social)                        | 🔴 RPCs social 404                                          |
| Agente recebe visita / assignments               | 🔴 `agent_assignments` vazio; sem fluxo ligado              |

**Conclusão continuidade:** 🔴 FALHOU como processo ponta-a-ponta.

---

## 5. Comunicação

| Canal                                           | Resultado                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Notificações por papel                          | 🟡 catálogo estático no código/shell; sem tabela `notifications` remota |
| Chat / mensagens                                | 🔴 `kuteka_chat_*` 404                                                  |
| Mensagens relacionadas ao imóvel                | 🔴                                                                      |
| Escalações                                      | 🔴                                                                      |
| Pedidos de correção / atribuição / respostas PP | 🔴 (fila publicação ausente)                                            |
| Cliente ↔ Agente/PP                             | 🔴 chat ausente no remoto                                               |

---

## 6. Social da ficha

| Item                                                                                   | Produção                                               | Prebuilt local (branch)   | Persistência remota                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------- | ------------------------------------- |
| Barra sob galeria (Gostar · Favoritar · Comentários · Perguntar · Avaliar · Partilhar) | 🔴 strings **ausentes** nos chunks da ficha em prod    | 🟢 presente no bundle B+C | —                                     |
| Gostar / Favoritar / Comentário / Pergunta / Denúncia                                  | 🔴 RPC 404                                             | UI no bundle              | 🔴 tabelas/RPCs ausentes              |
| Avaliar                                                                                | Não exercitado (depende `contract_reviews` / contrato) | —                         | `contracts` table 404 no schema cache |
| WhatsApp / copiar link / Web Share                                                     | Não validado em browser                                | Client-only no código     | N/A (sem DB)                          |

**Conclusão social:** 🔴 FALHOU na plataforma real (UI não deployada + backend ausente).

---

## 7. Founder real

| Critério                                          | Resultado                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Conta real → `user_id` → `founders`               | 🔴 tabela `founders` inexistente                                                   |
| Founder/Owner reconhecido                         | 🔴                                                                                 |
| `/app/fundador`                                   | 🔴 404 em produção                                                                 |
| Gestão Institucional / Co-Founder / Super / Admin | 🔴 RPCs `founder_*` 404                                                            |
| Auditoria institucional                           | 🔴 `audit_events` 404                                                              |
| Alteração segura de email                         | 🟡 Centro Segurança rota existe; dual-confirm Founder **não** validado sem Founder |
| `demo.*` excluídas de bootstrap                   | 🔴 regra só no SQL não aplicado                                                    |

---

## 🟢 PASSOU (realmente validado)

- Login das 6 contas demo no Supabase de produção.
- RLS de escrita em `properties`: Cliente/Agente/outro PP **não** alteram património alheio; PP altera o próprio.
- Rotas base em prod respondem 200: `/app`, `/app/admin`, `/app/super`, `/app/agente`, `/app/servicos`.
- Inventário activo de properties legível; lifecycle_status presente em alguns registos.
- `marketplace_my_context` responde para Cliente.
- Bundle **local** `prebuilt/web-out` da branch contém Founder Center / strings B+C.
- Testes unitários shell (role-experience / matrix / nav): 22/22 OK (gates de código).

## 🟡 PARCIAL

- Parceiro / Cliente: operação básica de inventário/conta, sem fecho da matriz (social, chat, contratos table, auditoria).
- Agente: login + rota hub; sem assignments nem fluxo Agenda→Relatórios persistido.
- Super/Admin: login + rotas; permissões desalinhadas da matriz (`properties.manage` no Admin/Super; falta `properties.review`).
- Notificações: só catálogo estático de UI.
- Prestador: infrastructure parcial (`service_providers` / `service_orders`); sem experiência/role dedicada validada.

## 🔴 FALHOU

- Deploy produção ≠ build B+C (`/app/fundador` 404; social ausente).
- Migrations críticas **não aplicadas** (pelo menos 0037–0040 e dependências: founders, social, publication queue, audit, escalations, supervisor/founder roles).
- Escalaão formal ponta-a-ponta.
- Social persistente.
- Chat / mensagens.
- Continuidade PP→Supervisor→Admin→Cliente→Agente.
- Founder real / Gestão Institucional.
- Supervisor como papel operacional.
- Prestador como experiência própria.
- Auditoria de acções críticas.

## 🔒 SEGURANÇA

**Bloqueado correctamente (medido):**

- Updates cross-owner em `properties` (RLS).

**Não validável / risco até migrations:**

- Supervisor approve/reject (gate só em código).
- Founder-only promote / anti-demo.
- Escalação indevida.
- Admin sem `properties.review` mas **com** `properties.manage` — desalinhamento grave face à matriz (Admin parece “parceiro”).
- Super demo acumula client+partner+super — cockpit pode voltar a misturar missões se o lens B+C não estiver deployado.
- Chat/social/admin decide: falham por ausência, não por deny explícito observável.

## 📱 UX

- Em produção, Founder Center inacessível (404) — rota crítica da matriz.
- Ficha em prod sem barra social visível nos assets servidos.
- Sem browser autenticado: não foi possível classificar tipografia/menus difíceis além do 404 e da ausência de social.

## 🐛 BUGS / GAPS OBJECTIVOS

1. **Prod desactualizada** face ao `prebuilt` da branch B+C.
2. **Schema remoto incompleto** — falta bloco Trust Gov / matriz (0037–0040+).
3. **Sem papel `supervisor` / `founder`** no catálogo remoto.
4. **Admin remoto sem `properties.review`**, com `properties.manage`.
5. **Chat RPCs ausentes** apesar da UI `/app/mensagens`.
6. **Social RPCs/tabelas ausentes**.
7. **Escalations ausentes**.
8. **Sem demo Supervisor / Prestador / Founder** para validação operacional.
9. `contracts` não exposto no schema cache (bloqueia validação de avaliações/contratos).
10. `agent_assignments` vazio — Agente sem trabalho real.

## 🚫 BLOQUEADORES DA BETA 2

1. **Aplicar e verificar migrations** até `0040` (e dependências 0036–0039) no Supabase de produção.
2. **Deploy do `prebuilt/web-out` B+C** para `kutekalink.com` (fundador + social + cockpits).
3. **Revalidação autenticada em browser** dos 8 papéis + cadeia de escalação + social persistente + 1 fluxo PP→Admin→Cliente.
4. **Conta Founder real** (não demo) com Gestão Institucional e auditoria.
5. **Papel Supervisor** atribuído a conta de teste e gates approve/reject comprovados UI+RPC.
6. **Chat operacional** disponível no remoto (ou decisão explícita de adiar comunicação — hoje é bloqueador do processo contínuo).

---

## O que NÃO autoriza Beta 2

- Código em branch/PR ou mesmo em `main`.
- Testes unitários verdes.
- Bundle local correcto.
- Login demo sem a matriz completa.

**Beta 2 só depois do PO repetir esta checklist na plataforma já migrada e deployada.**

## Próximo passo recomendado (ops — sem novas features)

1. `supabase db push` / aplicar `0032`→`0040` no project `vhqwitbrpqaiutjbundo`.
2. Deploy Render a partir do `prebuilt/web-out` da PR #69.
3. Criar/promover contas de teste: Founder real, Supervisor, Prestador (não demo para Founder).
4. Repetir este relatório com evidências de browser (screenshots) por papel.
