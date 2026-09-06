# AI_CONTEXT.md — Memória Permanente da Equipa Kuteka

**Documento:** Contexto institucional para desenvolvimento assistido por IA e equipa humana  
**Versão:** 1.0  
**Estado:** Activo (PRD-001…005 + Shell N5 · núcleo papéis MVP operacional)  
**Actualização:** Rara — apenas por decisão oficial da equipa  
**Uso:** Consultar antes de qualquer especificação, PRD ou implementação  
**Índice:** `docs/README.md`  
**Baseline:** `PROJECT_BASELINE_PRD001.md` · ADR-005…010

---

## 1. Missão

A Kuteka nunca será apenas uma plataforma de anúncios.  
A sua missão é **gerir confiança**, transformar patrimónios em oportunidades e proporcionar **habitação digna** através da tecnologia, da transparência e da excelência operacional.

## 2. Visão

Ser a PropTech africana de referência em gestão de património habitacional, confiança digital e experiência premium — preparada para crescer durante décadas.

## 3. O que a Kuteka não é

- Website de classificados
- Cópia de Airbnb, Booking ou Idealista
- Ferramenta agressiva de “vender rápido”
- Produto descartável de MVP sem arquitectura

## 4. Stakeholders principais

| Papel oficial        | Função                                       |
| -------------------- | -------------------------------------------- |
| Cliente              | Compra / arrendamento / jornada habitacional |
| Parceiro Patrimonial | Activa e gere património                     |
| Agente Certificado   | Representa a Kuteka no terreno               |
| Administrador        | Valida, governa, audita                      |

Uma conta pode ter **múltiplos papéis** (RBAC / `user_roles`).

## 5. Conceitos de produto obrigatórios

- Ativar Património (não “publicar anúncio”)
- Passaporte Digital do Imóvel
- Índice Kuteka / KTK Score
- Sistema de Confiança Kuteka (SCK)
- KAI — presença constante, nunca página escondida
- Códigos `KID`, `KTK-IMM-…`

## 6. Documentos oficiais (hierarquia)

1. Manual Operacional da Kuteka
2. Software Architecture Blueprint
3. Design System & UX Blueprint (Nº 003)
4. Identidade Oficial da Kuteka (PASSO 0)
5. Este `AI_CONTEXT.md`
6. PRDs por módulo (PRD-001, PRD-002, …)

Nunca contradizer 1–4. Em conflito, prevalece o documento de nível superior.

## 7. Stack oficial

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Storage)
- PostgreSQL
- Deploy alvo: Vercel + Cloudflare

O projecto React/Vite actual é **protótipo legado**, não base de produção.

## 8. Arquitectura

- Monorepo KEOS (`apps/`, `packages/`, `docs/`, `supabase/`) — pnpm + Turborepo
- Desenvolvimento por **domínios**, não por páginas soltas
- Clean Architecture / SOLID / Repository Pattern
- API First
- Multi-Role: Utilizador = identidade; papéis = permissões (N:N); RBAC por capacidades
- Auditoria e logs desde o primeiro dia
- Escala pensada para o futuro, complexidade controlada no MVP
- ADR-001: `docs/architecture/ADR-001-foundation-architecture-decisions.md`

## 9. Design System (resumo)

- Primary: **Kuteka Orange**
- Secondary: Slate
- Success / Warning / Danger / Info conforme Doc Nº 003
- Tipografia: Inter + JetBrains Mono
- Espaçamento: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96
- App shell: Sidebar + Topbar + Main + Widgets
- Motion &lt; 250 ms
- Mobile first
- WCAG 2.2 AA

## 10. Princípios UX

1. Nunca obrigar o utilizador a pensar
2. Cada clique aproxima do objectivo
3. Um ecrã = uma missão
4. Mostrar só o necessário
5. Antecipar necessidades
6. Tudo transmite confiança
7. A plataforma ensina-se a si própria

## 11. Metodologia da equipa

```
Especificação → Aprovação Funcional → Engineering Gate
→ Autorização de Implementação → Implementação → Auto-Revisão
→ Testes → Validação → Encerramento → Próxima Fase
```

Documento: `docs/engineering/DEVELOPMENT_PROCESS.md`

**Papel definitivo do agente:** Arquitecto Principal, Guardião da Consistência e **Líder Técnico** — **autorização permanente** para fluxo autónomo até à conclusão do projecto (sem “OK” por etapa); interromper só nos eventos de `DEVELOPMENT_PROCESS.md` (Gate · negócio · conflito · visão/arquitectura estratégica · implementação/produção · risco crítico · marco formal).

- Metodologia estabilizada — conduzir o próximo passo lógico sem aguardar instruções detalhadas
- PRDs em duas fases (Aprovação Funcional ≠ Autorização de Implementação)
- Autoavaliação N1–N5 + confiança % (se < 95%, factores)
- Um PRD por módulo seguinte (não 100 documentos à frente)
- Qualidade acima da velocidade; simplicidade sem complexidade injustificada
- Cada passo deve parecer produto final
- Documentação evolui com o código (ADRs / specs / PRDs)
- Arquitectura base **congelada** — alterações estruturais só com benefício claro; estratégicas → PO
- Sem contornar Engineering Gates
- Sem actualizações periódicas só para confirmar pendências ops conhecidas
- Sem pedir confirmação intermédia fora dos eventos PO

## 12. Fases de produto (ordem)

0 Fundação (docs + identidade) — **concluída**  
1 Infraestrutura (monorepo, DS base) — **encerrada**  
1b Landing Page (PASSO 1 + 1A) — **encerrada** (4 níveis de validação)  
2 Autenticação (PRD-001) — **N5 concluído** · baseline congelada `PROJECT_BASELINE_PRD001.md`  
3 Shell da plataforma — **N5 concluído / congelado** (ADR-005)  
4 Parceiro Patrimonial (PRD-002) — **N5 concluído / congelado** (ADR-006)  
5 Cliente / Habitação (PRD-003) — **N5 concluído / congelado** (ADR-007)  
6 Agente (PRD-004) — **N5 concluído / congelado** (ADR-008)  
7 Administração (PRD-005) — **N5 concluído / congelado** (ADR-009)  
7b Confiança (PRD-006) — **N5 concluído** (ADR-010)  
7c Experiência de anúncio / fluxo (PRD-007) — **N5** (media, seed, HeroMedia)  
8 Contratos → 9 Wallet → 10 Marketplace → 11 KAI → 12 BI

## 13. Segurança (mínimos)

- Passwords nunca em texto simples
- Auth via Supabase
- RBAC por permissões
- RLS no PostgreSQL
- Auditoria de acções críticas
- Sem dados falsos em produção

## 14. Convenções de nomenclatura

- Ficheiros/funções: nomes explícitos (`CreateProperty`, não `novo2`)
- Variáveis: `propertyPrice`, `partnerId`, `kutekaScore`
- UI: glossário oficial (Parceiro Patrimonial, Ativar Património, …)
- Branches: `cursor/<nome>-f96b` quando aplicável ao fluxo Cursor

## 15. Regra de ouro para o Cursor

Antes de escrever código:

1. Ler este `AI_CONTEXT.md`
2. Ler o PRD / especificação do passo actual
3. Confirmar alinhamento com Manual, Blueprint e Design System
4. Não implementar fora do âmbito aprovado
5. Terminar entregas com critérios de aprovação objectivos

---

_Memória institucional Kuteka — FASE 0._
