# SysPilot — Master Task List

## Phase 0: Foundation
- [ ] Initialize Next.js 15 + TypeScript + Tailwind + pnpm
- [ ] Install dependencies (Supabase, shadcn, recharts, zod, etc.)
- [x] Set up Supabase client files (client.ts, server.ts, middleware.ts) (2026-03-14 13:25)
- [x] Set up root middleware.ts for auth protection (2026-03-14 13:25)
- [x] Create .env.local with Supabase credentials (2026-03-14 13:25)
- [x] Run supabase-schema.sql in Supabase SQL Editor / via migration push (2026-03-14 14:05)
- [ ] Deploy to Vercel (initial)
- [ ] Copy AGENTS.md to repo root

## Phase 1: Auth + Layout
- [x] Login page with email/password (2026-03-14 13:04)
- [x] Signup page with role selection (2026-03-14 13:04)
- [x] Dashboard layout with sidebar navigation (2026-03-14 13:04)
- [x] Auth callback route (2026-03-14 13:04)
- [x] Session management + protected routes (2026-03-14 13:04)

## Phase 2: Core Modules
- [x] Analytics Dashboard (KPI cards + charts) (2026-03-14 14:16)
- [x] Inventory Management (CRUD + stock levels) (2026-03-14 14:16)
- [x] Sales Orders (create, list, status tracking) (2026-03-14 14:16)
- [x] Purchase Orders (supplier, PO, receiving) (2026-03-14 14:16)
- [x] Production Planning (work orders, scheduling) (2026-03-14 14:16)
- [x] Financial Tracking (GL, AP, AR overview) (2026-03-14 14:16)

## Phase 3: Advanced Features
- [x] Bill of Materials (multi-level BOM) (2026-03-14 14:52)
- [x] Quality Control (inspections, NCRs) (2026-03-14 14:52)
- [x] AI Forecasting Dashboard (2026-03-14 14:52)

## Phase 4: Polish + Deploy
- [x] Seed demo data (script implemented) (2026-03-14 13:25)
- [x] Responsive polish (mobile) (2026-03-14 14:29)
- [x] Dark mode toggle (2026-03-14 14:52)
- [!] Final Vercel deploy (blocked: invalid Vercel token) (2026-03-14 14:52)
- [x] README with screenshots (2026-03-14 14:52)
