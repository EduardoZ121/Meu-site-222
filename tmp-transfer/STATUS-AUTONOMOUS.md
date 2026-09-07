# Status autónomo — write Site_Angola bloqueado (Opção A)

Actualizado: 2026-09-07T11:46Z (timer re-probe Option A)

## Re-probe
- `permissions.push=false`
- Push: **Permission denied to cursor[bot]** (403) em `EduardoZ121/Site_Angola`
- Ambiente Cursor: só `github.com/eduardoz121/meu-site-222` (`environment: null`)
- Sem `SITE_ANGOLA_PUSH_TOKEN` (Opção B não usada)
- `main` remoto: sem branch `cursor/sprint-ab-beta-inbox-f96b` / A+B ainda não publicados
- Tip local intacto: `/tmp/site-angola-publish` @ **`c5da1e6d`**

## Bloqueio exacto (humano / admin)
Cursor GitHub App **não** tem Contents write neste repo para `cursor[bot]`.

Founder:
1. https://github.com/apps/cursor → Install/Configure em **EduardoZ121/Site_Angola**
2. Contents + Pull requests = Read and write
3. Ligar Site_Angola ao ambiente Cursor Cloud (hoje só Meu-site-222)

## Isolado
GOV-BF · 0043 · 0044 · 0045 · tickets · Vicente · Opção B/C

## Após desbloqueio (automático)
`PUBLISH-WHEN-WRITE-OPENS.sh` → PR → smoke A → B Inbox/KOCC → auditoria
