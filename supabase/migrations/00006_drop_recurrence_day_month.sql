-- Remove redundant recurrence_day and recurrence_month columns.
-- due_date already contains the complete date information.
ALTER TABLE expenses DROP COLUMN IF EXISTS recurrence_day;
ALTER TABLE expenses DROP COLUMN IF EXISTS recurrence_month;
