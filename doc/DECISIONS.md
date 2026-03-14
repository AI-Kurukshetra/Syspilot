# SysPilot — Architecture Decisions

## D001: Tech Stack
- **Decision**: Next.js 15 + Supabase + Tailwind + shadcn/ui
- **Rationale**: Fast full-stack development, free tier, excellent DX
- **Date**: 2026-03-14

## D002: Database Schema
- **Decision**: 18 tables covering all SYSPRO-inspired modules
- **Rationale**: Comprehensive ERP coverage with proper RLS
- **Date**: 2026-03-14

## D003: Auth and Dashboard Route Strategy
- **Decision**: Implement auth UX in route groups (`(auth)`, `(dashboard)`), guard dashboard layout server-side with Supabase `getUser`, and handle logout via server action.
- **Rationale**: Keeps unauthenticated routes public, centralizes protection for all dashboard modules, and avoids client-side auth race conditions.
- **Date**: 2026-03-14

## D004: Seed via Authenticated Anon Client
- **Decision**: Seed data using an authenticated user session built from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not a service-role key.
- **Rationale**: Keeps the repository aligned with RLS and avoids introducing privileged credentials into local setup.
- **Date**: 2026-03-14

## D005: Profile Role Contract
- **Decision**: Standardize app/database role values to `admin`, `manager`, `user`, and update the auth trigger to derive role from signup metadata.
- **Rationale**: Prevents signup/profile constraint mismatch and keeps role selection consistent across UI and DB.
- **Date**: 2026-03-14

## D006: Phase 2 UI/Charting Library Choice
- **Decision**: Use `recharts` for dashboard KPI visualization and retain shadcn/ui + Tailwind for all module UIs.
- **Rationale**: `recharts` is already installed, type-safe with React/TS, and provides fast implementation of responsive operational charts without introducing additional dependencies.
- **Date**: 2026-03-14

## D007: Server-Action CRUD for Module Workflows
- **Decision**: Implement Phase 2 module operations as server-rendered pages with server actions validated by Zod.
- **Rationale**: Keeps data fetching on the server, aligns with App Router conventions, and avoids client-side auth/session synchronization complexity.
- **Date**: 2026-03-14

## D008: UI Animation Stack
- **Decision**: Use `framer-motion` for entrance and stagger animations while keeping layout/styling in Tailwind + shadcn.
- **Rationale**: Free, production-proven animation library with strong React ergonomics; enables polished motion without paid tooling.
- **Date**: 2026-03-14

## D009: Bark-Blue Theme Direction
- **Decision**: Shift UI to a bark-blue enterprise look (deep navy sidebar, cyan accents, glass content surfaces, textured background).
- **Rationale**: Aligns with requested reference mood while staying distinct, readable, and consistent across auth and dashboard modules.
- **Date**: 2026-03-14

## D010: Forecast + Quality + BOM Module Delivery
- **Decision**: Implement advanced modules as server-rendered pages with server actions and structured tables/charts.
- **Rationale**: Keeps consistency with existing Phase 2 architecture while enabling immediate functional coverage of Phase 3 requirements.
- **Date**: 2026-03-14

## D011: High-Volume Seed Strategy
- **Decision**: Seed large datasets using chunked upserts/inserts with deterministic identifiers.
- **Rationale**: Supports repeatable demo environments with realistic volume while keeping reruns safe and predictable.
- **Date**: 2026-03-14

## D012: Admin-Scoped User Management
- **Decision**: Implement user administration as an admin-only dashboard route (`/users`) that only manages `manager` and `user` profile records, and keep password changes self-service (`auth.updateUser`) for the currently signed-in admin.
- **Rationale**: Delivers required control boundaries without introducing service-role credentials into client code, while preserving existing Supabase anon-key security posture.
- **Date**: 2026-03-14

## D013: Subdomain Multi-Tenant Model
- **Decision**: Move from single-tenant `admin` model to SaaS tenancy with company `slug`, role hierarchy (`super_admin`, `company_admin`, `manager`, `user`), strict `company_id` RLS isolation, and middleware tenant-slug resolution.
- **Rationale**: Enables secure tenant separation by default while keeping one global super admin capable of cross-tenant operations and company scope switching from the UI.
- **Date**: 2026-03-14

## D014: Local Email Verification UX
- **Decision**: In local development, auto-open a browser inbox URL (`NEXT_PUBLIC_LOCAL_MAILBOX_URL`, default `http://127.0.0.1:54324`) when signup requires email verification.
- **Rationale**: Removes dependency on external email delivery during local testing and speeds up auth verification loops.
- **Date**: 2026-03-14

## D015: Tenant-Scoped Login Enforcement
- **Decision**: Enforce company/subdomain matching at login boundary in middleware, and fail closed by signing users out if authenticated on a mismatched tenant URL.
- **Rationale**: Prevents cross-tenant access attempts from ever reaching dashboard routes and provides deterministic security behavior independent of client UI.
- **Date**: 2026-03-14

## D016: Client-Mount Detection Without Effect-SetState
- **Decision**: Replace mount gating patterns (`useEffect(() => setMounted(true), [])`) with `useSyncExternalStore` for client-only chart/theme rendering checks.
- **Rationale**: Satisfies current React lint constraints while preserving SSR-safe fallbacks and avoiding effect-triggered cascading render anti-patterns.
- **Date**: 2026-03-14

## D017: Normalize Root Domain Host for Tenant Parsing
- **Decision**: Normalize `NEXT_PUBLIC_ROOT_DOMAIN` with port stripping when resolving tenant slug from request host.
- **Rationale**: Keeps tenant detection correct in local setups that use host+port roots (for example `localhost:3000`) and prevents accidental bypass of subdomain access checks.
- **Date**: 2026-03-14

## D018: Suspense Boundary for Login Query-Param Reads
- **Decision**: Wrap the login client form in `<Suspense>` at the page boundary because it uses `useSearchParams()`.
- **Rationale**: Prevents static prerender/export failure for `/login` in production builds while preserving tenant-mismatch error rendering via query params.
- **Date**: 2026-03-14

## D019: Public Marketing Homepage at Root Route
- **Decision**: Use `/` as a public introduction page (hero, benefits, testimonials, visual previews, Login/Register CTAs) and keep authenticated workspaces under `/dashboard` and module routes.
- **Rationale**: Improves first-time user onboarding and product communication while preserving clean separation between pre-auth marketing and post-auth ERP operations.
- **Date**: 2026-03-14

## D020: One-Page Marketing Navigation
- **Decision**: Add sticky in-page navigation (`Features`, `Pricing`, `Contact`) and smooth-scroll behavior on the public homepage.
- **Rationale**: Improves scanability and conversion flow for first-time visitors while keeping login/register actions accessible from every viewport depth.
- **Date**: 2026-03-14

## D021: Public Root Route in Auth Middleware
- **Decision**: Exclude `/` from unauthenticated redirect logic in middleware so root marketing page remains publicly accessible.
- **Rationale**: Prevents middleware from overriding the intended index experience and ensures production root domain serves the introduction page.
- **Date**: 2026-03-14
