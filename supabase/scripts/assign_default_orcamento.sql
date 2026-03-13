-- Create individual orcamento for each approved user who has none
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  r RECORD;
  new_orc_id UUID;
  affected INT := 0;
BEGIN
  FOR r IN
    SELECT p.id, p.full_name
    FROM profiles p
    WHERE p.approved = true
      AND NOT EXISTS (
        SELECT 1 FROM orcamento_members om WHERE om.user_id = p.id
      )
  LOOP
    -- Create personal orcamento
    INSERT INTO orcamentos (name, created_by)
    VALUES (
      'Orçamento de ' || COALESCE(NULLIF(r.full_name, ''), 'Usuário'),
      r.id
    )
    RETURNING id INTO new_orc_id;

    -- Add user as owner
    INSERT INTO orcamento_members (orcamento_id, user_id, role)
    VALUES (new_orc_id, r.id, 'owner'::orcamento_role);

    -- Set as selected
    UPDATE profiles
    SET selected_orcamento_id = new_orc_id
    WHERE id = r.id;

    affected := affected + 1;
  END LOOP;

  RAISE NOTICE '% orçamento(s) individual(is) criado(s)', affected;
END $$;
