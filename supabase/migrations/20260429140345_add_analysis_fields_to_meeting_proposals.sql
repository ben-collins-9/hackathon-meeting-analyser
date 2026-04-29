/*
  # Add analysis metadata to meeting_proposals

  ## Changes
  - `triggered_signals` (jsonb) — array of signal hit objects from the scoring engine,
    each containing category, label, matched phrases, count, and weight
  - `analysis_score` (numeric) — numeric score produced by the heuristic engine
  - `confidence` (text) — low | medium | high confidence level of the analysis

  These fields allow the UI to surface which signals drove a meeting recommendation,
  making the tool transparent and auditable.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meeting_proposals' AND column_name = 'triggered_signals'
  ) THEN
    ALTER TABLE meeting_proposals ADD COLUMN triggered_signals jsonb NOT NULL DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meeting_proposals' AND column_name = 'analysis_score'
  ) THEN
    ALTER TABLE meeting_proposals ADD COLUMN analysis_score numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meeting_proposals' AND column_name = 'confidence'
  ) THEN
    ALTER TABLE meeting_proposals ADD COLUMN confidence text NOT NULL DEFAULT 'low'
      CHECK (confidence IN ('low', 'medium', 'high'));
  END IF;
END $$;
