# Apply Kuteka email corp kit → Site_Angola

1. Copy `packages-email/` → `packages/email/`
2. Copy `scripts-email/` → `scripts/email/`
3. Copy `docs-email/` → `docs/operations/email/`
4. Copy `apps-web-api/send-route.ts` → `apps/web/app/api/internal/mail/send/route.ts`
5. Merge env.ts + package.json dependency `@kuteka/email`
6. Set secrets; run `SKIP_NS_CUTOVER=1 node scripts/email/apply-kuteka-email-stack.mjs` then full apply
7. Configure Supabase SMTP (see CORPORATE_EMAIL_BETA.md)
