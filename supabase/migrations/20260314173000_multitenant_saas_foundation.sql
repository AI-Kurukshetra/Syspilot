-- Multi-tenant SaaS foundation for SysPilot.
-- Adds company slug + role hierarchy + strict tenant RLS policies.

BEGIN;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.companies
SET slug = lower(regexp_replace(coalesce(code, name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

ALTER TABLE public.companies
  ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_slug_key'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_slug_key UNIQUE (slug);
  END IF;
END
$$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles
SET role = 'company_admin'
WHERE role = 'admin';

UPDATE public.profiles
SET role = 'user'
WHERE role NOT IN ('super_admin', 'company_admin', 'manager', 'user');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'company_admin', 'manager', 'user'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_company_role_check
  CHECK (
    (role = 'super_admin' AND company_id IS NULL)
    OR (role <> 'super_admin' AND company_id IS NOT NULL)
  );

ALTER TABLE public.facilities DROP CONSTRAINT IF EXISTS facilities_code_key;
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_code_key;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_code_key;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sku_key;
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_order_number_key;
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_po_number_key;
ALTER TABLE public.machines DROP CONSTRAINT IF EXISTS machines_code_key;
ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS work_orders_wo_number_key;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_number_key;
ALTER TABLE public.quality_inspections DROP CONSTRAINT IF EXISTS quality_inspections_inspection_number_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'facilities_company_code_key'
  ) THEN
    ALTER TABLE public.facilities
      ADD CONSTRAINT facilities_company_code_key UNIQUE (company_id, code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_company_code_key'
  ) THEN
    ALTER TABLE public.suppliers
      ADD CONSTRAINT suppliers_company_code_key UNIQUE (company_id, code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_company_code_key'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_company_code_key UNIQUE (company_id, code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_company_sku_key'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_company_sku_key UNIQUE (company_id, sku);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_company_order_number_key'
  ) THEN
    ALTER TABLE public.sales_orders
      ADD CONSTRAINT sales_orders_company_order_number_key UNIQUE (company_id, order_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_company_po_number_key'
  ) THEN
    ALTER TABLE public.purchase_orders
      ADD CONSTRAINT purchase_orders_company_po_number_key UNIQUE (company_id, po_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'machines_company_code_key'
  ) THEN
    ALTER TABLE public.machines
      ADD CONSTRAINT machines_company_code_key UNIQUE (company_id, code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_company_wo_number_key'
  ) THEN
    ALTER TABLE public.work_orders
      ADD CONSTRAINT work_orders_company_wo_number_key UNIQUE (company_id, wo_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_company_transaction_number_key'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_company_transaction_number_key UNIQUE (company_id, transaction_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quality_inspections_company_inspection_number_key'
  ) THEN
    ALTER TABLE public.quality_inspections
      ADD CONSTRAINT quality_inspections_company_inspection_number_key UNIQUE (company_id, inspection_number);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_facilities_company ON public.facilities(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_bom_company ON public.bill_of_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company_id ON public.sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_machines_company ON public.machines(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_company ON public.work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_quality_company ON public.quality_inspections(company_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_company ON public.demand_forecasts(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON public.audit_logs(company_id);

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_user_role() = 'super_admin', false);
$$;

CREATE OR REPLACE FUNCTION public.generate_company_slug(input_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  cleaned text;
BEGIN
  cleaned := lower(regexp_replace(coalesce(input_name, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  cleaned := trim(both '-' FROM cleaned);

  IF cleaned = '' THEN
    cleaned := 'company';
  END IF;

  RETURN cleaned;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_role text;
  desired_company_name text;
  desired_company_slug text;
  resolved_company_id uuid;
BEGIN
  desired_role := lower(coalesce(NEW.raw_user_meta_data ->> 'role', 'company_admin'));
  desired_company_name := coalesce(NEW.raw_user_meta_data ->> 'company_name', '');
  desired_company_slug := public.generate_company_slug(
    coalesce(NEW.raw_user_meta_data ->> 'company_slug', desired_company_name)
  );

  IF desired_role NOT IN ('super_admin', 'company_admin', 'manager', 'user') THEN
    desired_role := 'company_admin';
  END IF;

  IF desired_role = 'super_admin' THEN
    resolved_company_id := NULL;
  ELSE
    SELECT id INTO resolved_company_id
    FROM public.companies
    WHERE slug = desired_company_slug
    LIMIT 1;

    IF resolved_company_id IS NULL THEN
      INSERT INTO public.companies (name, code, slug, industry)
      VALUES (
        CASE WHEN desired_company_name = '' THEN 'New Company' ELSE desired_company_name END,
        upper(left(replace(desired_company_slug, '-', ''), 12)),
        desired_company_slug,
        'Manufacturing'
      )
      RETURNING id INTO resolved_company_id;
    END IF;

    IF desired_role = 'manager' OR desired_role = 'user' THEN
      desired_role := 'company_admin';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    resolved_company_id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    desired_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS auth_all_companies ON public.companies;
DROP POLICY IF EXISTS auth_all_profiles ON public.profiles;
DROP POLICY IF EXISTS auth_all_facilities ON public.facilities;
DROP POLICY IF EXISTS auth_all_suppliers ON public.suppliers;
DROP POLICY IF EXISTS auth_all_customers ON public.customers;
DROP POLICY IF EXISTS auth_all_products ON public.products;
DROP POLICY IF EXISTS auth_all_bom ON public.bill_of_materials;
DROP POLICY IF EXISTS auth_all_bom_lines ON public.bom_lines;
DROP POLICY IF EXISTS auth_all_sales_orders ON public.sales_orders;
DROP POLICY IF EXISTS auth_all_so_lines ON public.sales_order_lines;
DROP POLICY IF EXISTS auth_all_purchase_orders ON public.purchase_orders;
DROP POLICY IF EXISTS auth_all_po_lines ON public.purchase_order_lines;
DROP POLICY IF EXISTS auth_all_machines ON public.machines;
DROP POLICY IF EXISTS auth_all_work_orders ON public.work_orders;
DROP POLICY IF EXISTS auth_all_transactions ON public.transactions;
DROP POLICY IF EXISTS auth_all_quality ON public.quality_inspections;
DROP POLICY IF EXISTS auth_all_forecasts ON public.demand_forecasts;
DROP POLICY IF EXISTS auth_all_audit ON public.audit_logs;

CREATE POLICY companies_select ON public.companies
FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR id = public.current_company_id()
);

CREATE POLICY companies_manage ON public.companies
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY profiles_select ON public.profiles
FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR company_id = public.current_company_id()
  OR id = auth.uid()
);

CREATE POLICY profiles_manage ON public.profiles
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.current_user_role() = 'company_admin'
    AND company_id = public.current_company_id()
    AND role <> 'super_admin'
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.current_user_role() = 'company_admin'
    AND company_id = public.current_company_id()
    AND role <> 'super_admin'
  )
);

DO $$
DECLARE
  tenant_table text;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'facilities',
    'suppliers',
    'customers',
    'products',
    'bill_of_materials',
    'sales_orders',
    'purchase_orders',
    'machines',
    'work_orders',
    'transactions',
    'quality_inspections',
    'demand_forecasts',
    'audit_logs'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tenant_table || '_tenant_select', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tenant_table || '_tenant_modify', tenant_table);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_super_admin() OR company_id = public.current_company_id())',
      tenant_table || '_tenant_select',
      tenant_table
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_super_admin() OR company_id = public.current_company_id()) WITH CHECK (public.is_super_admin() OR company_id = public.current_company_id())',
      tenant_table || '_tenant_modify',
      tenant_table
    );
  END LOOP;
END
$$;

CREATE POLICY bom_lines_tenant_access ON public.bom_lines
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.bill_of_materials bom
    WHERE bom.id = bom_lines.bom_id
      AND bom.company_id = public.current_company_id()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.bill_of_materials bom
    WHERE bom.id = bom_lines.bom_id
      AND bom.company_id = public.current_company_id()
  )
);

CREATE POLICY sales_order_lines_tenant_access ON public.sales_order_lines
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.sales_orders so
    WHERE so.id = sales_order_lines.sales_order_id
      AND so.company_id = public.current_company_id()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.sales_orders so
    WHERE so.id = sales_order_lines.sales_order_id
      AND so.company_id = public.current_company_id()
  )
);

CREATE POLICY purchase_order_lines_tenant_access ON public.purchase_order_lines
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.purchase_orders po
    WHERE po.id = purchase_order_lines.purchase_order_id
      AND po.company_id = public.current_company_id()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.purchase_orders po
    WHERE po.id = purchase_order_lines.purchase_order_id
      AND po.company_id = public.current_company_id()
  )
);

COMMIT;
