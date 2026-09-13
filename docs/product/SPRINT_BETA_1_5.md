# Sprint Beta 1.5 — Confiança e Comunicação

| Campo         | Valor                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| **Versão**    | 1.1                                                                           |
| **Data**      | 2026-08-06                                                                    |
| **Natureza**  | Sub-sprint intercalar entre Beta 1 (preparação) e Beta 2 (lançamento público) |
| **Objectivo** | Chat integrado + reputação/Trust Card visíveis em toda a navegação            |
| **Fontes**    | [SPRINT_BETA_CHARTER.md](./SPRINT_BETA_CHARTER.md) · Missão PO 2026-08-06     |

## 1. Objectivo de negócio

A Kuteka é uma plataforma baseada em **confiança**. Antes do Beta Público (Sprint Beta 2), o utilizador deve:

1. Comunicar **dentro** da Kuteka (sem WhatsApp/telefone no primeiro contacto).
2. Ver **reputação verificável** em cartões, fichas e perfis (Trust Card + avaliações).

Critério de sucesso mensurável:

- Inbox `/app/mensagens` operacional + ícone na topbar com não lidas.
- Trust Card visível na ficha do imóvel e no perfil.
- Estrelas/ICK nos cartões de habitação quando houver dados.
- Utilizador final nunca vê “Demo”; contactos pessoais não são expostos por defeito.

## 2. Escopo incluído

### A. Chat Kuteka (Prioridade Máxima)

- Migration `0033_kuteka_chat_trust.sql` — conversas, participantes, mensagens, RPCs, RLS.
- Pares permitidos (Cliente↔Parceiro/Agente, Parceiro↔Agente/Admin, Prestador com contrato, Admin/SuperAdmin↔qualquer).
- Contactos só após contrato activo/concluído (ou autorização explícita).
- UI: topbar, `/app/mensagens`, CTA “Mensagem” nas fichas.
- Flag KOCC `kuteka_chat` (beta_public).

### B. Trust & Reputation

- Migration `0034_kuteka_trust_reputation.sql` — RPCs de resumo de reputação.
- **Trust Card** (ICK, ⭐ média, contratos, tempo de resposta, KIS, membro desde, última actividade).
- Visível em: ficha (Showcase), cartão (estrelas/ICK), perfil.
- Linha temporal de avaliações: data, assunto, “Contrato confirmado”, dimensões, respostas.
- Hints KAI a partir das avaliações (1–2 frases sob o Trust Card).

## 3. Fora de escopo (adiado)

- Chat em tempo real (websockets) / anexos multimédia no chat.
- Partilha automática de telefone/email sem contrato.
- Dimensões de avaliação obrigatórias por entidade em todos os fluxos.
- Painel Executivo de reputação global (Super Admin) — Sprint futura.

## 4. Ops (PO)

Aplicar no Supabase remoto, por ordem:

1. `0033_kuteka_chat_trust.sql`
2. `0034_kuteka_trust_reputation.sql`

## 5. Critério de saída → Sprint Beta 2

- [x] Chat MVP no código + deploy estático
- [x] Trust Card + reputação visível
- [ ] Migrations `0033`/`0034` aplicadas no remoto (PO)
- [ ] Smoke manual: abrir conversa + ver Trust Card numa ficha

**Próximo:** [Sprint Beta 1.5B — Preparação para Utilizadores Reais](./SPRINT_BETA_1_5_PREP.md), depois Sprint Beta 2.
