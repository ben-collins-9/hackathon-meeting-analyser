import { supabase } from './supabase';
import type { Conversation, Message, MeetingProposal } from './database.types';
import { analyzeConversation as analyzeLocally } from './analyzer';

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createConversation(
  title: string,
  platform: string,
  participants: string[]
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title, platform, participants })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMessage(
  conversationId: string,
  author: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, author, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMeetingProposals(): Promise<MeetingProposal[]> {
  const { data, error } = await supabase
    .from('meeting_proposals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateProposalStatus(
  id: string,
  status: MeetingProposal['status'],
  scheduledAt?: string
): Promise<MeetingProposal> {
  const { data, error } = await supabase
    .from('meeting_proposals')
    .update({ status, scheduled_at: scheduledAt ?? null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export interface AnalyzeResponse {
  needs_meeting: boolean;
  summary?: string;
  proposal?: MeetingProposal;
  analysis?: ReturnType<typeof analyzeLocally>;
  source: 'edge' | 'local';
}

export async function analyzeConversation(conversation: Conversation, messages: Message[]): Promise<AnalyzeResponse> {
  const payload = {
    conversation_id: conversation.id,
    title: conversation.title,
    platform: conversation.platform,
    participants: conversation.participants as string[],
    messages: messages.map((m) => ({ author: m.author, content: m.content, sent_at: m.sent_at })),
  };

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-conversation`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Edge function error');
    const data = await response.json();
    return { ...data, source: 'edge' };
  } catch {
    // Client-side fallback — no network call needed
    const analysis = analyzeLocally(
      conversation.title,
      conversation.platform,
      conversation.participants as string[],
      messages.map((m) => ({ author: m.author, content: m.content, sent_at: m.sent_at }))
    );
    return { needs_meeting: analysis.needs_meeting, summary: analysis.summary, analysis, source: 'local' };
  }
}

export async function saveLocalProposal(conversationId: string, analysis: ReturnType<typeof analyzeLocally>): Promise<MeetingProposal> {
  const { data, error } = await supabase
    .from('meeting_proposals')
    .insert({
      conversation_id: conversationId,
      title: analysis.title,
      summary: analysis.summary,
      urgency: analysis.urgency,
      suggested_duration_mins: analysis.suggested_duration_mins,
      agenda_items: analysis.agenda_items,
      participants: analysis.participants,
      status: 'pending',
      triggered_signals: analysis.triggered_signals,
      analysis_score: analysis.score,
      confidence: analysis.confidence,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', id);
  if (error) throw error;
}
