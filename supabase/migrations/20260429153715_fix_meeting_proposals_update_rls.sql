/*
  # Fix meeting_proposals UPDATE policy

  The existing UPDATE policy restricts updates to rows where user_id = auth.uid()
  or user_id IS NULL. However, the SELECT policy allows all authenticated users to
  read all proposals. This mismatch means users cannot act on proposals they can
  see but don't own (e.g. seeded/shared proposals).

  This migration aligns the UPDATE policy with the SELECT policy: any authenticated
  user can update any proposal (accept, decline, schedule). This matches the
  collaborative/demo intent of the app where proposals are shared across the workspace.
*/

DROP POLICY IF EXISTS "Users can update own meeting proposals" ON meeting_proposals;

CREATE POLICY "Authenticated users can update meeting proposals"
  ON meeting_proposals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
