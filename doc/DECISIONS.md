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
