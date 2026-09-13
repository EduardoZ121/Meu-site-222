# Kuteka Beta QA Playbook v0.1

| Campo | Valor |
|-------|-------|
| **Versão** | 0.1 |
| **Data** | 2026-08-28 |
| **Referência** | BETA-37, BETA-39 (Doc 3) |

## Testes obrigatórios antes de declarar ciclo aprendizagem (BETA-40)

### T1 — Parceiro Patrimonial (registo inventário)

1. Registar imóvel habitado/ocupado
2. Verificar **não** aparece em pesquisa mercado
3. Completar progressivamente (% perfil se activo)
4. Submeter activação → fila publicação
5. Verificar estados lifecycle

**Pass:** imóvel em inventário, não no mercado até aprovado.

### T2 — Prestador

1. Criar conta → aderir rede
2. Completar perfil progressivo
3. Criar serviço → submeter aprovação
4. Verificar gates trust

### T3 — Cliente low-friction

1. Registar → explorar sem KYC completo
2. Pesquisar → favoritos
3. Procurar sem resultado → alerta (se UI activa)
4. Tentar acção sensível → gate KYC

### T4 — Feedback

1. Abrir página chave
2. Reportar problema (form ou contextual quando existir)
3. Verificar contexto guardado (rota, user)
4. KOCC recebe
5. Audit regista

### T5 — Privacidade

Utilizador A **não** vê feedback/dados privados de B.

### T6 — Admin scope

Admin autorizado gere feedback da sua área apenas.

### T7 — Founder métricas

Founder visualiza métricas globais Beta (KOCC).

### T8 — KAI advisory

KAI classifica/agrupa **sem** decisões críticas autónomas.

## Registo de execução

| Teste | Data | Executor | Pass/Fail | Notas |
|-------|------|----------|-----------|-------|
| T1 | | | | |
| T2 | | | | |
| ... | | | | |

## Ambiente

- Preferir staging; produção só com autorização Founder
- Não usar contas demo como substituto utilizador real (D3)
