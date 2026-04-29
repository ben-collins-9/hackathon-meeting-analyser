import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ---------------------------------------------------------------------------
// Signal definitions
// ---------------------------------------------------------------------------

interface SignalCategory {
  id: string;
  label: string;
  agendaItem: string;
  weight: number;
  phrases: string[];
}

interface SignalHit {
  category: string;
  label: string;
  matches: string[];
  count: number;
  weight: number;
}

interface AnalysisMessage {
  author: string;
  content: string;
  sent_at: string;
}

interface AnalysisResult {
  needs_meeting: boolean;
  score: number;
  urgency: "low" | "medium" | "high";
  title: string;
  summary: string;
  agenda_items: string[];
  participants: string[];
  suggested_duration_mins: number;
  triggered_signals: SignalHit[];
  async_ok_signals: SignalHit[];
  confidence: "low" | "medium" | "high";
}

const BLOCKER_SIGNALS: SignalCategory = {
  id: "blocker",
  label: "Blockers",
  agendaItem: "Unblock current work and identify root cause",
  weight: 3,
  phrases: [
    "blocked", "blocking", "can't proceed", "cannot proceed", "stuck",
    "waiting on", "no movement", "can't continue", "cannot continue",
    "held up", "stalled", "at a standstill", "holding us back",
    "unable to move", "cant move forward",
  ],
};

const CONFLICT_SIGNALS: SignalCategory = {
  id: "conflict",
  label: "Misalignment",
  agendaItem: "Resolve conflicting viewpoints and reach alignment",
  weight: 3,
  phrases: [
    "disagree", "disagreement", "not aligned", "misaligned", "conflicting",
    "going in circles", "back and forth", "that's not what i meant",
    "that is not what i meant", "not what i said", "you misunderstood",
    "i misunderstood", "contradiction", "contradicts", "opposite of",
    "different understanding", "not on the same page",
  ],
};

const DECISION_SIGNALS: SignalCategory = {
  id: "decision",
  label: "Decision pressure",
  agendaItem: "Make pending decisions and assign owners",
  weight: 2,
  phrases: [
    "need to decide", "needs to decide", "who decides", "final answer",
    "pick one", "can't wait", "cannot wait", "make a call", "decision needed",
    "decide by", "choose between", "we need a decision", "no decision",
    "undecided", "need approval", "awaiting approval", "sign off",
  ],
};

const CONFUSION_SIGNALS: SignalCategory = {
  id: "confusion",
  label: "Confusion",
  agendaItem: "Clarify open questions and align on definitions",
  weight: 2,
  phrases: [
    "confused", "confusing", "unclear", "not clear", "don't understand",
    "do not understand", "what do you mean", "lost", "makes no sense",
    "doesn't make sense", "does not make sense", "what does that mean",
    "can you explain", "i'm lost", "im lost", "not sure what",
    "need clarification", "clarify", "hard to follow",
  ],
};

const URGENCY_SIGNALS: SignalCategory = {
  id: "urgency",
  label: "Urgency",
  agendaItem: "Address time-sensitive items and set immediate next steps",
  weight: 2,
  phrases: [
    "urgent", "urgently", "asap", "as soon as possible", "deadline",
    "critical", "blocking release", "end of day", "eod", "by today",
    "tonight", "this morning", "running out of time", "overdue",
    "time sensitive", "time-sensitive", "need this now", "immediately",
    "right away", "no time", "ship today", "launch today",
  ],
};

const FRUSTRATION_SIGNALS: SignalCategory = {
  id: "frustration",
  label: "Frustration",
  agendaItem: "Address team friction and restore shared understanding",
  weight: 2,
  phrases: [
    "frustrated", "frustrating", "annoyed", "fed up", "this is ridiculous",
    "makes no sense", "waste of time", "been over this", "said this before",
    "already mentioned", "keep repeating", "not listening", "ignored",
  ],
};

const ASYNC_OK_SIGNALS: SignalCategory = {
  id: "async_ok",
  label: "Async progress",
  agendaItem: "",
  weight: -2,
  phrases: [
    "lgtm", "looks good", "approved", "will do", "on it", "done",
    "completed", "merged", "shipped", "makes sense", "agreed", "sounds good",
    "got it", "understood", "thanks", "perfect", "great", "excellent",
    "moving on", "fixed", "resolved", "closing", "closing this",
  ],
};

const MEETING_SIGNAL_CATEGORIES = [
  BLOCKER_SIGNALS,
  CONFLICT_SIGNALS,
  DECISION_SIGNALS,
  CONFUSION_SIGNALS,
  URGENCY_SIGNALS,
  FRUSTRATION_SIGNALS,
];

// ---------------------------------------------------------------------------
// Analysis engine
// ---------------------------------------------------------------------------

function scanCategory(text: string, category: SignalCategory): SignalHit | null {
  const matches = category.phrases.filter((phrase) => text.includes(phrase.toLowerCase()));
  if (matches.length === 0) return null;
  return { category: category.id, label: category.label, matches, count: matches.length, weight: category.weight };
}

function getBackAndForthDensity(messages: AnalysisMessage[]): number {
  if (messages.length < 4) return 0;
  let alternations = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].author !== messages[i - 1].author) alternations++;
  }
  const density = alternations / (messages.length - 1);
  const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
  if (density > 0.6 && avgLength < 200 && messages.length >= 6) return 2;
  return 0;
}

function getConversationSpanBonus(messages: AnalysisMessage[]): number {
  if (messages.length < 2) return 0;
  const first = new Date(messages[0].sent_at).getTime();
  const last = new Date(messages[messages.length - 1].sent_at).getTime();
  const hours = (last - first) / (1000 * 60 * 60);
  if (hours > 48) return 2;
  if (hours > 24) return 1;
  return 0;
}

function getVolumeBonus(messages: AnalysisMessage[]): number {
  if (messages.length >= 15) return 3;
  if (messages.length >= 10) return 2;
  if (messages.length >= 6) return 1;
  return 0;
}

function analyzeConversation(
  title: string,
  platform: string,
  declaredParticipants: string[],
  messages: AnalysisMessage[]
): AnalysisResult {
  const allText = messages.map((m) => m.content).join(" ").toLowerCase();

  const triggeredSignals: SignalHit[] = MEETING_SIGNAL_CATEGORIES
    .map((cat) => scanCategory(allText, cat))
    .filter((hit): hit is SignalHit => hit !== null);

  const asyncHit = scanCategory(allText, ASYNC_OK_SIGNALS);
  const asyncOkSignals: SignalHit[] = asyncHit ? [asyncHit] : [];

  let score = triggeredSignals.reduce((sum, s) => sum + s.weight * Math.min(s.count, 3), 0);
  score += getBackAndForthDensity(messages);
  score += getConversationSpanBonus(messages);
  score += getVolumeBonus(messages);

  if (asyncHit) {
    score -= Math.min(asyncHit.count * 1.5, 4);
  }
  score = Math.max(0, score);

  const needsMeeting = score >= 4;

  const hasUrgencySignal = triggeredSignals.some((s) => s.category === "urgency");
  const hasConflictOrBlocker = triggeredSignals.some((s) => s.category === "conflict" || s.category === "blocker");
  let urgency: "low" | "medium" | "high" = "low";
  if (score >= 8 || (hasUrgencySignal && hasConflictOrBlocker)) urgency = "high";
  else if (score >= 5 || hasUrgencySignal || hasConflictOrBlocker) urgency = "medium";

  let confidence: "low" | "medium" | "high" = "low";
  if (triggeredSignals.length >= 3 || score >= 8) confidence = "high";
  else if (triggeredSignals.length >= 2 || score >= 5) confidence = "medium";

  const speakingAuthors = [...new Set(messages.map((m) => m.author).filter(Boolean))];
  const participants = speakingAuthors.length > 0 ? speakingAuthors : declaredParticipants;

  let suggested_duration_mins = 15;
  if (score >= 8 || participants.length >= 4) suggested_duration_mins = 45;
  else if (score >= 6 || participants.length >= 3) suggested_duration_mins = 30;

  const primarySignal = [...triggeredSignals].sort((a, b) => b.weight * b.count - a.weight * a.count)[0];
  const meetingTitle = primarySignal
    ? `Sync: ${title} (${primarySignal.label.toLowerCase()} detected)`
    : `Sync: ${title}`;

  const signalLabels = triggeredSignals.map((s) => s.label.toLowerCase());
  let summary = "";
  if (needsMeeting) {
    const signalDesc = signalLabels.length > 1
      ? `${signalLabels.slice(0, -1).join(", ")} and ${signalLabels[signalLabels.length - 1]}`
      : signalLabels[0] ?? "unresolved tension";
    summary = `This ${messages.length}-message thread on ${platform} shows ${signalDesc} across ${participants.length} participant${participants.length !== 1 ? "s" : ""}. A ${suggested_duration_mins}-minute sync would help resolve this efficiently.`;
  } else if (asyncHit) {
    summary = `Conversation is progressing well async — ${asyncHit.count} positive signal${asyncHit.count !== 1 ? "s" : ""} detected (${asyncHit.matches.slice(0, 3).join(", ")}). No meeting needed.`;
  } else {
    summary = `No strong meeting signals detected in this ${messages.length}-message thread. Continue async.`;
  }

  const agenda_items = [...triggeredSignals]
    .sort((a, b) => b.weight * b.count - a.weight * a.count)
    .map((s) => s.agendaItem)
    .filter(Boolean);

  if (agenda_items.length === 0 && needsMeeting) {
    agenda_items.push("Review open questions", "Define next steps and owners");
  }

  return {
    needs_meeting: needsMeeting,
    score: Math.round(score * 10) / 10,
    urgency,
    title: meetingTitle,
    summary,
    agenda_items,
    participants,
    suggested_duration_mins,
    triggered_signals: triggeredSignals,
    async_ok_signals: asyncOkSignals,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

interface AnalyzeRequest {
  conversation_id: string;
  title: string;
  platform: string;
  participants: string[];
  messages: AnalysisMessage[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: AnalyzeRequest = await req.json();

    if (!body.conversation_id || !body.messages || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: "conversation_id and messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = analyzeConversation(body.title, body.platform, body.participants, body.messages);

    if (result.needs_meeting) {
      // Find any existing proposal for this conversation (one per thread rule)
      const { data: existing } = await supabase
        .from("meeting_proposals")
        .select("id, status")
        .eq("conversation_id", body.conversation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If already scheduled, return it as-is without overwriting
      if (existing?.status === "scheduled") {
        const { data: scheduled } = await supabase
          .from("meeting_proposals")
          .select("*")
          .eq("id", existing.id)
          .single();
        return new Response(
          JSON.stringify({ needs_meeting: true, proposal: scheduled, analysis: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = {
        conversation_id: body.conversation_id,
        title: result.title,
        summary: result.summary,
        urgency: result.urgency,
        suggested_duration_mins: result.suggested_duration_mins,
        agenda_items: result.agenda_items,
        participants: result.participants,
        status: "pending",
        triggered_signals: result.triggered_signals,
        analysis_score: result.score,
        confidence: result.confidence,
      };

      let proposal;
      if (existing) {
        const { data, error } = await supabase
          .from("meeting_proposals")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        proposal = data;
      } else {
        const { data, error } = await supabase
          .from("meeting_proposals")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        proposal = data;
      }

      return new Response(
        JSON.stringify({ needs_meeting: true, proposal, analysis: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ needs_meeting: false, summary: result.summary, analysis: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
