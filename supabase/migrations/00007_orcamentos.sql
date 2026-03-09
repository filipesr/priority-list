-- ============================================================
-- Migration 00007: Orçamentos (Workspaces)
-- ============================================================

-- 0. New enum for orcamento member roles
DO $$ BEGIN
  CREATE TYPE orcamento_role AS ENUM ('owner', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Orcamentos table
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- 2. Orcamento members table
CREATE TABLE IF NOT EXISTS orcamento_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role orcamento_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (orcamento_id, user_id)
);

ALTER TABLE orcamento_members ENABLE ROW LEVEL SECURITY;

-- 3. Add orcamento_id columns (nullable initially for backfill)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE;
ALTER TABLE pendencias ADD COLUMN IF NOT EXISTS orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selected_orcamento_id UUID REFERENCES orcamentos(id) ON DELETE SET NULL;

-- 4. Create default orcamento and backfill data
DO $$
DECLARE
  admin_uid UUID;
  default_orcamento_id UUID;
BEGIN
  -- Find admin user
  SELECT id INTO admin_uid FROM public.profiles WHERE role = 'admin' LIMIT 1;

  -- Create default orcamento
  INSERT INTO orcamentos (name, created_by)
  VALUES ('Orçamento Principal', admin_uid)
  RETURNING id INTO default_orcamento_id;

  -- Backfill orcamento_id for all existing data
  UPDATE expenses SET orcamento_id = default_orcamento_id WHERE orcamento_id IS NULL;
  UPDATE incomes SET orcamento_id = default_orcamento_id WHERE orcamento_id IS NULL;
  UPDATE pendencias SET orcamento_id = default_orcamento_id WHERE orcamento_id IS NULL;

  -- Add all approved users as members (admin=owner, others=editor)
  INSERT INTO orcamento_members (orcamento_id, user_id, role)
  SELECT default_orcamento_id, id,
    CASE WHEN role = 'admin' THEN 'owner'::orcamento_role ELSE 'editor'::orcamento_role END
  FROM public.profiles
  WHERE approved = true;

  -- Set selected_orcamento_id for all users
  UPDATE profiles SET selected_orcamento_id = default_orcamento_id WHERE approved = true;
END $$;

-- 5. Make orcamento_id NOT NULL after backfill
ALTER TABLE expenses ALTER COLUMN orcamento_id SET NOT NULL;
ALTER TABLE incomes ALTER COLUMN orcamento_id SET NOT NULL;
ALTER TABLE pendencias ALTER COLUMN orcamento_id SET NOT NULL;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_orcamento ON expenses (orcamento_id);
CREATE INDEX IF NOT EXISTS idx_incomes_orcamento ON incomes (orcamento_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_orcamento ON pendencias (orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_members_user ON orcamento_members (user_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_members_orcamento ON orcamento_members (orcamento_id);

-- 7. Helper functions (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_orcamento_member(orc_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orcamento_members
    WHERE orcamento_id = orc_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.selected_orcamento() RETURNS UUID AS $$
  SELECT selected_orcamento_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 8. RLS for orcamentos
CREATE POLICY "Members can view their orcamentos" ON orcamentos FOR SELECT
  USING (public.is_orcamento_member(id));
CREATE POLICY "Admins can create orcamentos" ON orcamentos FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update orcamentos" ON orcamentos FOR UPDATE
  USING (public.is_admin());
CREATE POLICY "Admins can delete orcamentos" ON orcamentos FOR DELETE
  USING (public.is_admin());

-- 9. RLS for orcamento_members
CREATE POLICY "Members can view membership" ON orcamento_members FOR SELECT
  USING (public.is_orcamento_member(orcamento_id));
CREATE POLICY "Admins can manage members" ON orcamento_members FOR ALL
  USING (public.is_admin());

-- 10. Update expenses RLS — replace old policies with orcamento-scoped ones
DROP POLICY IF EXISTS "Approved users can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Approved users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Approved users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Approved users can delete expenses" ON expenses;

CREATE POLICY "Members can view orcamento expenses" ON expenses FOR SELECT
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can create orcamento expenses" ON expenses FOR INSERT
  WITH CHECK (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can update orcamento expenses" ON expenses FOR UPDATE
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can delete orcamento expenses" ON expenses FOR DELETE
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));

-- 11. Update incomes RLS
DROP POLICY IF EXISTS "Approved users can view all incomes" ON incomes;
DROP POLICY IF EXISTS "Approved users can create incomes" ON incomes;
DROP POLICY IF EXISTS "Approved users can update incomes" ON incomes;
DROP POLICY IF EXISTS "Approved users can delete incomes" ON incomes;

CREATE POLICY "Members can view orcamento incomes" ON incomes FOR SELECT
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can create orcamento incomes" ON incomes FOR INSERT
  WITH CHECK (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can update orcamento incomes" ON incomes FOR UPDATE
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can delete orcamento incomes" ON incomes FOR DELETE
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));

-- 12. Update pendencias RLS
DROP POLICY IF EXISTS "Approved users can view all pendencias" ON pendencias;
DROP POLICY IF EXISTS "Approved users can create pendencias" ON pendencias;
DROP POLICY IF EXISTS "Approved users can update pendencias" ON pendencias;
DROP POLICY IF EXISTS "Approved users can delete pendencias" ON pendencias;

CREATE POLICY "Members can view orcamento pendencias" ON pendencias FOR SELECT
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can create orcamento pendencias" ON pendencias FOR INSERT
  WITH CHECK (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can update orcamento pendencias" ON pendencias FOR UPDATE
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));
CREATE POLICY "Members can delete orcamento pendencias" ON pendencias FOR DELETE
  USING (public.is_approved() AND public.is_orcamento_member(orcamento_id));

-- 13. Trigger for updated_at on orcamentos
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 14. Helper function: find user by email (SECURITY DEFINER to access auth.users)
CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT) AS $$
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE lower(au.email) = lower(user_email)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 15. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
