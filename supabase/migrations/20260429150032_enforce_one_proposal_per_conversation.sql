/*
  # Enforce one proposal per conversation

  ## Problem
  Multiple proposals were created for the same conversation, flooding the calendar.

  ## Changes
  - Deletes all but the single best proposal per conversation (preferring
    scheduled > accepted > pending > declined, then newest).
  - Adds a UNIQUE constraint on conversation_id so this cannot happen again.
*/

-- Delete duplicates: keep the single best row per conversation
DELETE FROM meeting_proposals
WHERE id NOT IN (
  SELECT DISTINCT ON (conversation_id) id
  FROM meeting_proposals
  ORDER BY
    conversation_id,
    CASE status
      WHEN 'scheduled' THEN 1
      WHEN 'accepted'  THEN 2
      WHEN 'pending'   THEN 3
      WHEN 'declined'  THEN 4
    END,
    updated_at DESC
);

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'meeting_proposals_conversation_id_key'
  ) THEN
    ALTER TABLE meeting_proposals
      ADD CONSTRAINT meeting_proposals_conversation_id_key UNIQUE (conversation_id);
  END IF;
END $$;
