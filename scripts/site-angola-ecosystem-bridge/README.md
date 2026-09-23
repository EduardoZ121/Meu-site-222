# Bridge — Kuteka ecosystem → Site_Angola

**SoT:** https://github.com/EduardoZ121/Site_Angola  
**Branch alvo:** `cursor/kuteka-ecosystem-execution-f96b`  
**Commit local:** ver `COMMIT_SHA.txt` / `COMMIT_META.txt`

O Cloud Agent deste workspace (`Meu-site-222`) **não tem write** no GitHub App Cursor para `Site_Angola` (`repository_selection=selected`, só este repo). O trabalho ecosystem está pronto localmente; este bridge preserva o patch até haver write.

## Conteúdo do patch (51 ficheiros)

- Migrations `0043`–`0048` (feedback Founder/path/RPC/status; notify on publish; assign interest)
- UI KOCC/Admin feedback status workflow
- Property completeness checklist
- Agent lead claim + Marketplace CTA + Explore demand CTA
- Auth RLS helpers + docs PENDING_FOUNDER / RLS matrix

## Desbloquear (escolher 1)

1. **GitHub App Cursor:** Settings → Installations → Cursor → adicionar `EduardoZ121/Site_Angola` (Contents + PRs write), ou *All repositories*.
2. **Secret:** `SITE_ANGOLA_PUSH_TOKEN` = PAT classic `repo` para Site_Angola (revogar depois).

## Push quando houver token

```bash
# Se o clone local ainda existir:
SITE_ANGOLA_PUSH_TOKEN=ghp_… ./scripts/site-angola-ecosystem-bridge/PUSH_WHEN_READY.sh /tmp/site-angola-retry

# Ou aplicar o patch num clone fresco:
git clone https://github.com/EduardoZ121/Site_Angola.git /tmp/sa && cd /tmp/sa
git checkout -b cursor/kuteka-ecosystem-execution-f96b
git apply /path/to/kuteka-ecosystem-execution.patch
git add -A && git commit -m "feat(ecosystem): feedback workflow, matching notify, completeness, agent leads"
SITE_ANGOLA_PUSH_TOKEN=ghp_… git push -u origin HEAD
```

Depois: abrir PR → merge → Deploy Vercel → aplicar SQL `0043`–`0048` no Supabase `vhqwitbrpqaiutjbundo`.
