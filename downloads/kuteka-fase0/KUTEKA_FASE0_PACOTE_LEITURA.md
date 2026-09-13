# Kuteka — Fase 0 — Pacote de Leitura (v1.1 — roster corrigido)


---


# Kuteka — Registo institucional dos fundadores

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data** | 2026-08-29 |
| **Estado** | **Canónico** — correcção documental |
| **Relates** | ADR-027, GOV-001, Doc 3 §29 |

> **Regra:** Estatuto institucional ≠ conta GitHub ≠ email de login. Permissões na plataforma = `user_id` + tabela `founders` (ADR-027).

---

## Estatuto institucional (correcto)

| Estatuto | Pessoa | GitHub (referência) | Notas |
|----------|--------|---------------------|-------|
| **Founder** | **Makiese Vicente** | `vicentemakiese` | Ideia, visão, decisões estratégicas, trabalho principal Kuteka |
| **Co-Founder** | **Eduardo** | `EduardoZ121` | Co-fundador; titular de contas/repos (ex.: GitHub, Cursor); colaboração técnica/operacional |

---

## O que NÃO confundir

| Conceito | Exemplo | É o Founder? |
|----------|---------|--------------|
| Estatuto **Founder** | Makiese Vicente | **Sim** |
| Titular repo `EduardoZ121/Site_Angola` | Eduardo | **Não** — é Co-Founder + admin GitHub |
| Conta Cursor subscrição | Pode estar no Eduardo | **Não** define estatuto |
| Email de login | Qualquer fundador | **Não** define estatuto (ADR-027) |

---

## Hierarquia (inalterada)

```
Founder (Makiese Vicente) / Co-Founder (Eduardo)
  → Super Admin → Admin → Supervisor → Agente → Prestador/Parceiro → Cliente
```

---

## Implicações documentais

| Acção | Responsável institucional |
|-------|---------------------------|
| `AUTORIZO: FASE X` | **Founder** — Makiese Vicente |
| Decisões D1–D7 | **Founder** — Makiese Vicente |
| Merge PR repo oficial (quando aplicável) | **Co-Founder** — Eduardo (acesso repo) **com** validação Founder |
| Push fork / Integrations GitHub | Co-Founder **ou** quem tiver credenciais — **não** altera estatuto |
| Pareceres advogado/contabilista | Entregues ao **Founder**; Co-Founder em cópia se aplicável |

---

## Correcção aplicada (2026-08-29)

Documentos Fase 0 que **incorrectamente** listavam Eduardo como Founder no handover foram corrigidos. ADR-027 e packs C1–C10 **não continham** essa atribuição nominal — apenas papéis genéricos.

---

## Histórico

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-08-29 | Registo canónico Founder = Makiese Vicente |


---




---




---




---




---


