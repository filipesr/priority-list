-- Seed: Movimentações NOVA Metalúrgica (loan já existente)
-- Empréstimo: 175k a 2% a.m., aditivo de 25k em out/24 → base 200k
-- Pagamentos mensais = juros (3.500 antes do aditivo, 4.000 depois)

INSERT INTO loan_payments (loan_id, amount, remaining_balance, payment_date, type, notes) VALUES
  -- Set/2024: juros 2% de 175k = 3.500
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  3500.00, 175000.00, '2024-09-01', 'payment',  NULL),
  -- Out/2024: juros 3.500 + aditivo 25k
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  3500.00, 175000.00, '2024-10-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e', 25000.00, 200000.00, '2024-10-25', 'addition', 'Aditivo 25k'),
  -- Nov/2024 em diante: juros 2% de 200k = 4.000
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2024-11-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2024-12-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-01-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-02-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-03-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-04-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-05-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-06-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-07-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-08-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-09-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-10-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-11-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2025-12-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2026-01-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2026-02-01', 'payment',  NULL),
  ('9225732a-10a9-4d7b-aab8-898dda1b676e',  4000.00, 200000.00, '2026-03-01', 'payment',  NULL);
