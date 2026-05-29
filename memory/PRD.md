# Remake Pixel — PRD (background generations)

## Original problem statement
"Quero deixar as gerações em segundo plano: ao clicar Gerar, mostrar
mensagem 'vamos avisar quando terminar', o utilizador pode sair/recarregar,
e quando terminar disparar bip + notificação + entrada na galeria.
Mínimo 3 em paralelo. Bónus: vídeo-to-vídeo por email."

## Architecture
- Frontend: React (CRA + craco). Background job watcher já existia em
  `lib/api.js` (`startPendingPredictionsWatcher`), arranca em `lib/auth.jsx`.
- Notification center (bell + 1046 Hz beep) já existia em
  `lib/NotificationContext.jsx` + `lib/notificationsStore.js`.
- Backend: serverless `frontend/api/[...path].js` cria `pending_predictions`
  em MongoDB e devolve `prediction_id` imediatamente; `pollPending` faz o
  acompanhamento via Replicate.

## What's been implemented (2026-01)
- `frontend/src/lib/bgGeneration.js` (NOVO):
  - `MAX_CONCURRENT_BG_JOBS = 3`
  - `activeBackgroundJobsCount()`, `ensureBackgroundSlot()`,
    `dispatchBackgroundJob(submitData, opts)` — track + toast "vamos avisar".
- `frontend/src/lib/api.js`: interceptor de response agora despacha em
  background em vez de fazer `await pollPrediction`. Devolve `deferred: true`.
  Rotas `/generate/carousel*` mantêm polling síncrono (fluxo multi-step).
- Páginas adaptadas:
  - `Generate.jsx`, `Posters.jsx`, `VideoEditorAdmin.jsx` — usam
    `dispatchBackgroundJob` + `ensureBackgroundSlot` (limite 3).
  - `Artistic.jsx`, `Pro.jsx`, `VideoGenerate.jsx` — tratam `data.deferred`.
  - `components/manga-flow/GenerationModal.jsx` — usa background.
- Build verde, lint verde.

## Known gaps / Backlog
- P1: Email do vídeo-to-vídeo (sendResendEmail já existe) — adicionar
  `notify_email` no submit e enviar resultado quando o job termina em
  `pendingPredictions.cjs::finalizePending`.
- P1: Tools `BgRemove`, `Colorize`, `Restore`, `Inpaint`, `ClothesChanger`,
  `Upscale` — verificar se também devem usar background (verificar se os
  endpoints retornam `prediction_id`).
- P2: UI counter visível de jobs em curso (ícone com badge "2/3").
- P2: Reaproveitar HEIF→JPEG do backend (já fica disponível porque o repo
  novo já tem sharp).
