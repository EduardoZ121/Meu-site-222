# Plano de Recuperação de Desastre (DRP) — Kuteka

| Campo           | Valor                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| **Versão**      | 0.9 (fundacional — Sprint Beta 1)                                                                            |
| **Data**        | 2026-08-06                                                                                                   |
| **Natureza**    | Processos técnicos fundamentais de recuperação; **não** é um plano de recuperação de escala                  |
| **Complementa** | [BUSINESS_CONTINUITY_PLAN_v0.9.md](./BUSINESS_CONTINUITY_PLAN_v0.9.md) (continuidade de negócio)             |
| **Estatuto**    | **Não bloqueia** a Beta Pública. **É obrigatório** antes de escalar para v1.5+ (pagamentos reais em volume). |

---

## 0. Âmbito e limites desta versão

Cobre os processos técnicos mínimos de recuperação: backups, rollback de deploy, recuperação de base de dados, e os dois cenários de indisponibilidade externa mais prováveis nesta fase (Supabase, gateway de pagamento). Não define RTO/RPO formais nem testes de recuperação auditados — isso é trabalho de v1.5+, listado no §6.

## 1. Backups e retenção

### 1.1 O que é coberto

| Componente                                                  | Mecanismo actual                                                | Frequência                         |
| ----------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| Base de dados (Postgres, via Supabase)                      | Backup automático gerido pelo fornecedor Supabase               | Diária (conforme plano contratado) |
| Storage (`property-media`, `identity-documents`, `avatars`) | Redundância do fornecedor Supabase Storage                      | Contínua (infra do fornecedor)     |
| Código / configuração                                       | Repositório Git (`EduardoZ121/Site_Angola`), histórico completo | A cada commit                      |
| Estático de produção (`dist/`, `prebuilt/`)                 | Reproduzível a partir do repositório (`npm run build`)          | A cada deploy                      |

### 1.2 Verificação e restauro de teste

**Estado actual: pendente.** Nesta versão v0.9, o backup do Supabase é **assumido** como funcional (infra do fornecedor), mas **não foi ainda executado um restauro de teste** para confirmar que os dados podem ser efectivamente recuperados. Isto é registado aqui deliberadamente como lacuna conhecida — ver [GO_LIVE_READINESS.md §7](../product/GO_LIVE_READINESS.md) (Segurança).

**Acção mínima antes de escalar:**

1. Criar um projecto Supabase de teste (ou usar ambiente de staging, se existir).
2. Restaurar o backup mais recente nesse ambiente.
3. Confirmar integridade: contagem de tabelas-chave (users, properties, ledger_entries, contracts) e amostra de registos.
4. Documentar o resultado (data, duração, sucesso/falha) neste ficheiro ou num registo de continuidade.

### 1.3 Retenção

Alinhada à [Política de Privacidade §9](../legal/POLITICA_PRIVACIDADE_v1.md#9-conservação--retenção). Prazos legais de KYC/contabilidade prevalecem sobre qualquer política de limpeza automática de backups.

## 2. Rollback de deploy

O deploy de produção (`kutekalink.com`) é um site estático (Next.js export) publicado a partir do repositório `EduardoZ121/Site_Angola`, branch `main` (ver `render.yaml`).

### 2.1 Procedimento mínimo de rollback

1. Identificar o último commit estável em `main` anterior ao deploy problemático (`git log`).
2. Reverter ou criar um commit de correcção (`git revert <sha>` preferencialmente a `reset` forçado, para preservar histórico).
3. Confirmar que o build local (`npm install && npm run build`) passa antes de publicar.
4. Fazer push para `main` — o deploy automático (`autoDeploy: true`) publica a versão revertida.
5. Confirmar em produção (smoke test das rotas críticas: `/`, `/auth/entrar`, `/app`).

### 2.2 Migrations de base de dados

Migrations (`0001`–`0028`+) são **aditivas por convenção** neste projecto. Antes de reverter uma migration:

1. Confirmar se existe dependência de dados já criados por essa migration (nunca reverter uma migration que já tenha dados de produção sem plano de preservação).
2. Preferir uma **migration de correcção** (nova migration que corrige o problema) a reverter uma migration aplicada.
3. Só reverter schema completo em caso de erro crítico detectado imediatamente após deploy, sem dados novos gravados.

## 3. Indisponibilidade Supabase

Cenário: Auth, Postgres ou Storage do Supabase ficam indisponíveis ou com latência severa.

| Passo | Acção                                                                                                                                                         | Dono                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1     | Confirmar o estado no painel de estado do Supabase (status page do fornecedor)                                                                                | Tecnologia                       |
| 2     | Se confirmado, accionar comunicação ao utilizador (ver [BCP §3.4](./BUSINESS_CONTINUITY_PLAN_v0.9.md#34-comunicação-ao-utilizador))                           | Direcção + Atendimento           |
| 3     | Suspender operações que dependem de escrita crítica (pagamentos, KYC) se houver risco de inconsistência                                                       | Super Administrador              |
| 4     | Aguardar restabelecimento do fornecedor; a Kuteka **não tem** nesta versão um Postgres/Storage alternativo para failover                                      | Tecnologia                       |
| 5     | Ao restabelecer, verificar integridade de operações em curso antes de reabrir (ver [BCP §3.6](./BUSINESS_CONTINUITY_PLAN_v0.9.md#36-critérios-de-reabertura)) | Tecnologia + Super Administrador |

**Limite conhecido:** sem plano de failover multi-fornecedor nesta versão. Aceitável em Beta; a resolver antes de v1.5 se o volume de clientes justificar redundância paga.

## 4. Indisponibilidade do gateway de pagamento

Cenário: o adaptador de pagamento activo (sandbox hoje; Multicaixa/EMIS/Stripe/Wise quando ligados) fica indisponível ou devolve erros.

| Passo | Acção                                                                                                               | Dono                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1     | Confirmar se é falha do gateway ou da integração Kuteka Pay (logs de intent)                                        | Tecnologia                                   |
| 2     | Bloquear novas capturas de pagamento no módulo afectado; manter leitura de estado disponível                        | Super Administrador                          |
| 3     | Pedidos com pagamento **pendente** ficam em estado explícito (nunca "sucesso" presumido) até confirmação do gateway | Sistema (Kuteka Pay) + Supervisor Financeiro |
| 4     | Comunicar ao cliente que o pagamento está em verificação, sem cobrar duas vezes                                     | Atendimento                                  |
| 5     | Ao restabelecer, reconciliar manualmente os intents pendentes antes de os fechar automaticamente                    | Supervisor Financeiro                        |

**Regra de ouro (Ledger-first, KOS §0.2):** nenhuma cobrança, crédito ou reembolso avança sem rasto no Ledger — em caso de dúvida sobre o estado real de um pagamento, tratar como pendente, nunca como concluído.

## 5. Recuperação de base de dados (cenário de corrupção/erro de escrita)

1. Identificar o alcance do problema (tabela, período, utilizadores afectados) via logs/queries de diagnóstico.
2. Se o alcance for limitado, corrigir via migration de correcção ou script pontual revisto por dois pares (Tecnologia).
3. Se o alcance for amplo (ex.: escrita corrompida em massa), avaliar restauro a partir do backup mais recente (§1), aceitando perda dos dados criados entre o backup e o incidente — comunicar esse risco à Direcção antes de decidir.
4. Após qualquer recuperação, correr verificação de integridade do Ledger (saldos, créditos, reembolsos) antes de reabrir pagamentos.

## 6. O que esta versão explicitamente NÃO cobre (adiado para v1.5+)

- RTO/RPO formais e testados (hoje: objectivo informal é "o mais rápido possível", sem métrica comprovada).
- Testes periódicos agendados de restauro (§1.2 é o primeiro teste, não uma rotina).
- Failover automático de base de dados ou de gateway.
- Runbooks automatizados (scripts de recuperação one-click).
- Auditoria externa de continuidade/recuperação.

---

## Controlo de alterações

| Versão | Data       | Notas                                                          |
| ------ | ---------- | -------------------------------------------------------------- |
| 0.9    | 2026-08-06 | Primeira versão fundacional — processos mínimos, Sprint Beta 1 |

**Próxima revisão:** após o primeiro restauro de teste executado (§1.2) ou ao iniciar preparação para v1.5.
