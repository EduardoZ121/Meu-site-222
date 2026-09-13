# Manual Operacional vs Plataforma Kuteka

Relatório de alinhamento — Volume I (Parceiro Patrimonial).  
Gerado na fase `manual-ops-align` (branch `cursor/manual-ops-align-f96b`).

Legenda: ✅ já existia e permanece · 🟡 implementado nesta fase · 🔴 ainda em falta / parcial

| Capítulo    | Tema                                              | Estado | Notas                                                                                                                           |
| ----------- | ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Cap.1       | Visão / gestão patrimonial (não só anúncios)      | 🟡     | Secção **Serviços pretendidos da Kuteka** + nível de gestão no Ativar Património                                                |
| Cap.2       | Ciclo de vida PP (15 etapas)                      | 🟡     | Painel no hub Patrimónios; `partner_lifecycle` na BD; etapas comerciais avançadas ainda operacionais (agente/CRM)               |
| Cap.3       | Categorias A–G + ICK                              | 🟡     | Colunas `partner_category`, `ick_score`, `kid`; UI no painel PP; motor automático de scoring ICK ainda simplificado (seed/demo) |
| Cap.4       | Adesão rigorosa / verificação                     | ✅/🟡  | Confiança + papéis existentes; publicação gated por avaliação quando serviços de gestão                                         |
| Cap.5       | Registo do património (campos)                    | 🟡     | Comuna, bairro, número, GPS, áreas, WC, conservação, infra, proximidades                                                        |
| Cap.5.3     | Passaporte Digital (PDK)                          | 🟡     | Painel PDK na ficha; `pdk_code` + históricos; fotos/vídeo/docs via ficha premium existente                                      |
| Cap.5.11    | Estados do imóvel                                 | 🟡     | `lifecycle_status` alinhado ao Manual                                                                                           |
| Cap.6       | Avaliação técnica obrigatória                     | 🟡     | Tabela `property_evaluations`, painel, draft na activação; fluxo agente completo ainda parcial                                  |
| Cap.7       | Contrato Kuteka ↔ PP                              | 🟡     | `partner_service_contracts` + painel + criação no registo                                                                       |
| Cap.8–9     | Gestão comercial / arrendamento                   | ✅/🟡  | Contratos N5 + gestão solicitável; cobrança/ocorrências avançadas 🔴                                                            |
| Cap.10      | Gestão total / Painel de Saúde                    | 🟡     | Painel de Saúde completo na ficha                                                                                               |
| Cap.11      | Remodelação / Valor+ / prestadores                | 🟡     | Pedidos de remodelação + obra inacabada no registo; rede de prestadores 🔴                                                      |
| UX aprovada | Shell, feed, contraste, dashboards, ficha premium | ✅     | Preservada — apenas painéis aditivos e logótipo maior                                                                           |
| Logótipo    | Presença de marca                                 | 🟡     | BrandMark `xl` 80px no menu; `lg` no header móvel                                                                               |

## Regras de negócio adicionadas

1. Finalidade comercial ≠ serviços Kuteka (secções separadas).
2. `propertyRequiresEvaluation(services, management)` → `status=draft` + `lifecycle_status=em_avaliacao` quando gestão/avaliação/obra.
3. Contrato de serviços Kuteka gerado no registo.
4. PDK code `PDK-{code}` atribuído no registo.
5. Avaliações escritas na ficha (após contrato concluído + `reputation.manage`).

## Dependências de deploy

- Aplicar migração `0014_manual_ops_partner_services.sql` no Supabase.
- Rebuild estático + Deploy Kuteka.

## Ainda parcial (🔴)

- Motor completo ICK / evolução automática A–G.
- Rede de prestadores + orçamentos Valor+.
- Métricas live de visualizações/ocupação no Painel de Saúde.
- Vídeo / 360° / planta com conteúdo real (URLs já suportadas; conteúdo depende de upload).
- Workflow agente para aprovar avaliações e activar contratos Cap.7.
