# SysPilot — Blockers
Active blockers listed below.

[2026-03-14] BLOCKER — codex
Problem:   Could not run remote Supabase migration because CLI is not authenticated (`Access token not provided`).
Attempted: Installed Supabase CLI (`pnpm dlx supabase --version`), then ran `supabase db push` and `supabase link --project-ref <ref>`.
Needs:     Provide `SUPABASE_ACCESS_TOKEN` (or run `supabase login`) and remote DB password for migration push, then re-run migration and seed.

[2026-03-14] BLOCKER — codex
Problem:   `pnpm seed` fails in Supabase Auth with `email rate limit exceeded` while creating seed user.
Attempted: Seed with default and override emails after successful migration push.
Needs:     Wait for rate-limit window OR provide existing confirmed user credentials (`SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`) OR relax auth limits/email confirmation in Supabase project settings, then rerun `pnpm seed`.
[2026-03-14] RESOLVED — codex
Resolved: Supabase seed blocker cleared; seeding completed successfully with existing confirmed admin credentials.

[2026-03-14] BLOCKER — codex
Problem:   Vercel production deployment failed (`The specified token is not valid`).
Attempted: Ran `pnpm dlx vercel --prod --yes` from project root.
Needs:     Run `vercel login` with a valid account/token (or provide `VERCEL_TOKEN`) and rerun deploy.

[2026-03-14] BLOCKER — codex
Problem:   Wildcard subdomain could not be configured on `*.syspilot.vercel.app` (`403: no access to domain`).
Attempted: Ran `pnpm dlx vercel domains add '*.syspilot.vercel.app'` against linked project `syspilot`.
Needs:     Provide or add a custom root domain owned by your team (for example `syspilot.com`) in Vercel, then configure wildcard `*.syspilot.com` and DNS records.
[2026-03-14] RESOLVED — codex
Resolved: Implemented free alternative on Vercel shared domain using per-tenant aliases (`{slug}-syspilot.vercel.app`) and verified alias creation (`abc-syspilot.vercel.app`).
