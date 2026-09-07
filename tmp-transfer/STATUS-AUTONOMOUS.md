# Status autónomo — write Site_Angola bloqueado (Opção A)

Actualizado: 2026-09-07T10:46Z

## Re-probe (este turno)
- `permissions.push=false` em `EduardoZ121/Site_Angola`
- Push Git: **Authentication failed** / sem Contents write para `cursor[bot]`
- Ambiente Cursor deste run: **só** `github.com/eduardoz121/meu-site-222` (`environment: null`)
- `main` remoto oficial: **`ce203d4f`** (sem branch A/B no remoto)
- Patch unificado: `git apply --check` **OK** sobre `ce203d4f`
- Tip local: `/tmp/site-angola-publish` @ **`c5da1e6d`**

## Opção A — bloqueio humano (único caminho agora)
Agente **não pode** instalar a Cursor GitHub App no repo. Já foi registada acção externa no ambiente Cursor:

**Autorizar Cursor GitHub App em `EduardoZ121/Site_Angola`**
1. https://github.com/apps/cursor → Install/Configure
2. Acesso a `EduardoZ121/Site_Angola`
3. Contents = Read and write; Pull requests = Read and write
4. Ligar o repo ao workspace/ambiente Cursor (hoje só Meu-site-222)

## Explicitamente NÃO nesta fase
- SITE_ANGOLA_PUSH_TOKEN (Opção B) — sem autorização explícita
- Promover Meu-site-222 a SoT
- Forks / `vicentemakiese/Site_Angola`
- GOV-BF · 0043 · 0044 · 0045 · workflow de tickets

## Pronto para execução automática após write
Kit: `PUBLISH-WHEN-WRITE-OPENS.sh` (Option A first) + `kuteka-sprint-ab-unified{,-src}.patch`  
Fluxo: push branch → PR → smoke A → B Inbox/KOCC → auditoria produção
