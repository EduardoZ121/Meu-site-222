# plan.md — Remake Pixel (remakepix.com) Bugfix + Deploy Hardening Plan

## 1. Objectives
- Restore **reliable image upload → preview → generation uses the image** (no silent “prompt-only” fallback).
- Handle **Samsung HEIF/HEIC disguised as .jpg** end-to-end (frontend acceptance + backend conversion).
- Make **video upload** robust for:
  - files **> 3.2MB** (must offload to Blob/S3 before Generate)
  - **HEVC/MOV preview incompatibility** (clear UX; still allow processing)
- Eliminate **raw i18n key rendering** (always show translated string or human fallback).
- Fix **Vercel deploy reliability** (dependency resolution + API function routing/symlink).

## 2. Implementation Steps

### Phase 1 — Core Upload/Generation POC (isolation)
Goal: prove the hardest workflow works before broader changes.

**User stories (POC)**
1. As a user, I can upload a large phone photo and it gets auto-compressed and accepted.
2. As a Samsung user, I can upload a “.jpg” that is actually HEIF and the server still uses it.
3. As a user, if my browser can’t preview an image/video, I still see a clear placeholder and can proceed.
4. As a user, if my video is >3.2MB, the app offloads it to cloud and I can still generate.
5. As a user, I never see “vid_*” / “upload_*” keys—always readable UI strings.

**POC tasks**
- Web research (short): confirm Vercel Serverless body limits + best practices for Blob client upload + HEIF handling with `sharp`.
- Add a minimal **local POC harness**:
  - Node script (or lightweight test endpoint) that posts multipart with:
    - normal JPG
    - HEIF-disguised-as-JPG sample
    - small MP4
  - verifies server returns normalized JPEG data URI or Blob URL accepted by downstream Replicate input.
- Confirm backend path:
  - `parseBody()` handles larger image payloads safely
  - `normalizeUploadedImages()` converts HEIF/HEIC → JPEG
  - generation endpoints receive the converted file (not original).

### Phase 2 — V1 App Fixes (targeted, production-safe)

**User stories (V1)**
1. As a user, when I drop/paste an image, I immediately see a preview or a non-broken fallback card.
2. As a user, if my image is big, the app compresses automatically and I don’t hit “Imagem muito grande”.
3. As a user, if my image is HEIF (even if named .jpg), generation still uses it.
4. As a user, if my video is large, I see upload progress and a “cloud ready” state before Generate.
5. As a user, the UI language switch never results in raw translation keys.

**Frontend fixes**
- Image pipeline (StudioMediaPicker + other upload zones):
  - ensure **auto-compress happens before size gating** everywhere (align with `MAX_IMAGE_DIRECT_BYTES`).
  - keep “decode-check” soft (warn + fallback UI; don’t reject valid files).
  - unify accept strings + validation (`looksLikeImageFile` / `validateImageUpload`).
- Video pipeline:
  - enforce rule: **> VIDEO_VERCEL_SAFE_BYTES requires cloud** (Blob/S3) and block Generate until URL present.
  - improve preview UX:
    - detect preview failures and show `vid_preview_codec_hint` message.
  - ensure uploader uses consistent limits from `uploadConstants.js`.
- i18n:
  - verify `src/i18n/index.js` merges `createMergedDict()` + studio locales into JSON bundles.
  - ensure `useI18n()` never returns raw keys (fallback to EN resource → studio nested keys → humanized label).

**Backend (Vercel serverless) fixes**
- Increase multipart limits safely:
  - raise default `parseBody` maxFileSize for image routes (enough to accept uncompressed HEIF when browser can’t compress).
  - keep hard caps aligned with UI constants.
- Ensure normalization coverage:
  - call `normalizeUploadedImages(files)` for all POST generation routes (already present) + any upload helper endpoints.
  - consider expanding normalization beyond HEIF (rotation, colorspace “failOn:none”).
- Improve errors:
  - return precise 413/400 messages for “needs cloud upload” vs “invalid type” vs “server payload limit”.

**Vercel deploy fixes**
- Dependency resolution:
  - keep `.npmrc` `legacy-peer-deps=true` (or switch to yarn-only installs consistently).
  - ensure lockfiles match chosen installer (avoid npm/yarn mixing).
- API route reliability:
  - remove symlink dependence in build (prefer repo-root `api/` folder committed or adjust `vercel.json` patterns).
  - verify `functions.api/**/*.js.includeFiles` includes required `frontend/api/lib/**`.

### Phase 3 — Stabilization + Regression Testing

**User stories (stabilization)**
1. As a user, I can generate from an uploaded image and the output clearly reflects the input photo.
2. As a user, I can upload from mobile Safari/Chrome and not get stuck on broken previews.
3. As a user, I can upload a 10–50MB video and the app guides me to wait for cloud upload.
4. As a user, I can switch languages and all studio pages remain translated.
5. As a maintainer, Vercel deployments are reproducible (no random ERESOLVE or missing api/**/*.js).

**Testing checklist**
- Local dev smoke:
  - upload JPG/PNG/WEBP, large photo, HEIF disguised as JPG
  - video small MP4 (preview ok) + iPhone MOV/HEVC (preview fails but allowed)
- Serverless endpoint tests:
  - multipart POST size boundaries
  - Blob prepare + PUT + generate using returned URL
- E2E (Playwright where feasible):
  - upload → generate → gallery result render
  - language switching doesn’t show raw keys
- Vercel build simulation:
  - run install/build commands locally with clean cache.

### Phase 4 — Rollout
**User stories (rollout)**
1. As a user, after deploy, uploads work without requiring refreshes.
2. As a user, I see clear guidance when cloud upload is required.
3. As a user, my uploads don’t fail silently; I get actionable errors.
4. As a maintainer, I can roll back quickly if a deploy regression occurs.
5. As a maintainer, I can monitor upload error rates via logs.

- Push fixes to GitHub main.
- Deploy to Vercel (preview → production).
- Monitor:
  - serverless logs for 413 / formidable errors
  - client error toasts frequency
  - generation success rate for uploads.

## 3. Next Actions
1. Import repo into `/app` working directory and create a fix branch.
2. Implement Phase 1 POC harness + run sample uploads (HEIF-disguised, large photo, large video path).
3. Apply Phase 2 code changes (frontend + serverless + vercel config) in minimal commits.
4. Run Phase 3 regression tests (local + scripted + optional Playwright).
5. Push to GitHub and validate Vercel preview deployment, then promote.

## 4. Success Criteria
- Image upload success across:
  - large phone photos (auto-compress)
  - HEIF/HEIC (including disguised .jpg)
  - no broken-image dead ends (fallback UI + proceed).
- Video upload works for:
  - small direct uploads
  - >3.2MB cloud offload with clear progress + “ready” state
  - HEVC preview failures handled with UX messaging.
- No raw i18n keys visible anywhere; missing keys degrade to readable labels.
- Vercel deploy succeeds reliably (no ERESOLVE; API routes match patterns without symlink fragility).
