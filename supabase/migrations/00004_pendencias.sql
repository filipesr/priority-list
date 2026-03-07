-- 1. Create pendencias table
CREATE TABLE pendencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  estimated_amount NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'BRL',
  category TEXT NOT NULL DEFAULT 'outro',
  cost_center TEXT NOT NULL DEFAULT 'outros',
  urgency TEXT NOT NULL DEFAULT 'can_wait',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies (same pattern as expenses: approved users full CRUD)
CREATE POLICY "Approved users can view all pendencias" ON pendencias FOR SELECT
  USING (public.is_approved());
CREATE POLICY "Approved users can create pendencias" ON pendencias FOR INSERT
  WITH CHECK (public.is_approved());
CREATE POLICY "Approved users can update pendencias" ON pendencias FOR UPDATE
  USING (public.is_approved());
CREATE POLICY "Approved users can delete pendencias" ON pendencias FOR DELETE
  USING (public.is_approved());

-- 4. Indexes
CREATE INDEX idx_pendencias_user_id ON pendencias (user_id);
CREATE INDEX idx_pendencias_status ON pendencias (status);
CREATE INDEX idx_pendencias_priority ON pendencias (priority);

-- 5. Trigger: reuse update_updated_at_column()
CREATE TRIGGER update_pendencias_updated_at
  BEFORE UPDATE ON pendencias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
