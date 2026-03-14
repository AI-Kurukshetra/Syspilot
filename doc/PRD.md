# SysPilot — Product Requirements Document
## Vision
AI-powered ERP platform inspired by SYSPRO, built with Next.js 15 + Supabase.

## Core Modules
1. **Dashboard** — KPI cards, charts, real-time metrics
2. **Inventory Management** — Stock levels, warehouses, transfers, alerts
3. **Sales Orders** — Create/manage orders, status tracking, customer lookup
4. **Purchase Orders** — Supplier management, PO creation, receiving
5. **Production Planning** — Work orders, BOM, scheduling, shop floor
6. **Financial Tracking** — GL, AP, AR, cash flow, P&L
7. **Bill of Materials** — Multi-level BOM, cost rollup
8. **Quality Control** — Inspections, NCRs, compliance
9. **AI Forecasting** — Demand prediction, inventory optimization
10. **Auth** — Email/password login, role-based access (admin/manager/user)

## Non-Functional
- Mobile-responsive (Tailwind mobile-first)
- Dark mode support
- Real-time updates via Supabase Realtime
- TypeScript strict, no `any`
- RLS on every table
