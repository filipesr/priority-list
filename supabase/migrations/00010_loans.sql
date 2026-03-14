-- 1. Create loans table
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL DEFAULT 'given',
  counterparty TEXT NOT NULL,
  description TEXT,
  principal NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  interest_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create loan_payments table
CREATE TABLE loan_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  remaining_balance NUMERIC(18,2) NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for loans (per user, not per orcamento)
CREATE POLICY "Users can view own loans" ON loans FOR SELECT
  USING (public.is_approved() AND auth.uid() = user_id);
CREATE POLICY "Users can create own loans" ON loans FOR INSERT
  WITH CHECK (public.is_approved() AND auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON loans FOR UPDATE
  USING (public.is_approved() AND auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON loans FOR DELETE
  USING (public.is_approved() AND auth.uid() = user_id);

-- 5. RLS policies for loan_payments (via JOIN on loans)
CREATE POLICY "Users can view own loan payments" ON loan_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_payments.loan_id AND loans.user_id = auth.uid()) AND public.is_approved());
CREATE POLICY "Users can create own loan payments" ON loan_payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_payments.loan_id AND loans.user_id = auth.uid()) AND public.is_approved());
CREATE POLICY "Users can update own loan payments" ON loan_payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_payments.loan_id AND loans.user_id = auth.uid()) AND public.is_approved());
CREATE POLICY "Users can delete own loan payments" ON loan_payments FOR DELETE
  USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_payments.loan_id AND loans.user_id = auth.uid()) AND public.is_approved());

-- 6. Indexes
CREATE INDEX idx_loans_user_id ON loans (user_id);
CREATE INDEX idx_loans_counterparty ON loans (counterparty);
CREATE INDEX idx_loans_status ON loans (status);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments (loan_id);

-- 7. Trigger: reuse update_updated_at_column()
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
