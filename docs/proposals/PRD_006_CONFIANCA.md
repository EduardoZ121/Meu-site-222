# PRD-006 — Confiança

**Versão:** 1.0 · **Estado:** Implementação autorizada (continuidade autónomo pós-núcleo MVP)  
**Maturidade alvo:** N5  
**Fundação:** Auth · Shell · PRD-002…005 · PASSO 0 (confiança com evidência)

## MVP

| Inclui                                                  | Exclui                                            |
| ------------------------------------------------------- | ------------------------------------------------- |
| Hub Confiança + checklist de verificação da conta       | Passaporte Digital / SCK / KTK Score              |
| Submeter itens de verificação (metadados + notas)       | Upload de ficheiros / Conservatória / KYC externo |
| Estados: submitted · under_review · accepted · rejected | KAI                                               |
| Revisão admin (`admin.panel`)                           | Marketplace badges                                |

## Decisões

| ID  | Decisão                                                                 |
| --- | ----------------------------------------------------------------------- |
| D1  | UI = **Confiança** (`modules/confianca`); sem nav «Documentos» separado |
| D2  | `trust.manage` para client / partner / agent / admin                    |
| D3  | Shell Confiança activo → `/app/confianca`                               |
| D4  | Checklist + estados — não Passaporte/Score                              |
| D5  | `property_id` opcional nos itens (conta primeiro)                       |
| D6  | Revisão via `admin.panel` em `/app/confianca/revisao`                   |

## Rotas

| Rota                      | Função          |
| ------------------------- | --------------- |
| `/app/confianca`          | Hub + checklist |
| `/app/confianca/submeter` | Submeter item   |
| `/app/confianca/revisao`  | Fila admin      |
