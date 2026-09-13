# Documentos institucionais Kuteka (v1.0 Beta)

Fontes Markdown oficiais + exportações PDF/Word para publicação e download.

| Documento               | Markdown                                                           | PDF / Word                                                   |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Termos de Utilização    | [TERMOS_UTILIZACAO_v1.md](./TERMOS_UTILIZACAO_v1.md)               | [`exports/`](./exports/) · também em `apps/web/public/docs/` |
| Política de Privacidade | [POLITICA_PRIVACIDADE_v1.md](./POLITICA_PRIVACIDADE_v1.md)         | idem                                                         |
| Política de Cookies     | [POLITICA_COOKIES_v1.md](./POLITICA_COOKIES_v1.md)                 | [`exports/`](./exports/) · também em `apps/web/public/docs/` |
| Manual do Utilizador    | [../help/MANUAL_UTILIZADOR_v1.md](../help/MANUAL_UTILIZADOR_v1.md) | `docs/help/exports/` · `public/docs/`                        |

Conteúdo do Centro de Ajuda (`docs/help/`): [FAQ_v1.md](../help/FAQ_v1.md) · [GLOSSARIO_v1.md](../help/GLOSSARIO_v1.md) · [NOVIDADES_v1.md](../help/NOVIDADES_v1.md) · [ESTADO_SERVICOS_v1.md](../help/ESTADO_SERVICOS_v1.md) — publicados apenas em Markdown nesta Sprint Beta 1 (sem PDF/Word); fontes de conteúdo para `/app/ajuda`.

## Regenerar PDF e Word

```bash
python3 scripts/generate-legal-docs.py
```

Requisitos: `python-docx`, `reportlab`.

## Páginas da plataforma

- `/termos`
- `/privacidade`
- `/cookies`
- `/documentacao` (Centro de Documentação público — manual, FAQ, glossário, novidades, estado dos serviços, legal)
- `/app/ajuda` (manual completo + downloads + FAQ/Glossário/Novidades/Estado dos Serviços)

**Nota:** estes textos são a base oficial da Beta. Qualquer alteração material deve incrementar a versão e a data de vigência.
