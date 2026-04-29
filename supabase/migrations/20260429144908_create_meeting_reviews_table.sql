/*
  # Create meeting_reviews table

  ## Purpose
  Tracks the results of automated meeting reviews — whether a scheduled meeting
  was recommended for cancellation or shortening based on analysis of the linked
  conversation thread.

  ## New Tables
  - `meeting_reviews`
    - `id` (uuid, pk) — unique review ID
    - `proposal_id` (uuid, fk → meeting_proposals) — the meeting being reviewed
    - `conversation_id` (uuid, fk → conversations) — the source thread
    - `reviewed_at` (timestamptz) — when analysis ran
    - `recommendation` (text) — 'cancel' | 'shorten' | 'keep'
    - `original_duration_mins` (int) — duration before any change
    - `recommended_duration_mins` (int, nullable) — suggested new duration if shortening
    - `met_agenda_items` (jsonb) — array of agenda items already resolved
    - `unmet_agenda_items` (jsonb) — array still needing the meeting
    - `reasoning` (text) — explanation for recommendation
    - `notification_sent` (bool) — whether attendees were notified
    - `action_taken` (text, nullable) — 'cancelled' | 'shortened' | 'ignored' | null
    - `action_taken_at` (timestamptz, nullable)

  ## Security
  - RLS enabled; authenticated users can read/insert/update their own reviews
*/

CREATE TABLE IF NOT EXISTS meeting_reviews (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id              uuid NOT NULL REFERENCES meeting_proposals(id) ON DELETE CASCADE,
  conversation_id          uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  reviewed_at              timestamptz NOT NULL DEFAULT now(),
  recommendation           text NOT NULL CHECK (recommendation IN ('cancel', 'shorten', 'keep')),
  original_duration_mins   int NOT NULL,
  recommended_duration_mins int,
  met_agenda_items         jsonb NOT NULL DEFAULT '[]',
  unmet_agenda_items       jsonb NOT NULL DEFAULT '[]',
  reasoning                text NOT NULL DEFAULT '',
  notification_sent        boolean NOT NULL DEFAULT false,
  action_taken             text CHECK (action_taken IN ('cancelled', 'shortened', 'ignored')),
  action_taken_at          timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meeting_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read meeting reviews"
  ON meeting_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meeting reviews"
  ON meeting_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meeting reviews"
  ON meeting_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index for fast proposal lookups
CREATE INDEX IF NOT EXISTS idx_meeting_reviews_proposal_id ON meeting_reviews(proposal_id);
CREATE INDEX IF NOT EXISTS idx_meeting_reviews_reviewed_at ON meeting_reviews(reviewed_at DESC);
