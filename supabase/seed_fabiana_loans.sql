-- Seed: Empréstimos Fabiana
-- Execute no Supabase SQL Editor (service role) ou substitua <USER_ID> pelo seu user id.

DO $$
DECLARE
  v_user_id uuid;
  v_loan1_id uuid;
  v_loan2_id uuid;
BEGIN
  -- Pega o primeiro usuário aprovado (ajuste se necessário)
  SELECT id INTO v_user_id FROM profiles WHERE approved = true LIMIT 1;

  -- ============================================================
  -- Loan 1: Fabiana — 2% a.m., principal R$ 6.000, início ago/2024
  -- ============================================================
  INSERT INTO loans (id, user_id, direction, counterparty, principal, currency, interest_rate, start_date, status, created_by_name)
  VALUES (
    gen_random_uuid(), v_user_id, 'given', 'Fabiana', 6000, 'BRL', 2, '2024-08-01', 'active', 'Seed'
  ) RETURNING id INTO v_loan1_id;

  INSERT INTO loan_payments (loan_id, amount, remaining_balance, payment_date, type, notes) VALUES
    -- Setembro 2024
    (v_loan1_id,  3060.00,  3060.00, '2024-09-01', 'payment',  'Pago setembro'),
    (v_loan1_id,  2000.00,  5060.00, '2024-09-17', 'addition', NULL),
    (v_loan1_id,  1000.00,  6060.00, '2024-09-21', 'addition', NULL),
    (v_loan1_id,  1000.00,  7060.00, '2024-09-25', 'addition', NULL),
    -- Outubro 2024
    (v_loan1_id,  3000.00,  4201.20, '2024-10-01', 'payment',  'Pago outubro'),
    (v_loan1_id,  1498.80,  5700.00, '2024-10-08', 'addition', NULL),
    (v_loan1_id,  1300.00,  7000.00, '2024-10-10', 'addition', NULL),
    (v_loan1_id,  1000.00,  8000.00, '2024-10-17', 'addition', NULL),
    (v_loan1_id,  2000.00, 10000.00, '2024-10-21', 'addition', NULL),
    (v_loan1_id,  2000.00, 12000.00, '2024-10-25', 'addition', NULL),
    -- Novembro 2024
    (v_loan1_id,  1760.00, 14000.00, '2024-11-09', 'addition', NULL),
    (v_loan1_id,  5223.38, 19223.38, '2024-11-11', 'addition', NULL),
    (v_loan1_id,  1000.00, 20223.38, '2024-11-26', 'addition', NULL),
    -- Dezembro 2024
    (v_loan1_id,  4000.00, 24627.85, '2024-12-13', 'addition', NULL),
    -- Janeiro 2025
    (v_loan1_id,  3000.00, 28120.40, '2025-01-11', 'addition', NULL),
    -- Fevereiro 2025
    (v_loan1_id,  1300.00, 29982.81, '2025-02-13', 'addition', NULL),
    (v_loan1_id,  5000.00, 34982.81, '2025-02-19', 'addition', NULL),
    -- Março 2025
    (v_loan1_id,  1000.00, 36682.47, '2025-03-11', 'addition', NULL),
    (v_loan1_id,  2500.00, 39182.47, '2025-03-20', 'addition', NULL),
    (v_loan1_id,  2500.00, 36682.47, '2025-03-25', 'payment',  'Pago março'),
    -- Maio 2025
    (v_loan1_id,  1000.00, 39164.44, '2025-05-26', 'addition', NULL),
    -- Junho 2025
    (v_loan1_id,  1000.00, 38947.73, '2025-06-01', 'payment',  'Pago junho'),
    -- Agosto 2025
    (v_loan1_id, 10000.00, 50521.22, '2025-08-13', 'addition', NULL);

  -- ============================================================
  -- Loan 2: Fabi — 5% a.m., principal R$ 2.000, início ago/2025
  -- ============================================================
  INSERT INTO loans (id, user_id, direction, counterparty, principal, currency, interest_rate, start_date, status, created_by_name)
  VALUES (
    gen_random_uuid(), v_user_id, 'given', 'Fabi', 2000, 'BRL', 5, '2025-08-01', 'active', 'Seed'
  ) RETURNING id INTO v_loan2_id;

  -- Nenhuma movimentação (todos os meses com pago = 0)

  RAISE NOTICE 'Loans criados: Fabiana (%) = %, Fabi (%) = %', v_loan1_id, v_loan2_id;
END $$;
