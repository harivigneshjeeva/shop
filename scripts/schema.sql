-- ============================================
-- AUTHENTICATION (Supabase Auth Built-in)
-- ============================================
-- Users are managed manually via Supabase Dashboard
-- Email/Password authentication enabled
-- No custom user tables needed

-- ============================================
-- CORE ENTITIES
-- ============================================

CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  status TEXT CHECK (status IN ('active','retired')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('active','inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE staff_shops (
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, shop_id)
);

-- ============================================
-- FINANCIAL TRANSACTIONS
-- ============================================

CREATE TABLE daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  sale_date DATE NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  cash_amount NUMERIC(12,2) NOT NULL CHECK (cash_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (shop_id, sale_date)
);

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES expense_categories(id) NOT NULL,
  expense_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weekly_payrolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (shop_id, week_start),
  CHECK (week_end > week_start)
);

-- ============================================
-- AUDIT TRAIL
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT CHECK (action IN ('insert','update','delete')) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TARGETS & GOALS
-- ============================================

CREATE TABLE targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT CHECK (target_type IN ('daily','weekly','monthly')) NOT NULL,
  target_date DATE NOT NULL,
  sales_target NUMERIC(12,2) NOT NULL CHECK (sales_target > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (shop_id, target_type, target_date)
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_daily_sales_date ON daily_sales(sale_date DESC);
CREATE INDEX idx_daily_sales_shop ON daily_sales(shop_id);
CREATE INDEX idx_daily_sales_shop_date ON daily_sales(shop_id, sale_date DESC);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_shop ON expenses(shop_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_shop_date ON expenses(shop_id, expense_date DESC);
CREATE INDEX idx_payrolls_week ON weekly_payrolls(week_start DESC);
CREATE INDEX idx_payrolls_shop ON weekly_payrolls(shop_id);
CREATE INDEX idx_payrolls_shop_week ON weekly_payrolls(shop_id, week_start DESC);
CREATE INDEX idx_shops_status ON shops(status);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_targets_shop ON targets(shop_id);
CREATE INDEX idx_targets_date ON targets(target_date DESC);
CREATE INDEX idx_targets_shop_date ON targets(shop_id, target_date DESC);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_sales_updated_at BEFORE UPDATE ON daily_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_payrolls_updated_at BEFORE UPDATE ON weekly_payrolls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
