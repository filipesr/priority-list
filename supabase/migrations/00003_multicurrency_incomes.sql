-- 1. Add currency column to expenses (existing rows default to BRL)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL';

-- 2. Add preferred_currency to profiles (if not exists already)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN preferred_currency TEXT NOT NULL DEFAULT 'BRL';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Exchange rates table (1 USD = X currency)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL,
  rate NUMERIC(18,6) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view exchange rates" ON exchange_rates FOR SELECT
  USING (public.is_approved());
CREATE POLICY "Approved users can create exchange rates" ON exchange_rates FOR INSERT
  WITH CHECK (public.is_approved());
CREATE POLICY "Admins can update exchange rates" ON exchange_rates FOR UPDATE
  USING (public.is_admin());
CREATE POLICY "Admins can delete exchange rates" ON exchange_rates FOR DELETE
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_date ON exchange_rates (currency, effective_date DESC);

-- 4. Incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('weekly', 'monthly', 'yearly')),
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view all incomes" ON incomes FOR SELECT
  USING (public.is_approved());
CREATE POLICY "Approved users can create incomes" ON incomes FOR INSERT
  WITH CHECK (public.is_approved());
CREATE POLICY "Approved users can update incomes" ON incomes FOR UPDATE
  USING (public.is_approved());
CREATE POLICY "Approved users can delete incomes" ON incomes FOR DELETE
  USING (public.is_approved());

CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes (user_id);

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
