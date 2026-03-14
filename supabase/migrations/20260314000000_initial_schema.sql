-- ============================================
-- SysPilot — Complete Supabase Schema
-- SYSPRO ERP Alternative — Final
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COMPANIES
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  industry TEXT DEFAULT 'Manufacturing',
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_id TEXT,
  fiscal_year_start INTEGER DEFAULT 1,
  currency TEXT DEFAULT 'USD',
  subscription_plan TEXT DEFAULT 'professional' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. PROFILES / USERS
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. FACILITIES
-- ============================================
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'warehouse' CHECK (type IN ('warehouse', 'plant', 'distribution_center')),
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'US',
  capacity INTEGER DEFAULT 0,
  current_utilization INTEGER DEFAULT 0,
  manager_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. SUPPLIERS
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'US',
  rating NUMERIC(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  lead_time_days INTEGER DEFAULT 7,
  payment_terms TEXT DEFAULT 'Net 30',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'US',
  credit_limit NUMERIC(12,2) DEFAULT 0,
  payment_terms TEXT DEFAULT 'Net 30',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('raw_material', 'wip', 'finished_good', 'component', 'consumable')),
  unit_of_measure TEXT NOT NULL DEFAULT 'EA' CHECK (unit_of_measure IN ('EA', 'KG', 'LB', 'M', 'FT', 'L', 'GAL', 'BOX', 'PKG')),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  overhead_cost NUMERIC(12,2) DEFAULT 0,
  labor_cost_per_unit NUMERIC(12,2) DEFAULT 0,
  total_unit_cost NUMERIC(12,2) GENERATED ALWAYS AS (unit_cost + overhead_cost + labor_cost_per_unit) STORED,
  facility_id UUID REFERENCES facilities(id),
  supplier_id UUID REFERENCES suppliers(id),
  lot_number TEXT,
  serial_number TEXT,
  location_bin TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. BILL OF MATERIALS
-- ============================================
CREATE TABLE bill_of_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  product_id UUID NOT NULL REFERENCES products(id),
  bom_name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'obsolete')),
  total_material_cost NUMERIC(12,2) DEFAULT 0,
  total_labor_cost NUMERIC(12,2) DEFAULT 0,
  total_overhead NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bom_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bom_id UUID NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES products(id),
  quantity_required NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  scrap_percentage NUMERIC(5,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 8. SALES ORDERS
-- ============================================
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_production', 'shipped', 'delivered', 'invoiced', 'cancelled')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  required_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 10.00,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sales_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 9. PURCHASE ORDERS
-- ============================================
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged', 'partially_received', 'received', 'cancelled')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 10.00,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_ordered INTEGER NOT NULL DEFAULT 1,
  quantity_received INTEGER DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 10. MACHINES + WORK ORDERS
-- ============================================
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'CNC',
  facility_id UUID REFERENCES facilities(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'offline')),
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  wo_number TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  bom_id UUID REFERENCES bill_of_materials(id),
  machine_id UUID REFERENCES machines(id),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  quantity_planned INTEGER NOT NULL DEFAULT 1,
  quantity_completed INTEGER DEFAULT 0,
  quantity_scrapped INTEGER DEFAULT 0,
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  estimated_hours NUMERIC(8,2) DEFAULT 0,
  actual_hours NUMERIC(8,2) DEFAULT 0,
  labor_cost NUMERIC(12,2) DEFAULT 0,
  material_cost NUMERIC(12,2) DEFAULT 0,
  overhead_cost NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. FINANCIAL TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  transaction_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense', 'cogs', 'payable', 'receivable', 'adjustment')),
  category TEXT NOT NULL CHECK (category IN ('sales', 'purchase', 'production', 'labor', 'overhead', 'shipping', 'tax', 'other')),
  reference_type TEXT CHECK (reference_type IN ('sales_order', 'purchase_order', 'work_order', 'manual')),
  reference_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  running_balance NUMERIC(14,2) DEFAULT 0,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. QUALITY INSPECTIONS
-- ============================================
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  inspection_number TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  work_order_id UUID REFERENCES work_orders(id),
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('incoming', 'in_process', 'final', 'customer_return')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'on_hold')),
  lot_number TEXT,
  quantity_inspected INTEGER NOT NULL DEFAULT 0,
  quantity_passed INTEGER DEFAULT 0,
  quantity_failed INTEGER DEFAULT 0,
  defect_description TEXT,
  corrective_action TEXT,
  inspector_id UUID REFERENCES profiles(id),
  inspected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. DEMAND FORECASTS
-- ============================================
CREATE TABLE demand_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  product_id UUID NOT NULL REFERENCES products(id),
  forecast_date DATE NOT NULL,
  predicted_demand INTEGER NOT NULL DEFAULT 0,
  actual_demand INTEGER DEFAULT 0,
  confidence_score NUMERIC(5,2) DEFAULT 85.00,
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. AUDIT LOG
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_facility ON products(facility_id);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_product ON work_orders(product_id);
CREATE INDEX idx_work_orders_machine ON work_orders(machine_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX idx_quality_product ON quality_inspections(product_id);
CREATE INDEX idx_quality_status ON quality_inspections(status);
CREATE INDEX idx_demand_forecast_product ON demand_forecasts(product_id);
CREATE INDEX idx_bom_product ON bill_of_materials(product_id);
CREATE INDEX idx_machines_facility ON machines(facility_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_companies" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_facilities" ON facilities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_bom" ON bill_of_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_bom_lines" ON bom_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_sales_orders" ON sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_so_lines" ON sales_order_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_purchase_orders" ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_po_lines" ON purchase_order_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_machines" ON machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_work_orders" ON work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_transactions" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_quality" ON quality_inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_forecasts" ON demand_forecasts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_audit" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_company_id UUID;
BEGIN
  SELECT id INTO default_company_id FROM companies WHERE code = 'DEFAULT' LIMIT 1;
  IF default_company_id IS NULL THEN
    INSERT INTO companies (name, code, industry)
    VALUES ('My Company', 'DEFAULT', 'Manufacturing')
    RETURNING id INTO default_company_id;
  END IF;

  INSERT INTO profiles (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    default_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sales_orders_updated BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_purchase_orders_updated BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_work_orders_updated BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE sales_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE quality_inspections;
