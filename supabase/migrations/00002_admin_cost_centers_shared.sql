-- 0. Helper functions (SECURITY DEFINER bypasses RLS, avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.is_approved() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Add role and approval to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

-- Seed admin (case-insensitive email match)
UPDATE profiles SET role = 'admin', approved = true
  WHERE id IN (SELECT id FROM auth.users WHERE lower(email) = lower('movimento.jant@gmail.com'));

-- 2. Add cost_center to expenses
DO $$ BEGIN
  CREATE TYPE cost_center AS ENUM ('casa', 'carro', 'filipe', 'mayara', 'samuel', 'ana', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS cost_center cost_center NOT NULL DEFAULT 'outros';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Backfill created_by_name from profiles
UPDATE expenses e SET created_by_name = (
  SELECT COALESCE(p.full_name, 'Desconhecido') FROM profiles p WHERE p.id = e.user_id
) WHERE e.created_by_name IS NULL;

-- 3. Add recurrence columns if not exist (from prior migration)
DO $$ BEGIN
  ALTER TABLE expenses ADD COLUMN recurrence_frequency TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE expenses ADD COLUMN recurrence_month INTEGER CHECK (recurrence_month >= 1 AND recurrence_month <= 12);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Update expense RLS → all approved users can CRUD all expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
DROP POLICY IF EXISTS "Approved users can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Approved users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Approved users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Approved users can delete expenses" ON expenses;

CREATE POLICY "Approved users can view all expenses" ON expenses FOR SELECT
  USING (public.is_approved());
CREATE POLICY "Approved users can create expenses" ON expenses FOR INSERT
  WITH CHECK (public.is_approved());
CREATE POLICY "Approved users can update expenses" ON expenses FOR UPDATE
  USING (public.is_approved());
CREATE POLICY "Approved users can delete expenses" ON expenses FOR DELETE
  USING (public.is_approved());

-- 5. Update budget RLS → shared budget (no user_id filter)
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can create own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Approved users can view budgets" ON budgets;
DROP POLICY IF EXISTS "Approved users can manage budgets" ON budgets;

CREATE POLICY "Approved users can view budgets" ON budgets FOR SELECT
  USING (public.is_approved());
CREATE POLICY "Approved users can manage budgets" ON budgets FOR ALL
  USING (public.is_approved());

-- 6. Update profiles RLS → admin can view/update all profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT
  USING (public.is_admin());
CREATE POLICY "Admin can update all profiles" ON profiles FOR UPDATE
  USING (public.is_admin());

-- 7. Update handle_new_user trigger to auto-approve admin email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE WHEN lower(NEW.email) = lower('movimento.jant@gmail.com') THEN 'admin' ELSE 'user' END,
    CASE WHEN lower(NEW.email) = lower('movimento.jant@gmail.com') THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. New indexes
CREATE INDEX IF NOT EXISTS idx_expenses_cost_center ON expenses (cost_center);
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles (approved);

-- 9. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
