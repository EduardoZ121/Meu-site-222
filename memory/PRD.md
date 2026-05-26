# Remake Pixel — PRD (working notes)

## Original problem statement
Importa o meu repositório do GitHub: https://github.com/EduardoZ121/Meu-site-222 (branch main) e me confirma quando o código estiver no /app.

Subsequente: Os uploads de imagem/vídeo em todas as secções falham com erros como
"Verifica a tua internet" ou "Imagem muito grande para enviar. Tenta uma mais pequena."

## Architecture
- Frontend: React (CRA + craco) em `frontend/`, deploy Vercel.
- Backend: FastAPI Python em `backend/` (Railway/local).
- Serverless: `frontend/api/[...path].js` faz proxy/fallback no Vercel.
- Storage media: Vercel Blob (`BLOB_READ_WRITE_TOKEN`) ou AWS S3 (cloud offload).

## What's been implemented (2026-01)
- Repositório importado para `/app` preservando `.git`, `.emergent` e `.env`.
- Bug fix em uploads:
  - `frontend/src/components/studio/StudioMediaPicker.jsx`: `ingest()` agora
    auto-comprime imagens > MAX_IMAGE_DIRECT_BYTES (3.5 MB) antes de validar
    tamanho. Phone photos 8–20 MB deixam de ser rejeitadas com toast
    "Imagem muito grande".
  - `frontend/src/pages/dashboard/Carousel.jsx`: `updateSlideRef()` também
    auto-comprime antes de validar.
  - Cobertura: StudioMediaPicker é usado por PhotoUpload, ImageUploadZone e
    todas as ferramentas (artistic, manga, poster, etc.) → fix propaga para
    todas as caixas de upload do site.

## Known production gap
- A versão em produção (remakepix.com) mostra strings que NÃO existem no
  código atual do `main` ("Verifica a tua internet", "Imagem muito grande
  para enviar. Tenta uma mais pequena."). Indica deploy antigo na Vercel.
- Após push para `main`, redeploy na Vercel é necessário.
- Vídeos > 3.2 MB exigem `BLOB_READ_WRITE_TOKEN` configurado (utilizador
  confirmou que está configurado).

## Backlog
- P1: Pré-validar disponibilidade do Blob no client para falhar mais cedo
  com mensagem clara quando falta token.
- P2: Indicador de progresso durante a compressão na caixa de upload
  (atualmente apenas via toast loading).
