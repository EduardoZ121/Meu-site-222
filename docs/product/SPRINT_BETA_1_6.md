# Sprint Beta 1.6 — Trust Governance Gate

| Campo         | Valor                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Versão**    | 1.4                                                                                        |
| **Data**      | 2026-08-09                                                                                 |
| **Natureza**  | Gate estrutural **antes** da Sprint Beta 2                                                 |
| **Objectivo** | Fechar governação + matriz operacional B+C (Founder/Supervisor/Agente/Prestador/Escalação) |

## 1. Decisão

A Beta 2 **não abre** até o critério de saída abaixo. Arquitectura de produto permanece congelada; esta sprint consolida pilares, não inventa módulos paralelos.

## 2. Entregas (código)

| Área                                                          | Migration / UI                                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Aprovação + Founders + comissão                               | `0036` · fila `/app/admin`                                                        |
| Quatro pilares (Audit, Moderação, Reputação, KOS)             | `0037` · painéis Admin                                                            |
| Ciclo completo imóvel + social + Founder ops                  | `0038` · social na ficha · Gestão Institucional no Super                          |
| Poder operacional Supervisor/Admin + atribuição               | `0039` · Central de Trabalho · acções na ficha                                    |
| Matriz B+C (Founder Center, Supervisor, Prestador, Escalação) | `0040` · modos `founder`/`service_provider` · `/app/fundador` Center · Escalações |

### Ciclo do imóvel (visível na Timeline + KOS)

`rascunho → submetido → em_analise_kai → em_analise_admin → pendente/correcoes → aprovado → janela_premium → publicado → reservado/contrato → arrendado/vendido → em_utilizacao → libertacao_prevista → disponivel_novamente → arquivado`

### Social na ficha (critério visual)

Imediatamente **abaixo da galeria de fotografias** (antes de Trust/Facts): barra  
`❤️ Gostar | ⭐ Favoritar | 💬 Comentários | ❓ Perguntar | ↗ Partilhar`  
Painéis expansíveis (não páginas novas). Partilhar: WhatsApp, copiar link, Web Share. Habitação + Património. Denúncia → Moderação.

### Founder operacional (critério visual)

Guia em **`/app/fundador`** (sem exigir `finance.manage`) · bootstrap único · Gestão Institucional com Gerir · Co-Founder por `user_id` · email dual-confirm no Centro de Segurança · `demo.*` = System Demo · identidade por `user_id`. Ver `docs/operations/FOUNDERS_ACCOUNTS.md`.

### Poder operacional por papel

- Supervisor: análise, pendência, docs/visita, Contactar Parceiro, atribuir, SLA, moderação (sem aprovar/rejeitar).
- Admin: + aprovar/rejeitar.
- Super Admin / Founder: + governação institucional.
- `/app/admin` = Central de Trabalho com buckets SLA + acções na ficha do imóvel.

## 3. Princípio transversal (encerra arquitectura funcional)

> **Toda a informação introduzida uma única vez deve ser reutilizada automaticamente por todos os módulos autorizados.**

| Fonte            | Consome                                          |
| ---------------- | ------------------------------------------------ |
| KIS / KYC        | Contratos, confiança, gates de pagamento         |
| Aprovação imóvel | Feed Habitação, Timeline, KAI, Painel Beta, KOS  |
| Social / reviews | Reputação, ICK, Moderação                        |
| ICK / Trust      | KAI hints, Trust Card                            |
| Eventos de ciclo | Timeline património + utilizador + KOS Analytics |

## 4. Critério para desbloquear Beta 2

Ops (PO):

1. Aplicar `0032` → … → `0039` → **`0040`**
2. Validar **visualmente / por papel** (critério PO — código ≠ concluído):
   - Entrar como **Founder → Super → Admin → Supervisor → Agente → Prestador → Parceiro → Cliente**
   - Em cada conta: missão, o que fazer hoje, o que pode, para quem escalar
   - Founder Center (`/app/fundador`): Pessoas / Flags / KOCC / Auditoria / Escalações
   - Supervisor: Cockpit + fila + escalação (sem aprovar/rejeitar)
   - Prestador: inbox com fluxo Pedido→…→Avaliação
3. Bootstrap Founder real (não `demo.*`) + ligar Co-Founder / Admins pela UI
4. Confirmação escrita do PO **antes** de autorizar Beta 2
5. **Não** abrir Board / Investor / Academia / Founder financeiro profundo nesta sprint

## 5. Regra permanente após Beta 2

**Não criar novas funcionalidades estruturais.**

Permitido apenas:

- correcção de bugs
- melhoria de UX / performance / segurança / confiança
- feedback dos utilizadores Beta
- métricas do KOS Analytics

Qualquer feature nova → backlog **v1.1+** com Sprint próprio.

## 6. Adiado (não bloqueia)

SLA auto-escalação contínua, exclusividade premium por produto (Encontrar Casa etc.), pesquisa global topbar, medalhas, gestão pós-remodelação completa.
