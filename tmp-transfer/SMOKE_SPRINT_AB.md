# Smoke checklist — Sprint A + B (pós-publish)

Usar após push/PR/merge/deploy em `EduardoZ121/Site_Angola`. Não requer novas features.

## Pré-voo local (já corrido no agente)

- [x] `npm test` — 137 testes
- [x] `tsc --noEmit`
- [ ] `npm run build` (export estático) — validar neste ciclo
- [x] Patches A/B + harden regeneráveis

## Sprint A — produção

1. Landing: aviso Beta visível; copy hero coerente (pt/en/es/fr)
2. `/documentacao` (ou equivalente): CTA → sign-in → ajuda/feedback
3. App home autenticado: welcome Beta
4. Inventário: rascunho ≠ listagem pública (copy)
5. Headers: `X-Content-Type-Options`, `CSP`, `HSTS` (amostra curl -I)

## Sprint B — ciclo feedback

Pré: conta com `finance.manage` **ou** `admin.panel` para ler inbox; metrics precisam `finance.manage`.

1. `/app/ajuda`: submit sugestão → sucesso
2. Submit bug → sucesso
3. KOCC Painel Beta: contadores sobem (se `finance.manage`)
4. Inbox lista linhas recentes **mesmo se** metrics falharem (só `admin.panel`)
5. Filtro Todos / Bugs / Sugestões funciona
6. Erro de SELECT não mostra «Ainda sem relatos»
7. Reclamação operacional permanece canal separado (sem segundo inbox)
8. Confirmar que **não** há UI de estados FECHADO (ainda não existe no schema — esperado)

## Governança (não smoke de código)

- [ ] Decisão Founder sobre proposta `0043` (read Founder)
- [ ] Decisão se P1 terá estados/triagem com UPDATE (hoje UPDATE revogado)

## Sequência de publish (quando write abrir)

1. Branch desde `main` → aplicar patch A → PR → CI → merge conforme política → deploy → smoke A
2. Branch → aplicar patch B (+ harden) → PR → merge → deploy → smoke B
3. Continuar itens técnicos autorizados restantes
