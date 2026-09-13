# App Shell contínuo — referência de produto

**ADR:** `docs/architecture/ADR-013-app-shell-continuous-experience.md`  
**Estado:** Arquitectura definitiva da área autenticada

## O que o utilizador deve sentir

- Está **sempre** na mesma aplicação.
- Menu esquerdo e header **nunca** fazem scroll nem mudam de ambiente.
- Só o **centro** scrolla.
- Em Início, o centro **é o Feed** (scroll infinito), não um dashboard com o feed no fundo.
- Ao abrir Patrimónios / Habitação / Contratos, o chrome permanece — só o conteúdo central muda.

## Performance (regras)

1. Atmosfera da app: imagem estática, **sem vídeo**, sem Ken Burns.
2. Feed e Explorar: paginação Supabase (`.range`) + infinite scroll.
3. Itens com `content-visibility: auto`.
4. Imagens `loading="lazy"` + `decoding="async"`.
5. Sessão: nunca voltar a `loading` após ready (ver `RENDER_STABILITY.md`).

## Escala

API pronta para milhares/100k+ anúncios via páginas. Quando o DOM acumulado for o gargalo, adicionar virtualização (`@tanstack/react-virtual`) sobre a mesma API de páginas — sem redesenhar o shell.
