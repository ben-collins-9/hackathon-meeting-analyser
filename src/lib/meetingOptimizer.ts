import type { CalendarEvent } from './calendar';
import { eventDurationMins } from './calendar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CriticalityLevel = 'low' | 'medium' | 'high';

export type AlternativeType =
  | 'poll'
  | 'async_doc'
  | 'quick_call'
  | 'email_thread'
  | 'recorded_update';

export interface Alternative {
  type: AlternativeType;
  title: string;
  description: string;
  reasoning: string;
  icon: string; // lucide icon name
  timeEstimate: string;
}

export interface ScoreBreakdown {
  keywords: number;       // 0-25: urgency/decision keywords in title+description
  attendees: number;      // 0-25: headcount weight
  duration: number;       // 0-25: long meetings score higher
  agendaComplexity: number; // 0-25: number of agenda items
}

export interface CriticalityResult {
  score: number;           // 1-5
  level: CriticalityLevel;
  breakdown: ScoreBreakdown;
  reasoning: string[];
  suggestedAlternatives: Alternative[];
}

// ---------------------------------------------------------------------------
// Keyword signals
// ---------------------------------------------------------------------------

const HIGH_URGENCY_KEYWORDS = [
  'urgent', 'critical', 'emergency', 'incident', 'outage', 'blocker',
  'escalation', 'crisis', 'immediate', 'asap',
];

const DECISION_KEYWORDS = [
  'decision', 'approve', 'approval', 'sign-off', 'sign off', 'vote',
  'final', 'go/no-go', 'go no go', 'greenlight', 'green light',
];

const STRATEGY_KEYWORDS = [
  'strategy', 'strategic', 'roadmap', 'planning', 'vision', 'okr',
  'quarterly', 'annual', 'forecast', 'budget', 'exec', 'leadership',
  'all-hands', 'all hands', 'board',
];

const INFO_ONLY_KEYWORDS = [
  'update', 'status', 'standup', 'stand-up', 'sync', 'check-in',
  'check in', 'fyi', 'newsletter', 'recap', 'summary',
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreKeywords(event: CalendarEvent): { score: number; reasons: string[] } {
  const text = `${event.title} ${event.description ?? ''} ${(event.agendaItems ?? []).join(' ')}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  const highHits = HIGH_URGENCY_KEYWORDS.filter((k) => text.includes(k));
  if (highHits.length > 0) {
    score += Math.min(25, highHits.length * 12);
    reasons.push(`High-urgency keywords detected: ${highHits.slice(0, 3).join(', ')}`);
  }

  const decisionHits = DECISION_KEYWORDS.filter((k) => text.includes(k));
  if (decisionHits.length > 0) {
    score += Math.min(20, decisionHits.length * 10);
    reasons.push(`Decision-making language present: ${decisionHits.slice(0, 3).join(', ')}`);
  }

  const strategyHits = STRATEGY_KEYWORDS.filter((k) => text.includes(k));
  if (strategyHits.length > 0) {
    score += Math.min(15, strategyHits.length * 8);
    reasons.push(`Strategic/executive content: ${strategyHits.slice(0, 3).join(', ')}`);
  }

  // Info-only keywords reduce score
  const infoHits = INFO_ONLY_KEYWORDS.filter((k) => text.includes(k));
  if (infoHits.length > 0) {
    score = Math.max(0, score - infoHits.length * 5);
    reasons.push(`Status/info-sharing nature detected — lower criticality`);
  }

  return { score: Math.min(25, score), reasons };
}

function scoreAttendees(event: CalendarEvent): { score: number; reasons: string[] } {
  const count = event.attendees.length;
  const reasons: string[] = [];
  let score = 0;

  // Senior role keywords in attendee names
  const seniorKeywords = ['vp', 'cto', 'ceo', 'coo', 'cfo', 'director', 'head of', 'principal', 'lead', 'manager'];
  const seniorCount = event.attendees.filter((a) =>
    seniorKeywords.some((k) => a.name.toLowerCase().includes(k))
  ).length;

  if (count >= 8) { score += 20; reasons.push(`Large group (${count} attendees) — harder to replace with async`); }
  else if (count >= 5) { score += 12; reasons.push(`${count} attendees — coordination cost is meaningful`); }
  else if (count === 2) { score += 5; reasons.push(`1:1 meeting — could be async`); }
  else { score += 8; }

  if (seniorCount > 0) {
    score += Math.min(5, seniorCount * 3);
    reasons.push(`${seniorCount} senior stakeholder(s) involved`);
  }

  return { score: Math.min(25, score), reasons };
}

function scoreDuration(event: CalendarEvent): { score: number; reasons: string[] } {
  const mins = eventDurationMins(event);
  const reasons: string[] = [];
  let score = 0;

  if (mins >= 120) { score = 25; reasons.push(`Long meeting (${mins}m) — high cost if unnecessary`); }
  else if (mins >= 60) { score = 18; reasons.push(`${mins}-minute meeting — worth considering alternatives`); }
  else if (mins >= 30) { score = 12; reasons.push(`${mins}-minute meeting`); }
  else { score = 5; reasons.push(`Short meeting (${mins}m) — low time cost`); }

  return { score, reasons };
}

function scoreAgenda(event: CalendarEvent): { score: number; reasons: string[] } {
  const items = event.agendaItems ?? [];
  const reasons: string[] = [];
  let score = 0;

  if (items.length === 0) {
    score = 2;
    reasons.push('No agenda set — unclear if real-time discussion is needed');
  } else if (items.length >= 5) {
    score = 22;
    reasons.push(`Complex agenda (${items.length} items) — genuine discussion likely needed`);
  } else if (items.length >= 3) {
    score = 15;
    reasons.push(`${items.length} agenda items`);
  } else {
    score = 8;
    reasons.push(`${items.length} agenda item${items.length !== 1 ? 's' : ''}`);
  }

  return { score, reasons };
}

// ---------------------------------------------------------------------------
// Alternative generator
// ---------------------------------------------------------------------------

function buildAlternatives(event: CalendarEvent, breakdown: ScoreBreakdown): Alternative[] {
  const alts: Alternative[] = [];
  const mins = eventDurationMins(event);
  const agendaCount = (event.agendaItems ?? []).length;
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();

  const isDecision = DECISION_KEYWORDS.some((k) => text.includes(k));
  const isStatusOnly = INFO_ONLY_KEYWORDS.some((k) => text.includes(k));
  const isLarge = event.attendees.length >= 5;

  // Poll — good for decisions with clear options
  if (isDecision || agendaCount <= 2) {
    alts.push({
      type: 'poll',
      title: 'Run a Poll',
      description: 'Share a quick poll to collect votes or preferences asynchronously.',
      reasoning: isDecision
        ? 'This meeting involves a decision that could be made via structured voting — no live discussion required.'
        : 'With only a couple of topics, a simple poll can capture input without scheduling overhead.',
      icon: 'BarChart3',
      timeEstimate: '5 min to set up',
    });
  }

  // Async doc — good for reviews and complex agendas
  if (agendaCount >= 3 || text.includes('review') || text.includes('feedback')) {
    alts.push({
      type: 'async_doc',
      title: 'Async Document Review',
      description: 'Share a doc with comments enabled — participants review and respond on their own schedule.',
      reasoning: 'Detailed feedback and review work better async where people can think carefully rather than react in real time.',
      icon: 'FileText',
      timeEstimate: 'No scheduling needed',
    });
  }

  // Quick call — for smaller groups or when meeting is long
  if (mins >= 45 && event.attendees.length <= 4) {
    alts.push({
      type: 'quick_call',
      title: '15-Minute Focus Call',
      description: 'Replace with a tight 15-minute call covering only the must-have decisions.',
      reasoning: `This ${mins}-minute meeting could likely be condensed to 15 minutes with a clear agenda and timeboxing.`,
      icon: 'Phone',
      timeEstimate: '15 min instead of ' + mins + ' min',
    });
  }

  // Email thread — good for status updates and large groups
  if (isStatusOnly || isLarge) {
    alts.push({
      type: 'email_thread',
      title: 'Email or Slack Thread',
      description: 'Send a structured update thread — people can read and respond when it suits them.',
      reasoning: isStatusOnly
        ? 'Status updates are ideal for async communication — a well-written email preserves the information better too.'
        : `With ${event.attendees.length} attendees, real-time coordination is expensive. A thread lets everyone contribute without blocking calendars.`,
      icon: 'Mail',
      timeEstimate: '10 min to write',
    });
  }

  // Recorded update — always offered as a low-friction option
  alts.push({
    type: 'recorded_update',
    title: 'Recorded Video Update',
    description: 'Record a short Loom or voice note sharing your update or proposal.',
    reasoning: 'A 5-minute video conveys tone and nuance like a meeting but lets viewers watch at their own pace — often more effective for complex topics.',
    icon: 'Video',
    timeEstimate: '5–10 min to record',
  });

  return alts;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function assessCriticality(event: CalendarEvent): CriticalityResult {
  const kw = scoreKeywords(event);
  const att = scoreAttendees(event);
  const dur = scoreDuration(event);
  const agenda = scoreAgenda(event);

  const breakdown: ScoreBreakdown = {
    keywords: kw.score,
    attendees: att.score,
    duration: dur.score,
    agendaComplexity: agenda.score,
  };

  const rawTotal = kw.score + att.score + dur.score + agenda.score; // 0–100
  // Map 0-100 to 1-5
  const score = Math.max(1, Math.min(5, Math.ceil(rawTotal / 20))) as 1 | 2 | 3 | 4 | 5;

  const level: CriticalityLevel =
    score <= 2 ? 'low' : score <= 3 ? 'medium' : 'high';

  const reasoning = [
    ...kw.reasons,
    ...att.reasons,
    ...dur.reasons,
    ...agenda.reasons,
  ];

  const suggestedAlternatives = buildAlternatives(event, breakdown);

  return { score, level, breakdown, reasoning, suggestedAlternatives };
}
