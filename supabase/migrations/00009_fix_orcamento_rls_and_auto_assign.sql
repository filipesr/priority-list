-- ============================================================
-- Migration 00009: Fix orcamento RLS + auto-assign on approval
-- ============================================================

-- 1. Allow admins to SELECT all orcamentos (fixes INSERT...RETURNING failure)
CREATE POLICY "Admins can view all orcamentos" ON orcamentos FOR SELECT
  USING (public.is_admin());

-- 2. Allow admins to SELECT all orcamento_members (consistency)
CREATE POLICY "Admins can view all members" ON orcamento_members FOR SELECT
  USING (public.is_admin());

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
