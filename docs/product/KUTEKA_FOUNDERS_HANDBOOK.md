# KUTEKA FOUNDERS HANDBOOK

**Documento fundador da empresa**  
Versão 1.0 · 5 de Agosto de 2026 · https://kutekalink.com

---

## Prefácio — Fecho da fase de desenho

Este handbook declara o fim da fase em que a Kuteka se define sobretudo por documentos e módulos.

A partir desta data, a empresa **opera**, **testa com utilizadores reais**, **mede resultados** e **evolui por versões comerciais**.

Planeamento adicional sem utilizadores reais é dívida, não progresso.

---

## 1. O que é a Kuteka

A Kuteka é uma plataforma imobiliária B2B2C em Angola (KEOS / kutekalink.com) que liga:

- **Clientes** — procurar, contratar e pedir serviços
- **Parceiros Patrimoniais** — activar e gerir imóveis
- **Agentes Certificados** — mediação e operação
- **Prestadores** — orçamentos e execução
- **Administração / Super Admin** — operação e motor económico

O núcleo de exploração (pesquisa, favoritos, conta) é **gratuito**.  
Receita vem de **pay-per-use**, planos de parceiro, Plus opcional e comissões — não de obrigar o cliente a subscrever para usar o básico.

**Sem carteira / sem escrow nesta fase.** Kuteka não segura dinheiro do cliente (`custody_mode = none`) até decisão jurídica e de negócio explícita.

---

## 2. Princípios fundadores (não negociáveis sem revisão formal)

1. **Ledger-first** — nenhuma cobrança sem rasto auditável.
2. **Um motor de pagamento** — Kuteka Pay; sem caminhos isolados por módulo.
3. **Configuração > código** — preços e flags no Super Admin (`/app/super`).
4. **B2B2C** — o volume de receita vem de parceiros, prestadores e B2B; o cliente paga pouco e só por valor claro.
5. **Versões comerciais > módulos** — o trabalho serve v1.0 / v1.5 / v2.0 / v3.0.
6. **Um pedido = um dono** — operação com responsabilidade clara.
7. **Demo ≠ produção** — contas e sandbox saem do caminho crítico antes de beta pública.

---

## 3. Onde estamos (honestidade fundadora)

| Dimensão       | % aproximada | Leitura                                              |
| -------------- | ------------ | ---------------------------------------------------- |
| **Plataforma** | ≈ 62%        | Core + finanças + serviços comerciais em sandbox     |
| **Operação**   | ≈ 25%        | Processos definidos; falta correr com clientes reais |
| **Empresa**    | ≈ 20%        | Legal/fiscal/receita real ainda incompletos          |

A plataforma está **à frente** da operação e da empresa. Por isso o próximo passo não é mais um módulo — é **lançar, operar e medir**.

Documentação de suporte (já existente no repositório):

- Arquitectura Financeira v1.0
- KUTEKA ROADMAP MASTER
- KUTEKA OPERATING SYSTEM (KOS)

Este handbook **não** os substitui; **fecha a visão** e manda executar.

---

## 4. O que já foi construído (não reabrir sem motivo)

- **Core v1.0** — Landing, Auth, Shell, Patrimónios, Habitação, Agente, Admin, Confiança, Listing
- **Contratos** e **KYC** self-serve
- **Infra financeira** — Ledger, créditos, reembolsos, disputas, Command Center
- **Kuteka Pay** (sandbox) — motor unificado
- **Marketplace** operacional (sandbox)
- **Serviços comerciais** — Mudança Inteligente, Encontrar Casa, Concierge, Garantia, Assistência 24h (ciclos completos em sandbox)

Produção: https://kutekalink.com

---

## 5. Metodologia — versões comerciais

| Versão        | Objectivo                                                        | Critério de saída                                                    |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| **v1.0 Beta** | Utilizadores reais; operação mínima; transparência do que é beta | Go-live: legal mínimo, demos off, suporte, SLA em horário comercial  |
| **v1.5**      | Pagamentos reais + operação estável                              | Gateway AO (Multicaixa/EMIS); reconciliação; SLA ≥ 90%; notificações |
| **v2.0**      | KAI + marketplace maduro + i18n                                  | Escala operacional; inteligência; prestadores em volume              |
| **v3.0**      | Ecossistema                                                      | API, white label, expansão; escrow só se aprovado legal/PO           |

**Regra de backlog:** só entra o que desbloqueia a versão activa, reduz risco legal/financeiro, ou gera receita mensurável **sem** novo silo de pagamento.

---

## 6. Operação mínima (o que a empresa faz todos os dias)

### Papéis (empilháveis no início)

Super Admin → Admin Geral → Supervisores (Comercial / Operacional / Financeiro) → Agentes → Atendimento → Prestadores / Parceiros

### Fluxo de pedido

Cliente cria → Kuteka Pay cobra → Operações atribui dono → Execução → Fecho → Avaliação → Ledger / Qualidade

### Prioridade imediata (v1.0)

1. Publicar Termos e Privacidade
2. Desactivar demos públicos / credenciais em docs públicos
3. Canal de suporte + horário
4. Treinar quem opera as filas (D1–D5 + marketplace)
5. Convidar utilizadores reais e **medir** (registos, activação, pedidos, SLA, receita sandbox→real)

Detalhe operacional: ver KOS no repositório.

---

## 7. O que fica explicitamente fora até à versão certa

- Carteira / escrow (até decisão jurídica)
- White label e API pública (v3.0)
- Marketplaces setoriais completos (financeiro, jurídico, seguros, arquitectura) antes de v2/v3
- “Fechar 100% dos módulos” antes de ter clientes pagantes
- Novos documentos de visão sem evidência de utilização real

---

## 8. Decisão fundadora

Nós, na qualidade de direcção do projecto Kuteka, declaramos:

1. A fase de desenho estratégico **está fechada**.
2. A fonte de verdade da empresa passa a ser: **utilizadores reais + métricas + versões comerciais**.
3. A próxima obrigação é **Kuteka v1.0 Beta** — operar, testar, medir, corrigir.
4. Qualquer regresso a planeamento indefinido exige justificação escrita perante a Direção.

**Assinatura simbólica de fecho**

| Campo         | Valor                                               |
| ------------- | --------------------------------------------------- |
| Documento     | Kuteka Founders Handbook v1.0                       |
| Data          | 2026-08-05                                          |
| Estado        | Aprovado para execução                              |
| Próximo marco | Kuteka v1.0 Beta em operação com utilizadores reais |

---

## 9. Contacto e activos

| Activo         | Local                              |
| -------------- | ---------------------------------- |
| Site           | https://kutekalink.com             |
| Repositório    | github.com/EduardoZ121/Site_Angola |
| Super Admin    | /app/super                         |
| Hub financeiro | /app/financeiro                    |

— Fim do Founders Handbook —
