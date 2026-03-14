# SysPilot — Progress Log
[2026-03-14 13:04] codex — Built Phase 1 auth pages, auth callback route, dashboard layout/sidebar, dashboard redirect, and welcome placeholder.
[2026-03-14 13:25] codex — Integrated Supabase env handling, added auth/profile alignment migration, and added idempotent pnpm seed script with demo ERP records.
[2026-03-14 13:46] codex — Verified Supabase connection uses .env.local (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and confirmed with successful production build.
[2026-03-14 14:05] codex — Linked Supabase CLI, repaired migration state for existing schema, and pushed pending migration to remote DB; seed blocked by Supabase Auth email rate-limit.
[2026-03-14 14:08] codex — Seeded Supabase demo data successfully using existing admin credentials (DEMO company and core records created).
[2026-03-14 14:16] codex — Completed Phase 2 modules with responsive dashboard analytics (Recharts), inventory CRUD, sales/purchase order flows, production work-order planning, and finance ledger UI.
[2026-03-14 14:29] codex — Redesigned UI with bark-blue visual system, animated navigation/page transitions via framer-motion, and upgraded auth/dashboard experiences.
[2026-03-14 14:52] codex — Completed Phase 3 modules (BOM, Quality, AI Forecasting), added dark mode toggle + README screenshot section, and executed expanded seed successfully (50 customers, 100 products/orders).
[2026-03-14 16:13] codex — Added admin-only users module to manage manager/user accounts, added admin self password update flow, and wired admin-only sidebar navigation entry.
[2026-03-14 16:31] codex — Implemented multi-tenant SaaS foundation: company slug model + strict RLS migration, subdomain-aware middleware/context, company registration to tenant URL flow, and super admin tenant management dashboard.
[2026-03-14 16:31] codex — Applied migration `20260314173000_multitenant_saas_foundation.sql` to remote Supabase and verified tenant-safe demo seeding succeeds with updated role/onConflict logic.
[2026-03-14 16:52] codex — Configured free Vercel alias-based tenant URL approach (`{slug}-syspilot.vercel.app`), created live alias `abc-syspilot.vercel.app`, and updated tenant URL parser/generator accordingly.
[2026-03-14 16:59] codex — Added local-dev signup verification helper that auto-opens local inbox (`NEXT_PUBLIC_LOCAL_MAILBOX_URL`, default `http://127.0.0.1:54324`) instead of relying on external email delivery.
[2026-03-14 17:04] codex — Switched `.env.local` from remote Supabase to local Supabase stack (`127.0.0.1:54321`) to eliminate remote auth email rate-limit during local signup testing.
[2026-03-14 17:36] codex — Enforced tenant-scoped login: users are signed out and blocked when attempting to authenticate on a different company subdomain; login page now shows tenant-mismatch guidance.
[2026-03-14 17:41] codex — Cleared repository lint blockers (`set-state-in-effect`) in dashboard client components and hardened tenant mismatch guards for non-super-admin accounts missing valid company slug mapping.
[2026-03-14 17:46] codex — Fixed tenant host parsing for local subdomains by normalizing configured root domains with ports (e.g. `localhost:3000`), restoring middleware/login tenant mismatch enforcement locally.
