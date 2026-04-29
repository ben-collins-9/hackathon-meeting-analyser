import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  author: string;
  content: string;
  sent_at: string;
}

interface AgendaReview {
  item: string;
  met: boolean;
  evidence: string; // excerpt from conversation that resolves it
}

interface ReviewResult {
  recommendation: "cancel" | "shorten" | "keep";
  metAgendaItems: string[];
  unmetAgendaItems: string[];
  metEvidence: Record<string, string>; // agenda item → conversation excerpt
  recommendedDurationMins: number | null;
  reasoning: string;
}

// ---------------------------------------------------------------------------
// Keyword resolution detection
// ---------------------------------------------------------------------------

// Phrases that suggest an agenda item was addressed in text
const RESOLUTION_SIGNALS = [
  "decided", "decision", "agreed", "confirmed", "resolved", "sorted",
  "fixed", "done", "completed", "closed", "approved", "shipped",
  "aligned", "consensus", "settled", "finalized", "approved",
  "already handled", "taken care of", "no longer needed", "not needed",
  "already covered", "covered this", "figured out", "worked out",
  "made a call", "going with", "we'll go with", "let's go with",
  "happy to proceed", "good to proceed", "can move forward",
  "no blocker", "unblocked", "moved on", "wrapped up", "put to rest",
];

// Phrases that indicate an item still needs discussion
const OPEN_SIGNALS = [
  "still need", "need to discuss", "need to decide", "not sure",
  "unclear", "unresolved", "open question", "pending", "tbd", "to be decided",
  "blocked on", "waiting on", "depends on", "need alignment",
  "haven't decided", "no decision", "need to agree", "need to talk",
  "need to meet", "let's meet", "schedule a call", "hop on a call",
  "get everyone together", "sync up", "need a sync",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
}

function extractKeywords(agendaItem: string): string[] {
  const stop = new Set(["the", "a", "an", "to", "for", "and", "or", "of", "in",
    "on", "with", "is", "are", "be", "at", "this", "that", "how", "what",
    "when", "where", "why", "we", "our", "us", "can", "will", "do"]);
  return normalize(agendaItem)
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
}

function scoreAgendaItemResolution(
  agendaItem: string,
  messages: Message[]
): { met: boolean; evidence: string; confidence: number } {
  const keywords = extractKeywords(agendaItem);
  if (keywords.length === 0) return { met: false, evidence: "", confidence: 0 };

  let bestEvidence = "";
  let resolutionScore = 0;
  let openScore = 0;

  for (const msg of messages) {
    const norm = normalize(msg.content);

    // Check keyword overlap with this agenda item
    const keywordMatches = keywords.filter((kw) => norm.includes(kw)).length;
    const relevance = keywordMatches / keywords.length;
    if (relevance < 0.3) continue; // message not relevant to this agenda item

    // Check resolution signals
    const resSignals = RESOLUTION_SIGNALS.filter((s) => norm.includes(s));
    const openSignalHits = OPEN_SIGNALS.filter((s) => norm.includes(s));

    if (resSignals.length > 0) {
      resolutionScore += resSignals.length * relevance;
      if (!bestEvidence) {
        const excerpt = msg.content.length > 120
          ? msg.content.slice(0, 120) + "…"
          : msg.content;
        bestEvidence = `${msg.author}: "${excerpt}"`;
      }
    }
    if (openSignalHits.length > 0) {
      openScore += openSignalHits.length * relevance;
    }
  }

  const confidence = resolutionScore / (resolutionScore + openScore + 0.1);
  const met = resolutionScore > openScore && resolutionScore >= 0.5;

  return { met, evidence: bestEvidence, confidence };
}

// ---------------------------------------------------------------------------
// Core review logic
// ---------------------------------------------------------------------------

function reviewMeetingAgenda(
  agendaItems: string[],
  suggestedDurationMins: number,
  messages: Message[]
): ReviewResult {
  if (agendaItems.length === 0 || messages.length === 0) {
    return {
      recommendation: "keep",
      metAgendaItems: [],
      unmetAgendaItems: agendaItems,
      metEvidence: {},
      recommendedDurationMins: null,
      reasoning: "No agenda items or no conversation messages to analyse.",
    };
  }

  const reviews: (AgendaReview & { evidence: string })[] = agendaItems.map((item) => {
    const { met, evidence } = scoreAgendaItemResolution(item, messages);
    return { item, met, evidence };
  });

  const met = reviews.filter((r) => r.met);
  const unmet = reviews.filter((r) => !r.met);
  const metFraction = met.length / agendaItems.length;

  const metEvidence: Record<string, string> = {};
  for (const r of met) {
    if (r.evidence) metEvidence[r.item] = r.evidence;
  }

  let recommendation: "cancel" | "shorten" | "keep";
  let recommendedDurationMins: number | null = null;
  let reasoning: string;

  if (metFraction >= 0.85) {
    // Nearly all agenda items resolved — cancel
    recommendation = "cancel";
    reasoning =
      `All ${met.length} of ${agendaItems.length} agenda item${agendaItems.length !== 1 ? "s have" : " has"} ` +
      `already been addressed in the conversation thread. The meeting is no longer needed.`;
  } else if (metFraction >= 0.4) {
    // Significant portion resolved — shorten
    recommendation = "shorten";
    const remainingFraction = unmet.length / agendaItems.length;
    const rawMins = Math.round(suggestedDurationMins * remainingFraction);
    // Round to nearest 15m, min 15m
    recommendedDurationMins = Math.max(15, Math.round(rawMins / 15) * 15);
    reasoning =
      `${met.length} of ${agendaItems.length} agenda item${agendaItems.length !== 1 ? "s have" : " has"} ` +
      `been resolved asynchronously. The remaining ${unmet.length} item${unmet.length !== 1 ? "s" : ""} ` +
      `can likely be covered in ${recommendedDurationMins} minutes instead of ${suggestedDurationMins}.`;
  } else {
    recommendation = "keep";
    reasoning =
      `${unmet.length} of ${agendaItems.length} agenda item${agendaItems.length !== 1 ? "s remain" : " remains"} ` +
      `unresolved in the conversation thread. The meeting should proceed as planned.`;
  }

  return {
    recommendation,
    metAgendaItems: met.map((r) => r.item),
    unmetAgendaItems: unmet.map((r) => r.item),
    metEvidence,
    recommendedDurationMins,
    reasoning,
  };
}

// ---------------------------------------------------------------------------
// Notification message builder
// ---------------------------------------------------------------------------

function buildNotificationMessage(
  proposalTitle: string,
  review: ReviewResult,
  participants: string[]
): string {
  const greeting = participants.length > 0
    ? `Hi ${participants.slice(0, 3).join(", ")}${participants.length > 3 ? " and others" : ""},`
    : "Hi team,";

  if (review.recommendation === "cancel") {
    const evidenceSummary = Object.entries(review.metEvidence)
      .slice(0, 3)
      .map(([item, ev]) => `• "${item}" — ${ev}`)
      .join("\n");

    return [
      greeting,
      "",
      `Good news — the meeting "${proposalTitle}" has been automatically cancelled.`,
      "",
      "All agenda items have already been addressed in the conversation thread:",
      ...review.metAgendaItems.map((item) => `• ${item}`),
      "",
      evidenceSummary ? "Key conversation excerpts that resolved these items:\n" + evidenceSummary : "",
      "",
      "No meeting is needed. If something comes up that still requires a discussion, feel free to reschedule.",
    ].filter(Boolean).join("\n");
  }

  if (review.recommendation === "shorten") {
    const evidenceSummary = Object.entries(review.metEvidence)
      .slice(0, 3)
      .map(([item, ev]) => `• "${item}" — ${ev}`)
      .join("\n");

    return [
      greeting,
      "",
      `The meeting "${proposalTitle}" has been shortened to ${review.recommendedDurationMins} minutes.`,
      "",
      "These agenda items have already been resolved in the thread and will be skipped:",
      ...review.metAgendaItems.map((item) => `• ${item} ✓`),
      "",
      evidenceSummary ? "Evidence from conversation:\n" + evidenceSummary : "",
      "",
      "Remaining items to cover in the meeting:",
      ...review.unmetAgendaItems.map((item) => `• ${item}`),
    ].filter(Boolean).join("\n");
  }

  return "";
}

// ---------------------------------------------------------------------------
// Edge function handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Accept optional proposal_id to review a single meeting, or review all upcoming
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const { proposal_id } = body as { proposal_id?: string };

    // Fetch scheduled proposals (upcoming meetings)
    const proposalQuery = supabase
      .from("meeting_proposals")
      .select("*")
      .eq("status", "scheduled")
      .not("scheduled_at", "is", null)
      .not("conversation_id", "is", null)
      .order("scheduled_at", { ascending: true });

    if (proposal_id) proposalQuery.eq("id", proposal_id);

    const { data: proposals, error: propErr } = await proposalQuery;
    if (propErr) throw propErr;

    if (!proposals || proposals.length === 0) {
      return new Response(
        JSON.stringify({ reviewed: 0, results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const proposal of proposals) {
      // Load the linked conversation messages
      const { data: messages, error: msgErr } = await supabase
        .from("messages")
        .select("author, content, sent_at")
        .eq("conversation_id", proposal.conversation_id)
        .order("sent_at", { ascending: true });

      if (msgErr || !messages || messages.length === 0) {
        results.push({
          proposal_id: proposal.id,
          title: proposal.title,
          skipped: true,
          reason: "No conversation messages found",
        });
        continue;
      }

      const agendaItems = (proposal.agenda_items as string[]) ?? [];
      const participants = (proposal.participants as string[]) ?? [];
      const review = reviewMeetingAgenda(
        agendaItems,
        proposal.suggested_duration_mins,
        messages
      );

      // Check if we already reviewed this proposal recently (within 30 min) with same recommendation
      const { data: recentReview } = await supabase
        .from("meeting_reviews")
        .select("id, recommendation, action_taken")
        .eq("proposal_id", proposal.id)
        .gte("reviewed_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Build notification message
      const notificationContent = review.recommendation !== "keep"
        ? buildNotificationMessage(proposal.title, review, participants)
        : null;

      // Insert review record
      const { data: reviewRecord, error: reviewErr } = await supabase
        .from("meeting_reviews")
        .insert({
          proposal_id: proposal.id,
          conversation_id: proposal.conversation_id,
          reviewed_at: new Date().toISOString(),
          recommendation: review.recommendation,
          original_duration_mins: proposal.suggested_duration_mins,
          recommended_duration_mins: review.recommendedDurationMins,
          met_agenda_items: review.metAgendaItems,
          unmet_agenda_items: review.unmetAgendaItems,
          reasoning: review.reasoning,
          notification_sent: false,
        })
        .select()
        .single();

      if (reviewErr) throw reviewErr;

      // Auto-apply action if recommendation is cancel or shorten, and no recent action was already taken
      const alreadyActioned = recentReview?.action_taken != null;
      let actionTaken: string | null = null;

      if (!alreadyActioned && review.recommendation === "cancel") {
        // Cancel the proposal
        await supabase
          .from("meeting_proposals")
          .update({ status: "declined" })
          .eq("id", proposal.id);
        actionTaken = "cancelled";
      } else if (!alreadyActioned && review.recommendation === "shorten" && review.recommendedDurationMins) {
        // Shorten the meeting duration
        await supabase
          .from("meeting_proposals")
          .update({ suggested_duration_mins: review.recommendedDurationMins })
          .eq("id", proposal.id);
        actionTaken = "shortened";
      }

      // Send notification message to conversation if action taken
      let notificationSent = false;
      if (actionTaken && notificationContent) {
        const { error: notifErr } = await supabase
          .from("messages")
          .insert({
            conversation_id: proposal.conversation_id,
            author: "MeetDetect",
            content: notificationContent,
            sent_at: new Date().toISOString(),
          });

        if (!notifErr) {
          notificationSent = true;
          // Update conversations updated_at to surface the new message
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", proposal.conversation_id);
        }
      }

      // Update review record with action taken and notification status
      if (actionTaken || notificationSent) {
        await supabase
          .from("meeting_reviews")
          .update({
            action_taken: actionTaken,
            action_taken_at: actionTaken ? new Date().toISOString() : null,
            notification_sent: notificationSent,
          })
          .eq("id", reviewRecord.id);
      }

      results.push({
        proposal_id: proposal.id,
        title: proposal.title,
        recommendation: review.recommendation,
        metAgendaItems: review.metAgendaItems,
        unmetAgendaItems: review.unmetAgendaItems,
        recommendedDurationMins: review.recommendedDurationMins,
        reasoning: review.reasoning,
        actionTaken,
        notificationSent,
        reviewId: reviewRecord.id,
      });
    }

    return new Response(
      JSON.stringify({ reviewed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
