ALTER TABLE loan_payments ADD COLUMN type TEXT NOT NULL DEFAULT 'payment';
-- type: 'payment' (reduz saldo) | 'addition' (aditivo, aumenta saldo)
NOTIFY pgrst, 'reload schema';
