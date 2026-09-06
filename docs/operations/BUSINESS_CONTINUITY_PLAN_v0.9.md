# Plano de Continuidade de Negócio (BCP) — Kuteka

| Campo           | Valor                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Versão**      | 0.9 (fundacional — Sprint Beta 1)                                                                                                                         |
| **Data**        | 2026-08-06                                                                                                                                                |
| **Natureza**    | Processos fundamentais de continuidade do negócio; **não** é um plano de continuidade de escala                                                           |
| **Complementa** | [DISASTER_RECOVERY_PLAN_v0.9.md](./DISASTER_RECOVERY_PLAN_v0.9.md) (recuperação técnica) · [KOS](../product/KUTEKA_OPERATING_SYSTEM.md) (operação diária) |
| **Estatuto**    | **Não bloqueia** a Beta Pública. **É obrigatório** antes de escalar para v1.5+ (pagamentos reais em volume).                                              |

---

## 0. Âmbito e limites desta versão

Esta é a **v0.9 fundacional**: cobre os processos mínimos indispensáveis para que a Kuteka saiba o que fazer perante uma interrupção séria, mesmo em fase Beta com equipa reduzida (KOS §1: chapéus empilhados). Não cobre cenários de escala (S2/S3 do KOS §7), múltiplas regiões, nem auditoria externa formal — isso fica para revisão em versões seguintes, à medida que o volume de clientes e dinheiro real justificar.

**Este documento não impede nem atrasa a abertura da Beta Pública.** É um requisito de maturidade **antes de escalar** (v1.5+), registado aqui para que a equipa não avance para volume real sem estes processos definidos.

## 1. Objectivo

Garantir que, perante uma interrupção (técnica, de fornecedor externo ou operacional), a Kuteka:

1. Sabe **quem decide** e em que ordem agir.
2. Protege os dados e o dinheiro simulado/real dos utilizadores.
3. Comunica ao utilizador de forma clara e atempada.
4. Sabe quando **suspender** um serviço e quando **reabrir**.

## 2. Donos e autoridade de decisão

Alinhado ao KOS §2. Em Beta, os papéis podem acumular-se na mesma pessoa.

| Decisão                                | Quem decide                                        |
| -------------------------------------- | -------------------------------------------------- |
| Suspender um módulo/serviço            | Super Administrador + Administrador Geral          |
| Suspender pagamentos (Kuteka Pay)      | Super Administrador                                |
| Comunicar incidente a utilizadores     | Direcção Geral (aprova) + Atendimento (publica)    |
| Reabrir após incidente                 | Super Administrador, com confirmação de Tecnologia |
| Declarar perda de dados / accionar DRP | Super Administrador + Tecnologia                   |

**Regra:** nenhuma suspensão ou reabertura de serviço com impacto em pagamentos ocorre sem registo (data/hora, motivo, quem decidiu) — o registo vive no Super Admin (nota interna) até existir um módulo de incidentes dedicado.

## 3. Processos fundamentais cobertos nesta versão

Cada processo tem: gatilho, acção mínima, dono, e onde fica o registo.

### 3.1 Backups e retenção

| Item              | Definição mínima v0.9                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O que é copiado   | Base de dados Supabase (Postgres) completa; buckets de Storage (`property-media`, `identity-documents`, `avatars`)                                                                  |
| Frequência mínima | Diária (backup automático do fornecedor Supabase) — **verificação manual da existência do backup** ainda por instituir como rotina (ver DRP §1)                                     |
| Retenção mínima   | Alinhada aos prazos legais indicados na [Política de Privacidade §9](../legal/POLITICA_PRIVACIDADE_v1.md#9-conservação--retenção); nunca inferior ao prazo do plano Supabase activo |
| Dono              | Tecnologia                                                                                                                                                                          |
| Registo           | Ver detalhe técnico no [DRP §1](./DISASTER_RECOVERY_PLAN_v0.9.md#1-backups-e-retenção)                                                                                              |

### 3.2 Documentos KYC / KIS

| Item         | Definição mínima v0.9                                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Protecção    | Ficam no Storage privado (`identity-documents`); acesso restrito por RLS (ver Privacidade §5)                                                                                                   |
| Continuidade | Em caso de indisponibilidade do Storage, o fluxo de KYC deve **bloquear novos envios** e mostrar mensagem clara ao utilizador ("tente mais tarde"), nunca aceitar upload sem garantia de guarda |
| Retenção     | Conforme prazos legais de identificação (Privacidade §9) — não eliminar por rotina de limpeza automática sem confirmação                                                                        |
| Dono         | Tecnologia (infra) + Administração Geral (processo)                                                                                                                                             |

### 3.3 Contratos (plataforma)

| Item         | Definição mínima v0.9                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Protecção    | Registos em base de dados (não ficheiro solto); qualquer anexo vive em Storage com backup                                  |
| Continuidade | Um contrato em progresso durante uma interrupção mantém o seu último estado gravado — não se perde por reinício do serviço |
| Dono         | Jurídico (processo) + Tecnologia (garantia técnica)                                                                        |

### 3.4 Comunicação ao utilizador

| Cenário                                     | Mensagem mínima obrigatória                                                                                    | Canal                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Indisponibilidade total (site/app em baixo) | Aviso claro de indisponibilidade temporária, sem prometer prazo que não se possa cumprir                       | Página de estado (se existir) / email quando aplicável     |
| Falha de pagamento em curso                 | Estado do pedido nunca fica ambíguo: "falhou", "pendente de confirmação" ou "concluído" — nunca silêncio       | Ecrã do pedido + email (quando SMTP transaccional existir) |
| Suspensão de um serviço específico          | Indicar módulo afectado e que os restantes continuam a funcionar                                               | Banner no módulo (quando existir) / Atendimento            |
| Incidente de dados (se aplicável)           | Comunicação conforme obrigações legais (ver Privacidade §8) — nunca omitir se houver risco real para o titular | Email directo + canal oficial                              |

**Princípio:** nunca prometer prazo de resolução que a equipa não possa garantir — comunicar "estamos a investigar" é preferível a um prazo falso (mesmo princípio de honestidade usado no KOS para SLA de Assistência 24h).

### 3.5 Critérios de suspensão de um serviço

Suspender um serviço (D1–D5, Marketplace ou pagamentos) **imediatamente** quando:

- Houver risco de cobrança duplicada ou incorrecta (Kuteka Pay);
- Houver indício de fraude activa não contida;
- O Storage de documentos sensíveis (KYC) ficar indisponível ou com risco de exposição;
- A base de dados apresentar inconsistência que afecte saldos do Ledger.

### 3.6 Critérios de reabertura

Reabrir apenas quando:

1. A causa raiz estiver identificada (mesmo que a correcção definitiva ainda não esteja implementada — pode reabrir com mitigação temporária documentada).
2. Não houver pedidos em estado ambíguo (todos os pedidos afectados foram fechados como `completed`, `cancelled`/`failed` com crédito, conforme política do módulo).
3. Super Administrador confirmar reabertura por escrito (registo interno).

## 4. Fornecedores críticos e continuidade

| Fornecedor                                                      | Papel                       | Continuidade nesta versão                                                                                                                      |
| --------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase**                                                    | Auth, Postgres, Storage     | Ver [DRP §3](./DISASTER_RECOVERY_PLAN_v0.9.md#3-indisponibilidade-supabase) — sem plano de failover multi-fornecedor nesta versão              |
| **Gateway de pagamento** (sandbox hoje; Multicaixa/EMIS futuro) | Processamento de pagamentos | Ver [DRP §4](./DISASTER_RECOVERY_PLAN_v0.9.md#4-indisponibilidade-do-gateway-de-pagamento)                                                     |
| **Deploy** (Render — `kutekalink.com`)                          | Hospedagem do site estático | Rollback documentado no [DRP §2](./DISASTER_RECOVERY_PLAN_v0.9.md#2-rollback-de-deploy)                                                        |
| **SMTP** (Supabase Auth)                                        | Emails de autenticação      | Sem redundância nesta versão; falha bloqueia apenas confirmação de conta/OTP por email (OTP por SMS/segunda via, quando activo, é alternativa) |

**Nota de honestidade:** a Kuteka **não tem** nesta versão um fornecedor alternativo para nenhum destes serviços. Isto é aceitável em Beta com poucos utilizadores; **não é aceitável ao escalar** (v1.5+) sem, no mínimo, um plano testado de restauro (DRP) e um segundo canal de comunicação com o utilizador.

## 5. O que esta versão explicitamente NÃO cobre (adiado)

- Plano de continuidade multi-região ou multi-fornecedor de base de dados.
- SLA contratual de continuidade com fornecedores (Supabase, gateway) — depende de plano pago/enterprise.
- Simulação formal de desastre (_disaster recovery drill_) com métricas de RTO/RPO auditadas.
- Seguro de continuidade de negócio ou cibersegurança.
- Central de comando de crise dedicada (hoje é o Super Admin + comunicação directa da equipa).

Estes itens entram como trabalho de **v1.5+**, condicionados ao volume real de clientes e dinheiro (ver [Roadmap Master](../product/KUTEKA_ROADMAP_MASTER.md)).

## 6. Checklist mínimo antes de escalar (v1.5+)

- [ ] Backup Supabase verificado manualmente pelo menos uma vez (não só assumido pelo fornecedor)
- [ ] Um restauro de teste executado com sucesso (ver DRP §1.2)
- [ ] Rollback de deploy testado pelo menos uma vez em produção ou ambiente equivalente
- [ ] Critérios de suspensão/reabertura (§3.5–3.6) conhecidos por quem tem acesso ao Super Admin
- [ ] Canal de comunicação de incidente definido (mesmo que seja apenas email + rede social oficial)

---

## Controlo de alterações

| Versão | Data       | Notas                                                          |
| ------ | ---------- | -------------------------------------------------------------- |
| 0.9    | 2026-08-06 | Primeira versão fundacional — processos mínimos, Sprint Beta 1 |

**Próxima revisão:** ao iniciar a preparação para v1.5 (pagamentos reais) ou após o primeiro incidente real, o que ocorrer primeiro.
