# SysPilot — Database Schema

## Migration Files

1. `supabase/migrations/20260314000000_initial_schema.sql`
2. `supabase/migrations/20260314133500_auth_profile_alignment.sql`

## Core Tables

- `companies`
- `profiles`
- `facilities`
- `suppliers`
- `customers`
- `products`
- `bill_of_materials`
- `bom_lines`
- `sales_orders`
- `sales_order_lines`
- `purchase_orders`
- `purchase_order_lines`
- `machines`
- `work_orders`
- `transactions`
- `quality_inspections`
- `demand_forecasts`
- `audit_logs`

## Auth + Role Notes

- `profiles.id` references `auth.users(id)`.
- `profiles.role` constraint is standardized to: `admin | manager | user`.
- Trigger `handle_new_user()` auto-creates/updates profile on auth signup and uses `raw_user_meta_data.role` when valid.

## RLS Notes

- RLS is enabled on all application tables in the initial migration.
- Current policies allow authenticated CRUD for seeded development workflows.
