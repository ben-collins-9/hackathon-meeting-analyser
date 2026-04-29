/*
  # Meeting Detector Schema

  ## Overview
  Creates the core tables for the no-meeting company communication analyzer.
  The system ingests conversation threads, analyzes them for meeting signals,
  and auto-creates structured meeting proposals when a synchronous discussion
  is warranted.

  ## New Tables

  ### conversations
  Represents a communication thread (e.g., a Slack channel, email thread, or ticket).
  - id: UUID primary key
  - title: Short label for the conversation
  - platform: Source platform (slack, email, github, jira, etc.)
  - participants: JSON array of participant names/emails
  - created_at / updated_at: Timestamps

  ### messages
  Individual messages within a conversation thread.
  - id: UUID primary key
  - conversation_id: FK to conversations
  - author: Message author identifier
  - content: Message body text
  - sent_at: When the message was sent
  - created_at: When the record was inserted

  ### meeting_proposals
  AI-generated meeting proposals derived from conversation analysis.
  - id: UUID primary key
  - conversation_id: FK to conversations
  - title: Proposed meeting title
  - summary: Why a meeting is recommended
  - urgency: low | medium | high
  - suggested_duration_mins: Recommended meeting length
  - agenda_items: JSON array of agenda points
  - participants: JSON array of who should attend
  - status: pending | accepted | declined | scheduled
  - scheduled_at: When the meeting is booked (if accepted)
  - created_at / updated_at: Timestamps

  ## Security
  - RLS enabled on all tables
  - Public read/write policies (single-tenant internal tool — no auth layer required)
    scoped so only the anon key bearer can access data
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'slack',
  participants jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  suggested_duration_mins integer NOT NULL DEFAULT 30,
  agenda_items jsonb NOT NULL DEFAULT '[]',
  participants jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'scheduled')),
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_meeting_proposals_conversation_id ON meeting_proposals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_meeting_proposals_status ON meeting_proposals(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS meeting_proposals_updated_at ON meeting_proposals;
CREATE TRIGGER meeting_proposals_updated_at
  BEFORE UPDATE ON meeting_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_proposals ENABLE ROW LEVEL SECURITY;

-- Policies: allow anon role full access (internal tool)
CREATE POLICY "anon can select conversations"
  ON conversations FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert conversations"
  ON conversations FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update conversations"
  ON conversations FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete conversations"
  ON conversations FOR DELETE TO anon USING (true);

CREATE POLICY "anon can select messages"
  ON messages FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert messages"
  ON messages FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can delete messages"
  ON messages FOR DELETE TO anon USING (true);

CREATE POLICY "anon can select meeting_proposals"
  ON meeting_proposals FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert meeting_proposals"
  ON meeting_proposals FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update meeting_proposals"
  ON meeting_proposals FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete meeting_proposals"
  ON meeting_proposals FOR DELETE TO anon USING (true);
