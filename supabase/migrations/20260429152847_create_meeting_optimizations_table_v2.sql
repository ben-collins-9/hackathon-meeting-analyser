/*
  # Create meeting_optimizations table

  Stores the result of the business criticality analysis for each calendar event
  the user has reviewed, and which alternative (if any) they chose.

  ## New Tables
  - `meeting_optimizations`
    - `id` (uuid, PK)
    - `user_id` (uuid, FK → auth.users)
    - `event_id` (text) — calendar event id (e.g. "evt-001" or "proposal-<uuid>")
    - `event_title` (text)
    - `criticality_score` (int, 1-5)
    - `criticality_level` (text: low | medium | high)
    - `score_breakdown` (jsonb) — per-factor scores
    - `chosen_alternative` (text, nullable) — which alternative the user selected
    - `proceeded_with_meeting` (boolean) — user clicked "Proceed with Meeting"
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Authenticated users can only read/write their own rows
*/

CREATE TABLE IF NOT EXISTS meeting_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_title text NOT NULL DEFAULT '',
  criticality_score int NOT NULL DEFAULT 1,
  criticality_level text NOT NULL DEFAULT 'low',
  score_breakdown jsonb NOT NULL DEFAULT '{}',
  chosen_alternative text,
  proceeded_with_meeting boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meeting_optimizations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meeting_optimizations' AND policyname = 'Users can read own optimizations'
  ) THEN
    CREATE POLICY "Users can read own optimizations"
      ON meeting_optimizations FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meeting_optimizations' AND policyname = 'Users can insert own optimizations'
  ) THEN
    CREATE POLICY "Users can insert own optimizations"
      ON meeting_optimizations FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meeting_optimizations' AND policyname = 'Users can update own optimizations'
  ) THEN
    CREATE POLICY "Users can update own optimizations"
      ON meeting_optimizations FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS meeting_optimizations_user_id_idx ON meeting_optimizations(user_id);
CREATE INDEX IF NOT EXISTS meeting_optimizations_event_id_idx ON meeting_optimizations(event_id);
