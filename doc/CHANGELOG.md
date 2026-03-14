# SysPilot — Changelog

## 2026-03-14
- Added auth routes: `/login`, `/signup`, and `/auth/callback` under `src/app`.
- Added dashboard route group with protected layout sidebar, user avatar, logout server action, root redirect, and `/dashboard` placeholder page.
- Added `src/lib/supabase/{client,server,middleware}.ts` to align Supabase helpers with `@/*` alias.
- Removed default starter homepage `src/app/page.tsx` to avoid route collision with `src/app/(dashboard)/page.tsx`.

## 2026-03-14
- Added strict Supabase env loader `src/lib/supabase/env.ts` and wired client/server/middleware to `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Updated signup flow to include `emailRedirectTo` callback support (`/auth/callback`).
- Added migration `supabase/migrations/20260314133500_auth_profile_alignment.sql` to align `profiles.role` values (`admin/manager/user`) and update `handle_new_user()` to honor signup metadata role.
- Added idempotent seed script `scripts/seed-supabase.mjs` and `pnpm seed` command.
- Replaced starter README with project-specific Supabase setup and seed instructions.
- Applied remote migrations via Supabase CLI (`db push`) after repairing migration history for pre-existing initial schema.
- Seed execution currently blocked by Supabase Auth constraints (`email rate limit exceeded`) when creating/signing seed user.
- Executed `pnpm seed` successfully with existing credentials; demo data now present in remote Supabase project.
- Added full Phase 2 app routes: `/inventory`, `/sales`, `/purchases`, `/production`, `/finance`.
- Replaced dashboard placeholder with KPI cards and chart-based analytics using `recharts`.
- Implemented server-action based create/update flows for products, sales orders, purchase orders (including receiving), work orders, and transactions with Zod validation.
- Added shared authenticated Supabase context helper for server routes: `src/lib/supabase/context.ts`.
- Added `framer-motion` (free) and introduced animated page transitions and staggered sidebar navigation.
- Reworked global theme to a bark-blue design system with atmospheric gradients, grid texture, glass surfaces, and shadow tokens.
- Updated auth pages and dashboard shell with modernized UI styling and responsive visual polish.
- Enhanced dashboard analytics styling and module card surfaces to align with the new theme.
- Added Phase 3 routes: `/bom`, `/quality`, `/ai-forecasting` with server actions and module dashboards.
- Added dark mode toggle component and integrated it into dashboard header.
- Added AI forecast chart component and forecast generation action.
- Expanded seed script to generate large idempotent demo dataset: 50 customers, 20 suppliers, 100 products, 100 sales orders, 100 purchase orders, 100 work orders, 100 quality inspections, 30 BOMs, and 300 forecasts.
- Added README screenshot section and SVG screenshot assets under `public/screenshots/`.
- Attempted Vercel production deploy via CLI; blocked by invalid Vercel token.
