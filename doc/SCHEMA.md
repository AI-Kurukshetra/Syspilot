# SysPilot — Database Schema

## Migration Files

1. `supabase/migrations/20260314000000_initial_schema.sql`
2. `supabase/migrations/20260314133500_auth_profile_alignment.sql`
3. `supabase/migrations/20260314173000_multitenant_saas_foundation.sql`

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
- `companies.slug` is now required and unique for tenant subdomain mapping.
- `profiles.role` is standardized to: `super_admin | company_admin | manager | user`.
- `profiles` enforces role/company consistency:
  `super_admin` must have `company_id = null`; all other roles require non-null `company_id`.
- Trigger `handle_new_user()` now:
  - creates/links company by signup metadata (`company_name`, `company_slug`) for tenant registrations
  - supports direct `super_admin` profile creation with no company assignment
  - defaults non-super-admin signup roles to `company_admin`
- Business identifiers (`sku`, `order_number`, `code`, etc.) are now unique per company (composite unique keys).

## RLS Notes

- RLS is enabled on all application tables in the initial migration.
- Legacy permissive policies were replaced with tenant-safe policies.
- `super_admin` has cross-tenant access.
- Non-super-admin users are restricted to rows where `company_id = current_company_id()`.
- Child-line tables (`bom_lines`, `sales_order_lines`, `purchase_order_lines`) inherit tenant scope via parent-row checks.
