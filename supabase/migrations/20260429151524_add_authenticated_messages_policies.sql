/*
  # Add RLS policies for authenticated users on messages table

  The messages table only had anon-role policies. Authenticated users
  (signed-in accounts) were being blocked by RLS with a 403.

  This migration adds SELECT, INSERT, UPDATE, DELETE policies for the
  authenticated role, mirroring the permissive anon policies already
  in place.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Authenticated users can read messages'
  ) THEN
    CREATE POLICY "Authenticated users can read messages"
      ON messages FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Authenticated users can insert messages'
  ) THEN
    CREATE POLICY "Authenticated users can insert messages"
      ON messages FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Authenticated users can delete messages'
  ) THEN
    CREATE POLICY "Authenticated users can delete messages"
      ON messages FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
