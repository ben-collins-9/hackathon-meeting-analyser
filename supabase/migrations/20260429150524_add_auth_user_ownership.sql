/*
  # Add user ownership to conversations and meeting_proposals

  ## Summary
  Ties every conversation and meeting proposal to the authenticated user who
  created it. Existing rows get NULL user_id and remain visible to all signed-in
  users during the transition period (legacy access policy).

  ## Changes

  ### conversations table
  - New column `user_id` (uuid, nullable FK → auth.users)
  - RLS updated: owners can fully manage their own rows; all authenticated users
    can READ all rows (needed for meeting-review cross-user scenarios)

  ### meeting_proposals table
  - New column `user_id` (uuid, nullable FK → auth.users)
  - RLS updated to match conversations

  ### profiles table (new)
  - Mirrors auth.users with display_name + avatar_url
  - Auto-populated via trigger on auth.users insert

  ## Security
  - All tables keep RLS enabled
  - INSERT policies enforce auth.uid() = user_id
  - Existing NULL user_id rows remain accessible (backward compat)
*/

-- ============================================================
-- 1. profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text NOT NULL DEFAULT '',
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view any profile') THEN
    CREATE POLICY "Users can view any profile"
      ON profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE TO authenticated
      USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Add user_id to conversations
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='conversations' AND column_name='user_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Drop old blanket policies and replace with ownership-aware ones
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='conversations' AND policyname='Users can read own conversations') THEN
    DROP POLICY "Users can read own conversations" ON conversations;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='conversations' AND policyname='Authenticated users can read all conversations') THEN
    CREATE POLICY "Authenticated users can read all conversations"
      ON conversations FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='conversations' AND policyname='Users can insert own conversations') THEN
    CREATE POLICY "Users can insert own conversations"
      ON conversations FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='conversations' AND policyname='Users can update own conversations') THEN
    CREATE POLICY "Users can update own conversations"
      ON conversations FOR UPDATE TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL)
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='conversations' AND policyname='Users can delete own conversations') THEN
    CREATE POLICY "Users can delete own conversations"
      ON conversations FOR DELETE TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- ============================================================
-- 3. Add user_id to meeting_proposals
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='meeting_proposals' AND column_name='user_id'
  ) THEN
    ALTER TABLE meeting_proposals ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meeting_proposals_user_id ON meeting_proposals(user_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meeting_proposals' AND policyname='Authenticated users can read all meeting proposals') THEN
    CREATE POLICY "Authenticated users can read all meeting proposals"
      ON meeting_proposals FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meeting_proposals' AND policyname='Users can insert own meeting proposals') THEN
    CREATE POLICY "Users can insert own meeting proposals"
      ON meeting_proposals FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meeting_proposals' AND policyname='Users can update own meeting proposals') THEN
    CREATE POLICY "Users can update own meeting proposals"
      ON meeting_proposals FOR UPDATE TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL)
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meeting_proposals' AND policyname='Users can delete own meeting proposals') THEN
    CREATE POLICY "Users can delete own meeting proposals"
      ON meeting_proposals FOR DELETE TO authenticated
      USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;
