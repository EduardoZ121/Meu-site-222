# Arquitetura Financeira da Kuteka

**Versão:** 1.0  
**Estado:** Aprovado como referência oficial de monetização  
**Data:** 2026-08-05  
**Produto:** Kuteka / KEOS — plataforma de gestão patrimonial  
**Âmbito:** Angola (go-to-market) com arquitectura preparada para expansão internacional  
**Audiência:** Product Owner, Super Administrador, engenharia, operações, parceiros estratégicos

---

## 1. Propósito deste documento

Este documento é a **base financeira oficial** da plataforma Kuteka.

Define:

1. a filosofia de rendimento;
2. todas as fontes de receita;
3. quem paga cada serviço e quando;
4. como o dinheiro circula entre Cliente, Parceiro Patrimonial, Prestador e Kuteka;
5. o funcionamento do Ledger, Kuteka Pay, Kuteka Credits e comissões;
6. regras de reembolso, cancelamento e parametrização;
7. o papel do Super Administrador (`/app/super`);
8. a evolução futura para carteira digital (escrow), **sem a implementar nesta fase**.

**Regra de ouro:** nenhuma funcionalidade de monetização pode ser implementada em conflito com este documento. Alterações estruturais exigem nova versão (v1.1+) e decisão do Product Owner.

Documentos irmãos:

- Manual Operacional Kuteka
- Diretriz Estratégica / “Como Render com a Kuteka”
- Core v1.0 (congelado) — monetização vive **fora** do Core como módulos N1→N5
- ADR-014 / PRD-009 (Identidade Real / KYC)
- ADR futuros da Fase Financeira

---

## 2. Visão estratégica

### 2.1 Objectivo

A Kuteka **não** deve parecer cara.

O objectivo é construir um **ecossistema** em que:

- o Cliente sente que quase tudo é **gratuito ou muito acessível**;
- a maior parte da receita vem de **Parceiros Patrimoniais, Prestadores, Bancos, Seguradoras, Empresas, Investidores** e **comissões sobre serviços concluídos**;
- a plataforma escala internacionalmente sem refazer a arquitectura financeira.

### 2.2 Modelo B2B2C

| Sigla     | Significado                                                  | Papel na Kuteka                                                     |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| **B2C**   | Empresa → Consumidor final                                   | Cliente paga **pouco** e só em serviços de alto valor               |
| **B2B**   | Empresa → Empresa                                            | Parceiros, prestadores, bancos, etc. geram a **maioria** da receita |
| **B2B2C** | Empresa serve o consumidor **através** de empresas parceiras | Estratégia oficial da Kuteka                                        |

**Em linguagem simples:** o Cliente usa a plataforma; quem paga o grosso do negócio são as empresas que ganham com esse Cliente.

### 2.3 Princípios não negociáveis

1. **Explorar, pesquisar, favoritos, criar conta e notificações básicas = sempre gratuitos.**
2. **Pay-per-use** para serviços especializados (só paga quem usa).
3. **Kuteka Plus** opcional (nunca obrigatório).
4. **Fase 1: sem carteira própria / sem escrow** — Kuteka não guarda dinheiro do Cliente.
5. **Toda regra financeira é parametrizável** pelo Super Admin (sem alterar código).
6. **Ledger primeiro** — nenhuma cobrança sem registo auditável.
7. **KYC / Identidade Real** alimenta faturação e confiança comercial.
8. **Arquitectura multi-moeda, multi-país, multi-gateway** desde o dia 1.
9. **Shell / UX premium** não regride por causa de monetização.
10. **KAI** actua também como gestor comercial (sugestões, previsões, upsell ético).

---

## 3. Glossário

| Termo                      | Definição simples                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Ledger Financeiro**      | “Livro-razão” digital: lista todas as operações monetárias (taxas, comissões, créditos, reembolsos).                          |
| **Kuteka Pay**             | Camada de pagamento da plataforma: escolhe gateway, inicia pagamento, confirma estado, regista no Ledger. **Não** é um banco. |
| **Gateway**                | Empresa externa que processa o pagamento (Multicaixa, EMIS, Stripe, banco…).                                                  |
| **Sandbox**                | Ambiente de testes sem dinheiro real.                                                                                         |
| **Catálogo de Produtos**   | Lista oficial de tudo o que se pode vender (serviços, planos, comissões).                                                     |
| **Motor de Preços**        | Motor que calcula o valor a cobrar com base em regras configuráveis (urgência, país, promoção…).                              |
| **Kuteka Credits**         | Créditos internos (saldo promocional) usados dentro da plataforma; não são dinheiro levantável na Fase 1.                     |
| **Comissão (take-rate)**   | Percentagem ou valor fixo que a Kuteka retém sobre um serviço concluído.                                                      |
| **Split**                  | Divisão automática do valor entre destinatário e Kuteka (quando o gateway o permitir).                                        |
| **Escrow**                 | Modelo futuro em que a Kuteka **segura** o dinheiro temporariamente — **fora da Fase 1**.                                     |
| **Revenue Command Center** | Painel do Super Admin para controlar receita, preços e campanhas.                                                             |
| **ICK**                    | Índice de Confiança Kuteka (reputação).                                                                                       |
| **PDK**                    | Passaporte Digital do património (imóvel).                                                                                    |
| **Super Admin**            | Conta com controlo estratégico total (`/app/super`).                                                                          |
| **Admin operacional**      | Conta de administração do dia-a-dia (`/app/admin`).                                                                           |

---

## 4. Papéis e quem paga

### 4.1 Stakeholders financeiros

| Stakeholder                            | Paga?                            | Recebe?                      | Notas                 |
| -------------------------------------- | -------------------------------- | ---------------------------- | --------------------- |
| **Visitante**                          | Não                              | Não                          | Só navega             |
| **Cliente**                            | Pouco / opcional                 | Créditos, cashback, serviços | Nunca obrigado a Plus |
| **Parceiro Patrimonial**               | Planos, destaques, gestão        | Rendas, vendas (via fluxos)  | Principal fonte B2B   |
| **Agente Certificado**                 | Academia / certificação (futuro) | Comissões de mediação        |                       |
| **Prestador de serviços**              | Adesão / lead / take-rate        | Pagamento do serviço         | Marketplace           |
| **Empresa / Relocation / Construtora** | Pacotes B2B                      | Eficiência operacional       |                       |
| **Banco / Seguradora**                 | Comissão / API / leads           | Clientes convertidos         |                       |
| **Kuteka**                             | —                                | Comissões, planos, fees      | Plataforma            |
| **Super Admin**                        | —                                | Controlo                     | Não é fluxo monetário |

### 4.2 Quem pode alterar preços

| Acção                                                                    | Quem                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Criar/editar produtos, preços, comissões, campanhas, limites, reembolsos | **Apenas Super Administrador**                                            |
| Aplicar preço vigente a um pedido                                        | Sistema (Motor de Preços)                                                 |
| Ver preços públicos / orçamentos                                         | Utilizador autenticado (conforme produto)                                 |
| Admin operacional                                                        | Pode **ver** e executar operações; **não** altera grelha de preços global |

Todas as alterações de preço geram **auditoria** (quem, quando, valor antigo → novo).

---

## 5. Fontes de receita (matriz oficial)

### 5.1 Pilares

1. **Comissões tradicionais** — venda, arrendamento, gestão patrimonial.
2. **Pay-per-use** — serviços especializados sob pedido.
3. **Subscrição opcional** — Kuteka Plus (Cliente / Investidor / Empresa / Parceiro).
4. **Comissões B2B de prestadores** — take-rate sobre serviços concluídos.
5. **Parcerias financeiras** — bancos, seguros, crédito.
6. **Publicidade inteligente** — altamente segmentada, não agressiva.
7. **Tecnologia / dados** — Analytics, API, licenciamento (fase avançada).
8. **Academia / certificação** — formação paga a agentes e prestadores.

### 5.2 Matriz resumida (quem / quando / como)

| Serviço / fonte                   | Quem paga                                  | Quando                  | Como (evento)            | Destino típico do valor |
| --------------------------------- | ------------------------------------------ | ----------------------- | ------------------------ | ----------------------- |
| Explorar / favoritos / conta      | Ninguém                                    | —                       | Grátis                   | —                       |
| Mudança Inteligente               | Cliente (e/ou Empresa B2B)                 | Abertura + sucesso      | Pay-per-use              | Kuteka (taxa)           |
| Encontrar Casa (prioritário)      | Cliente / Empresa                          | Pedido ou mensal (Plus) | Pay-per-use / Plus       | Kuteka                  |
| Concierge                         | Cliente ou B2B; ou comissão a fornecedores | Pacote / prestações     | Pay-per-use + B2B        | Kuteka + Prestadores    |
| Garantia Kuteka                   | Cliente (opcional)                         | Mensalidade / adesão    | Plus / produto           | Kuteka                  |
| Assistência 24h                   | Cliente ou via Plus; comissão prestador    | Por ordem de serviço    | Take-rate                | Prestador + Kuteka      |
| Kuteka Casa+ (fidelidade)         | Indirecto (mais uso)                       | —                       | Retenção                 | Receita induzida        |
| Planos Parceiro (Bronze→Platinum) | Parceiro Patrimonial                       | Mensal / anual          | B2B subscrição           | Kuteka                  |
| Destaque / Venda rápida           | Parceiro                                   | Compra de campanha      | Pay-per-use B2B          | Kuteka                  |
| Gestão Total / Value+             | Parceiro                                   | Contrato de gestão      | % renda / fee            | Kuteka (+ agentes)      |
| Manutenção preventiva             | Parceiro / Cliente                         | Plano ou OS             | Take-rate                | Prestador + Kuteka      |
| Rede de prestadores               | Prestador                                  | Adesão + por serviço    | B2B + take-rate          | Kuteka                  |
| Seguros / Internet / Solar…       | Prestador / parceiro comercial             | Conversão               | Comissão B2B             | Kuteka                  |
| Avaliação / foto / staging        | Parceiro ou Cliente                        | Conclusão               | Pay-per-use              | Prestador + Kuteka      |
| Publicidade inteligente           | Anunciante B2B                             | Campanha                | CPM/CPC/CPA configurável | Kuteka                  |
| Leads qualificados                | Parceiro / banco                           | Lead aceite             | CPA                      | Kuteka                  |
| Analytics / relatórios            | Empresa / banco                            | Compra / subscrição     | B2B                      | Kuteka                  |
| Academia                          | Agente / Prestador                         | Curso / certificação    | Pay-per-use              | Kuteka                  |
| Kuteka Plus                       | Utilizador opt-in                          | Mensal                  | Subscrição               | Kuteka (+ créditos)     |

Valores em Kz (e outras moedas) **não estão hardcoded** neste documento: vivem no **Motor de Preços** / Super Admin, com seeds sugeridos na secção 12.

---

## 6. Camadas da arquitectura financeira

```
┌─────────────────────────────────────────────────────────────┐
│  Super Admin (/app/super) — Revenue Command Center          │
│  Preços · Comissões · Campanhas · Feature flags · Auditoria │
└────────────────────────────┬────────────────────────────────┘
                             │ configura
┌────────────────────────────▼────────────────────────────────┐
│  Catálogo de Produtos  +  Motor de Preços  +  Promoções     │
└────────────────────────────┬────────────────────────────────┘
                             │ gera cobrança
┌────────────────────────────▼────────────────────────────────┐
│  Kuteka Pay (orquestrador)                                   │
│  Gateways: Multicaixa · EMIS · Banco · Cartão · Stripe · …  │
└───────────────┬─────────────────────────────┬───────────────┘
                │ confirma                    │ falha / pendente
┌───────────────▼───────────────┐   ┌─────────▼───────────────┐
│  Ledger Financeiro            │   │  Retry / reconciliação  │
│  + Comissões + Credits        │   │                         │
└───────────────┬───────────────┘   └─────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│  Faturação / Recibos  ·  Notificações  ·  KAI comercial      │
└─────────────────────────────────────────────────────────────┘
```

### 6.1 Componentes autorizados (Fase 1–2)

| Componente                      | Função                                   |
| ------------------------------- | ---------------------------------------- |
| Ledger Financeiro               | Fonte de verdade de movimentos           |
| Catálogo de Produtos e Serviços | SKUs vendáveis                           |
| Motor de Preços                 | Cálculo dinâmico                         |
| Kuteka Pay                      | Orquestração de gateways                 |
| Kuteka Credits                  | Saldo promocional interno                |
| Sistema de Comissões            | Regras e splits                          |
| Faturação e recibos             | Documentos fiscais / comerciais          |
| Consentimentos / Opt-in         | Base legal para recomendações comerciais |
| Revenue Command Center          | UI Super Admin de receita                |
| Service Health                  | Ligar/desligar serviços                  |
| Fraud & Abuse                   | Anti-abuso                               |
| KAI Rules Editor                | Regras comerciais da KAI                 |
| Exportação contabilística       | CSV/PDF para contabilidade               |
| CRM Parceiros e Prestadores     | Pipeline B2B                             |

---

## 7. Ledger Financeiro

### 7.1 Princípio

Toda operação com valor económico gera **pelo menos um lançamento** no Ledger (imutável após confirmação; correcções via lançamento inverso / ajuste).

### 7.2 Tipos de lançamento (v1)

| Tipo                 | Descrição                                                    |
| -------------------- | ------------------------------------------------------------ |
| `charge`             | Cobrança a um pagador                                        |
| `commission`         | Comissão da Kuteka                                           |
| `payout_instruction` | Instrução de pagamento ao destinatário (sem custódia Kuteka) |
| `credit_grant`       | Atribuição de Kuteka Credits                                 |
| `credit_redeem`      | Uso de créditos                                              |
| `refund`             | Reembolso                                                    |
| `adjustment`         | Ajuste manual Super Admin (auditado)                         |
| `fee`                | Taxa de gateway / taxa operacional                           |
| `writeoff`           | Perda / cancelamento contabilístico                          |

### 7.3 Campos mínimos de um lançamento

- `id`, `created_at`, `currency`, `amount`
- `payer_type` / `payer_id`
- `payee_type` / `payee_id`
- `product_code` / `order_id` / `service_request_id`
- `status`: `pending` | `authorized` | `captured` | `failed` | `refunded` | `cancelled`
- `gateway`, `gateway_ref`, `country_code`
- `metadata` (json), `created_by`, `audit_hash`

### 7.4 Reconciliação

- Diária (automática): comparar estados gateway ↔ Ledger.
- Super Admin: ecrã de discrepâncias + resolução.
- Exportação contabilística: períodos mensais / custom.

---

## 8. Kuteka Pay (Fase 1 — sem carteira)

### 8.1 O que é

Orquestrador de pagamentos: cria intenção de pagamento, encaminha ao gateway, recebe webhooks/confirmações, actualiza Ledger e notifica módulos.

### 8.2 O que **não** é (Fase 1)

- Não guarda saldo do utilizador.
- Não funciona como banco.
- Não faz escrow.
- Não liberta fundos “do bolso Kuteka” para terceiros (exceto quando o gateway faz split nativo).

### 8.3 Fluxo padrão (pay-per-use)

1. Utilizador escolhe serviço → Motor de Preços calcula valor.
2. Sistema cria `PaymentIntent` + linhas Ledger `pending`.
3. Kuteka Pay selecciona gateway (país, método, disponibilidade).
4. Utilizador paga no gateway (ou gera referência bancária).
5. Confirmação → Ledger `captured` + fatura/recibo + activação do serviço.
6. Se aplicável: registo de comissão Kuteka e instrução de liquidação ao destinatário.

### 8.4 Gateways (prontos na arquitectura; sandbox até activação)

| Gateway                             | Mercado                  | Estado inicial                                 |
| ----------------------------------- | ------------------------ | ---------------------------------------------- |
| Multicaixa Express                  | Angola                   | Adapter + sandbox                              |
| EMIS                                | Angola                   | Adapter + sandbox                              |
| Referência / transferência bancária | Angola                   | Adapter (comprovativo + validação Admin/Super) |
| Cartões locais                      | Angola                   | Via parceiro/EMIS quando disponível            |
| Stripe                              | Internacional / diáspora | Adapter + sandbox                              |
| Wise                                | Remessas / diáspora      | Adapter futuro                                 |
| Extensível                          | —                        | Interface `PaymentGateway`                     |

**Enquanto não houver conta comercial:** todos os fluxos correm em **Sandbox**, com seed demo e UI clara “ambiente de teste”.

### 8.5 Split de comissão (Fase 1)

Quando o gateway **não** faz split automático:

1. Pagamento total pode ir ao destinatário **ou** processar-se como duas cobranças (serviço + taxa), conforme produto.
2. Alternativa B2B preferida: Cliente paga o prestador/parceiro; Kuteka fatura **comissão separada** ao B2B.
3. Preferência estratégica: **não encarecer o Cliente**; cobrar o lado B2B sempre que possível.

---

## 9. Kuteka Credits

### 9.1 Definição

Unidade interna de valor promocional (`KTC`), conversível **apenas** em produtos Kuteka elegíveis.

### 9.2 Regras Fase 1

- 1 KTC ≡ 1 unidade da moeda base do país (ex.: 1 Kz em AO) — taxa configurável.
- **Não levantáveis** para IBAN na Fase 1.
- Podem expirar (regra Super Admin).
- Uso parcial permitido.
- Não acumulam juros.
- Concedidos por: campanhas, fidelidade Casa+, reembolsos parciais, Super Admin, B2B.
- Ledger: `credit_grant` / `credit_redeem`.

### 9.3 Objectivo comercial

Parecer generoso e reter o utilizador **dentro** do ecossistema, sem saída de caixa real.

---

## 10. Catálogo de Produtos e Motor de Preços

### 10.1 Produto (SKU)

Cada item vendável tem:

- `code` (ex.: `smart_move.urgent_15`)
- `name`, `description`, `category`
- `buyer_roles` (quem pode comprar)
- `pricing_model`: `fixed` | `percentage` | `tiered` | `subscription` | `commission`
- `currency` / `country`
- `tax_code`
- `refund_policy_id`
- `active` (Service Health)
- `kai_suggestible` (sim/não)

### 10.2 Motor de Preços

Inputs típicos:

- país, moeda, segmento (Cliente / Parceiro / Empresa);
- urgência (90 / 60 / 30 / 14 dias);
- Plano Plus activo;
- créditos disponíveis;
- campanha / cupão;
- ICK / categoria do parceiro (descontos de fidelidade);
- quantidade / duração.

Output: `PriceQuote` imutável (snapshot) ligado ao pedido — **o preço cotado no momento da compra prevalece**, mesmo que o Super Admin mude a grelha depois.

### 10.3 Parametrização (sem código)

Super Admin configura:

- preços e percentagens;
- comissões e mínimos/máximos;
- promoções e campanhas;
- urgências;
- créditos e limites;
- reembolsos e cancelamentos;
- regras de cobrança (adesão, sucesso, mensalidade, evento).

---

## 11. Modelo comercial híbrido (gratuito / pay-per-use / Plus)

### 11.1 Gratuito (sempre)

- Explorar imóveis
- Pesquisar / filtros
- Favoritos
- Criar conta / onboarding
- Notificações básicas
- Consultar património próprio (papéis autorizados)
- Checklist Confiança / início de KYC

### 11.2 Pay-per-use (exemplos)

Mudança Inteligente, Encontrar Casa prioritário, Concierge, contratos premium, avaliações, fotografia, home staging, limpeza, mudanças físicas, reservas especiais, etc.

### 11.3 Kuteka Plus (opcional)

Destinado a utilizadores frequentes, investidores, empresas e parceiros.

Pode incluir (configurável):

- prioridade na procura;
- descontos em pay-per-use;
- assistência dedicada;
- créditos mensais;
- relatórios avançados;
- vantagens exclusivas.

**Nunca obrigatório.** Cancelável. Sem bloqueio das funções gratuitas.

---

## 12. Serviços prioritários — regras financeiras (Fase 3)

### 12.1 Mudança Inteligente

| Urgência    | Prazo      | Nível operacional | Lógica de preço |
| ----------- | ---------- | ----------------- | --------------- |
| Planeada    | 61–90 dias | Procura normal    | Taxa baixa      |
| Prioritária | 31–60 dias | Intensiva         | Médio           |
| Urgente     | 15–30 dias | Equipa dedicada   | Alto            |
| Emergência  | 1–14 dias  | Máxima prioridade | Premium         |

**Cobrança recomendada (parametrizável):**

- Taxa de **abertura** (não 100% antecipado).
- Taxa de **sucesso** só se a Kuteka encontrar solução aceite.
- Reembolso parcial / créditos se falhar (política por nível).

**Efeitos no ecossistema:** Cliente → KAI procura → Parceiro recebe previsão → Agente tarefa → Marketplace serviços → Financeiro previsões → Admin/Super acompanham → PDK histórico.

### 12.2 Pagamentos Kuteka (rendas / serviços)

- Lembretes automáticos (D-5, D-3, D-1, D0, pós-atraso).
- Canais: in-app, email, WhatsApp/SMS (quando integrados).
- Cobrança amigável assistida por KAI (sem assédio).
- Comissão B2B preferencial ao Parceiro pela gestão de cobrança.

### 12.3 Rede de Prestadores + Marketplace

- Mesma arquitectura financeira para **qualquer** serviço futuro (seguros, internet, solar, decoração, jurídico, crédito…).
- Take-rate por categoria (Super Admin).
- Cliente vê preço do prestador; comissão Kuteka preferencialmente **do lado B2B**.

### 12.4 Planos Parceiro Patrimonial

Base (grátis publicação limitada) → Bronze → Silver → Gold → Platinum (gestão integral).  
Preços e benefícios 100% configuráveis.

---

## 13. Reembolsos e cancelamentos

### 13.1 Princípios

- Política **por produto** (`refund_policy_id`).
- Transparência na UI antes do pagamento.
- Preferir **créditos** a reembolso em dinheiro quando o gateway/custo o justificar (configurável).
- Fraude / abuso → sem reembolso + flag Fraud & Abuse.

### 13.2 Estados típicos

| Situação                              | Acção típica                                            |
| ------------------------------------- | ------------------------------------------------------- |
| Cancelamento antes de iniciar serviço | Reembolso total ou crédito 100%                         |
| Após abertura, antes de sucesso       | Retém taxa de abertura; reembolsa sucesso (se pré-pago) |
| Serviço concluído                     | Sem reembolso (excepto defeito comprovado)              |
| Falha da Kuteka em SLA                | Crédito / reembolso parcial conforme nível              |
| Chargeback gateway                    | Ledger `refund` + investigação                          |

Tudo auditado; Super Admin pode `adjustment` excepcional.

---

## 14. Faturação automática

- Dados oficiais do pagador via **Identidade Real (KYC)**.
- Documentos: recibo / fatura (conforme país e `tax_code`).
- Numeração sequencial por país/entidade.
- PDF descarregável + email.
- Exportação contabilística mensal.
- Multi-país: templates e taxas configuráveis (não hardcoded AO).

---

## 15. Consentimentos e Opt-in comercial

Antes de recomendações comerciais (seguros, internet, upsell):

- consentimento explícito;
- revogável;
- registado com timestamp;
- KAI só sugere produtos com `kai_suggestible` + consentimento válido.

---

## 16. Super Administrador — `/app/super`

Painel **separado** do Admin operacional.

Módulos obrigatórios:

1. Revenue Command Center
2. Gestão de preços e comissões
3. Ledger + reconciliação
4. Gestão de utilizadores e papéis (visão executiva)
5. Gestão KAI (Rules Editor)
6. Gestão de notificações
7. Gestão de serviços (Service Health)
8. Integrações / gateways
9. Relatórios executivos
10. Auditoria e segurança
11. Configuração global (país, moeda, impostos, feature flags)
12. CRM Parceiros e Prestadores
13. Fraud & Abuse
14. Exportação contabilística
15. Campanhas e créditos

**Admin (`/app/admin`)** continua para operação diária (revisões KYC, utilizadores, activação de agentes, etc.).

---

## 17. KAI como gestor comercial

Além de assistente operacional, a KAI deve:

- sugerir serviços no momento certo;
- prever libertação de imóveis / ocupação;
- identificar oportunidades de upgrade a Parceiros;
- prever receitas (com base no Ledger);
- recomendar campanhas;
- respeitar consentimentos e limites Anti-spam definidos no Rules Editor.

Regras editáveis pelo Super Admin — **não** hardcoded permanentes.

---

## 18. Internacionalização da arquitectura financeira

Desde a Fase 1, o modelo de dados deve suportar:

| Dimensão          | Requisito                                      |
| ----------------- | ---------------------------------------------- |
| Moedas            | ISO 4217 (`AOA`, `EUR`, `USD`, …)              |
| Países            | `country_code` em produtos, impostos, gateways |
| Idiomas           | Copy financeira multi-idioma (reutilizar i18n) |
| Impostos          | `tax_rate` / `tax_code` por país               |
| Documentos legais | Templates por jurisdição                       |
| Gateways          | Plug-ins por país                              |
| Regulamentação    | Feature flags (ex.: escrow desligado)          |

Go-to-market inicial: **Angola**. Expansão = configuração + compliance, não rewrite.

---

## 19. Evolução futura — Carteira / Escrow (Fora da Fase 1)

Quando existir:

- maturidade operacional;
- enquadramento legal;
- decisão explícita do Product Owner;

poderá estudar-se:

- saldo custodiado;
- libertação condicionada a eventos (visita, chave, contrato);
- licenças / parceiro bancário.

**Até lá:** arquitectura do Ledger e Kuteka Pay devem **permitir** essa evolução (campos `custody_mode`, estados de hold), mas **custody_mode = none** por defeito.

---

## 20. Ordem de implementação (oficial)

### Fase 1 — Infraestrutura Financeira

1. Este documento (Arquitetura Financeira) ✅
2. Ledger Financeiro
3. Catálogo de Produtos e Serviços
4. Motor de Preços
5. Kuteka Pay (adapters + sandbox)
6. Kuteka Credits
7. Sistema de Comissões
8. Faturação e recibos
9. Consentimentos / Opt-in

### Fase 2 — Centro de Comando

1. `/app/super` + Revenue Command Center
2. Gestão global de preços / campanhas / créditos / serviços
3. Auditoria, Fraud & Abuse, Exportação
4. KAI Rules Editor
5. CRM Parceiros e Prestadores
6. Service Health

### Fase 3 — Monetização (impacto)

1. Mudança Inteligente
2. Pagamentos Kuteka (rendas / lembretes)
3. Rede de Prestadores
4. Marketplace unificado
5. Planos Parceiros Patrimoniais
6. Serviços Premium / Plus

Cada módulo: N5 completo (fluxo, regras, permissões, estados, automações, notificações, documentos, integração, indicadores, dashboards, histórico, auditoria, KAI) + merge + deploy + migration + ADR + testes + seed demo.

---

## 21. Seeds sugeridos (não vinculativos — editáveis no Super Admin)

Valores apenas para **bootstrap** em AOA (Angola):

| Produto                 | Seed sugerido    |
| ----------------------- | ---------------- |
| Mudança abertura 61–90d | 5.000 Kz         |
| Mudança sucesso 61–90d  | 10.000 Kz        |
| Mudança abertura 15–30d | 5.000–10.000 Kz  |
| Mudança sucesso 15–30d  | 15.000–25.000 Kz |
| Kuteka Plus (indivíduo) | 5.000 Kz/mês     |
| Take-rate limpeza       | 10–12%           |
| Take-rate mudanças      | 8–10%            |
| Take-rate seguros       | 10–15%           |
| Plano Parceiro Bronze   | 10.000 Kz/mês    |

Super Admin pode alterar a qualquer momento.

---

## 22. Critérios de aceite da arquitectura

A arquitectura financeira considera-se correcta quando:

1. nenhuma cobrança existe sem linha de Ledger;
2. preços mudam sem deploy de código;
3. Cliente gratuito continua a usar o core sem paywall;
4. B2B concentra a receita;
5. sandbox funciona sem conta comercial;
6. Super Admin controla motor económico em `/app/super`;
7. multi-moeda/país está no schema desde o início;
8. escrow permanece desligado até decisão legal/PO.

---

## 23. Decisões aprovadas (Product Owner — 2026-08-05)

| #   | Decisão            | Valor                                              |
| --- | ------------------ | -------------------------------------------------- |
| 1   | Custódia de fundos | **Não** na Fase 1                                  |
| 2   | Modelo de receita  | **B2B2C**                                          |
| 3   | Gateways           | Arquitectura pronta; sandbox até conta comercial   |
| 4   | Planos             | Híbrido: Grátis + Pay-per-use + Plus opcional      |
| 5   | Controlo           | Painel **`/app/super`** separado                   |
| 6   | Parametrização     | 100% Super Admin                                   |
| 7   | Marketplace        | Arquitectura única para todos os serviços futuros  |
| 8   | KAI                | Assistente + gestor comercial                      |
| 9   | Internacional      | Multi-moeda / país / fiscal / gateway desde Fase 1 |

---

## 24. Controlo de versões

| Versão | Data       | Notas                                                       |
| ------ | ---------- | ----------------------------------------------------------- |
| 1.0    | 2026-08-05 | Primeira versão oficial — base para Fase 1 de implementação |

---

_Kuteka — Sistema operativo de gestão patrimonial.  
Rendimento sustentável sem parecer caro.  
Este documento governa a monetização da plataforma._
