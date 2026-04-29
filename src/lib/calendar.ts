// Calendar data layer — structured for future Google Calendar / Outlook integration.
// All provider-specific adapters should normalize their data to CalendarEvent.

export type EventCategory = 'meeting' | 'review' | 'standup' | 'social' | 'focus' | 'external';

export interface CalendarAttendee {
  name: string;
  email: string;
  status: 'accepted' | 'tentative' | 'declined' | 'pending';
  isOrganizer?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  location?: string;
  videoLink?: string;
  attendees: CalendarAttendee[];
  agendaItems?: string[];
  category: EventCategory;
  color?: string;  // tailwind bg color token
  isAllDay?: boolean;
  source?: 'google' | 'outlook' | 'local'; // for future integration
}

// ---------------------------------------------------------------------------
// Provider adapter interface — implement for Google Calendar / Outlook
// ---------------------------------------------------------------------------

export interface CalendarProvider {
  name: string;
  listEvents(from: Date, to: Date): Promise<CalendarEvent[]>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function eventDurationMins(event: CalendarEvent): number {
  return Math.round((new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000);
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  meeting:  'bg-blue-500',
  review:   'bg-amber-500',
  standup:  'bg-emerald-500',
  social:   'bg-pink-500',
  focus:    'bg-gray-400',
  external: 'bg-teal-500',
};

export function categoryColor(event: CalendarEvent): string {
  return event.color ?? CATEGORY_COLORS[event.category] ?? 'bg-blue-500';
}

// light variant for backgrounds
const CATEGORY_LIGHT: Record<EventCategory, string> = {
  meeting:  'bg-blue-50 border-blue-200 text-blue-800',
  review:   'bg-amber-50 border-amber-200 text-amber-800',
  standup:  'bg-emerald-50 border-emerald-200 text-emerald-800',
  social:   'bg-pink-50 border-pink-200 text-pink-800',
  focus:    'bg-gray-50 border-gray-200 text-gray-700',
  external: 'bg-teal-50 border-teal-200 text-teal-800',
};

export function categoryLight(event: CalendarEvent): string {
  return CATEGORY_LIGHT[event.category] ?? 'bg-blue-50 border-blue-200 text-blue-800';
}

// ---------------------------------------------------------------------------
// Mock data — replace listEvents() with a real provider adapter later
// ---------------------------------------------------------------------------

function makeDate(daysFromToday: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeEndDate(daysFromToday: number, hour: number, minute = 0): string {
  return makeDate(daysFromToday, hour, minute);
}

export const MOCK_EVENTS: CalendarEvent[] = [
  // Today
  {
    id: 'evt-001',
    title: 'Daily Standup',
    description: 'Quick async check-in for the engineering team.',
    startAt: makeDate(0, 9, 30),
    endAt: makeEndDate(0, 9, 45),
    videoLink: 'https://meet.google.com/abc-defg-hij',
    attendees: [
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
      { name: 'Riley Kim', email: 'riley@company.com', status: 'tentative' },
    ],
    agendaItems: ['Blockers & updates', 'Sprint progress', 'Open questions'],
    category: 'standup',
    source: 'local',
  },
  {
    id: 'evt-002',
    title: 'Q3 Roadmap Review',
    description: 'Review the proposed Q3 roadmap with product and engineering leads. Come prepared with your team\'s capacity estimates.',
    startAt: makeDate(0, 11, 0),
    endAt: makeEndDate(0, 12, 0),
    location: 'Conference Room B',
    videoLink: 'https://zoom.us/j/123456789',
    attendees: [
      { name: 'Morgan Liu', email: 'morgan@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
      { name: 'Casey Brown', email: 'casey@company.com', status: 'declined' },
      { name: 'Dana White', email: 'dana@company.com', status: 'accepted' },
      { name: 'Taylor Swift', email: 'taylor@company.com', status: 'tentative' },
    ],
    agendaItems: [
      'Review Q2 retrospective outcomes',
      'Present Q3 proposed roadmap',
      'Capacity planning by team',
      'Prioritization discussion',
      'Next steps & owners',
    ],
    category: 'review',
    source: 'local',
  },
  {
    id: 'evt-003',
    title: 'Design System Sync',
    description: 'Bi-weekly sync to align on component library progress and design tokens.',
    startAt: makeDate(0, 14, 0),
    endAt: makeEndDate(0, 14, 30),
    videoLink: 'https://meet.google.com/xyz-uvwx-yz',
    attendees: [
      { name: 'Riley Kim', email: 'riley@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
    ],
    agendaItems: ['Component audit update', 'Token naming conventions', 'Figma handoff process'],
    category: 'meeting',
    source: 'local',
  },
  // Tomorrow
  {
    id: 'evt-004',
    title: 'Daily Standup',
    startAt: makeDate(1, 9, 30),
    endAt: makeEndDate(1, 9, 45),
    videoLink: 'https://meet.google.com/abc-defg-hij',
    attendees: [
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
      { name: 'Riley Kim', email: 'riley@company.com', status: 'accepted' },
    ],
    agendaItems: ['Blockers & updates', 'Sprint progress'],
    category: 'standup',
    source: 'local',
  },
  {
    id: 'evt-005',
    title: '1:1 with Morgan',
    description: 'Weekly 1:1 to discuss career growth, blockers, and team health.',
    startAt: makeDate(1, 13, 0),
    endAt: makeEndDate(1, 13, 30),
    videoLink: 'https://meet.google.com/one-on-one',
    attendees: [
      { name: 'Morgan Liu', email: 'morgan@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
    ],
    agendaItems: ['Career development topics', 'Team feedback', 'Personal blockers', 'Any other business'],
    category: 'meeting',
    source: 'local',
  },
  {
    id: 'evt-006',
    title: 'Vendor Onboarding Call',
    description: 'Initial onboarding session with our new infrastructure vendor.',
    startAt: makeDate(1, 15, 0),
    endAt: makeEndDate(1, 16, 0),
    location: 'Boardroom A',
    videoLink: 'https://teams.microsoft.com/l/meetup-join/abc',
    attendees: [
      { name: 'Casey Brown', email: 'casey@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Morgan Liu', email: 'morgan@company.com', status: 'accepted' },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'tentative' },
      { name: 'External: Jamie Vendor', email: 'jamie@vendor.com', status: 'accepted' },
    ],
    agendaItems: ['Company intro', 'Scope of work review', 'Timeline alignment', 'Q&A'],
    category: 'external',
    source: 'local',
  },
  // Day after tomorrow
  {
    id: 'evt-007',
    title: 'Sprint Planning',
    description: 'Sprint 42 planning session. Review backlog, assign stories, set sprint goal.',
    startAt: makeDate(2, 10, 0),
    endAt: makeEndDate(2, 12, 0),
    videoLink: 'https://meet.google.com/sprint-planning',
    attendees: [
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
      { name: 'Riley Kim', email: 'riley@company.com', status: 'accepted' },
      { name: 'Dana White', email: 'dana@company.com', status: 'pending' },
    ],
    agendaItems: [
      'Review velocity from last sprint',
      'Backlog grooming',
      'Story point estimation',
      'Sprint goal definition',
      'Capacity check',
    ],
    category: 'meeting',
    source: 'local',
  },
  {
    id: 'evt-008',
    title: 'Deep Work Block',
    description: 'Focus time — no interruptions.',
    startAt: makeDate(2, 14, 0),
    endAt: makeEndDate(2, 17, 0),
    attendees: [
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted', isOrganizer: true },
    ],
    agendaItems: [],
    category: 'focus',
    source: 'local',
  },
  // 3 days out
  {
    id: 'evt-009',
    title: 'Daily Standup',
    startAt: makeDate(3, 9, 30),
    endAt: makeEndDate(3, 9, 45),
    videoLink: 'https://meet.google.com/abc-defg-hij',
    attendees: [
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
    ],
    agendaItems: ['Blockers & updates'],
    category: 'standup',
    source: 'local',
  },
  {
    id: 'evt-010',
    title: 'Engineering All-Hands',
    description: 'Monthly all-hands for the full engineering org. Updates from leadership, team spotlights, and open Q&A.',
    startAt: makeDate(3, 16, 0),
    endAt: makeEndDate(3, 17, 0),
    videoLink: 'https://zoom.us/j/all-hands',
    attendees: [
      { name: 'Morgan Liu', email: 'morgan@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
      { name: 'Riley Kim', email: 'riley@company.com', status: 'accepted' },
      { name: 'Casey Brown', email: 'casey@company.com', status: 'tentative' },
      { name: 'Dana White', email: 'dana@company.com', status: 'accepted' },
      { name: 'Taylor Swift', email: 'taylor@company.com', status: 'accepted' },
    ],
    agendaItems: ['Leadership updates', 'Q2 metrics review', 'Team spotlight: Platform team', 'Open Q&A'],
    category: 'meeting',
    source: 'local',
  },
  // 5 days out
  {
    id: 'evt-011',
    title: 'Team Lunch',
    description: 'Monthly informal team lunch. No agenda — just good food and good company.',
    startAt: makeDate(5, 12, 0),
    endAt: makeEndDate(5, 13, 30),
    location: 'Trattoria Roma, 42 Main St',
    attendees: [
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
      { name: 'Riley Kim', email: 'riley@company.com', status: 'accepted' },
      { name: 'Dana White', email: 'dana@company.com', status: 'tentative' },
    ],
    agendaItems: [],
    category: 'social',
    source: 'local',
  },
  // -2 days (past)
  {
    id: 'evt-012',
    title: 'Architecture Review',
    description: 'Review proposed microservices migration architecture.',
    startAt: makeDate(-2, 10, 0),
    endAt: makeEndDate(-2, 11, 30),
    location: 'Conference Room A',
    attendees: [
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
      { name: 'Morgan Liu', email: 'morgan@company.com', status: 'accepted' },
    ],
    agendaItems: ['Current architecture pain points', 'Proposed migration plan', 'Risk assessment', 'Decision'],
    category: 'review',
    source: 'local',
  },
  // -1 day (yesterday)
  {
    id: 'evt-013',
    title: 'Daily Standup',
    startAt: makeDate(-1, 9, 30),
    endAt: makeEndDate(-1, 9, 45),
    videoLink: 'https://meet.google.com/abc-defg-hij',
    attendees: [
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted' },
    ],
    agendaItems: ['Blockers & updates'],
    category: 'standup',
    source: 'local',
  },
  {
    id: 'evt-014',
    title: 'Security Incident Debrief',
    description: 'Post-mortem discussion on last week\'s security alert.',
    startAt: makeDate(-1, 15, 0),
    endAt: makeEndDate(-1, 16, 0),
    videoLink: 'https://zoom.us/j/debrief',
    attendees: [
      { name: 'Casey Brown', email: 'casey@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Morgan Liu', email: 'morgan@company.com', status: 'accepted' },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
    ],
    agendaItems: ['Timeline of events', 'Root cause analysis', 'Remediation steps', 'Process improvements'],
    category: 'review',
    source: 'local',
  },
  // Next week
  {
    id: 'evt-015',
    title: 'Sprint Retrospective',
    description: 'Sprint 41 retrospective — what went well, what didn\'t, what to improve.',
    startAt: makeDate(7, 14, 0),
    endAt: makeEndDate(7, 15, 0),
    videoLink: 'https://meet.google.com/retro',
    attendees: [
      { name: 'Jordan Chen', email: 'jordan@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'accepted' },
      { name: 'Sam Patel', email: 'sam@company.com', status: 'accepted' },
      { name: 'Riley Kim', email: 'riley@company.com', status: 'accepted' },
    ],
    agendaItems: ['Wins', 'Improvements', 'Action items'],
    category: 'meeting',
    source: 'local',
  },
  {
    id: 'evt-016',
    title: 'Product Strategy Session',
    description: 'Half-day strategy session with product leadership to align on 6-month vision.',
    startAt: makeDate(8, 9, 0),
    endAt: makeEndDate(8, 13, 0),
    location: 'Innovation Lab',
    attendees: [
      { name: 'Morgan Liu', email: 'morgan@company.com', status: 'accepted', isOrganizer: true },
      { name: 'Casey Brown', email: 'casey@company.com', status: 'accepted' },
      { name: 'Dana White', email: 'dana@company.com', status: 'accepted' },
      { name: 'Alex Rivera', email: 'alex@company.com', status: 'tentative' },
    ],
    agendaItems: [
      'Market analysis review',
      'Competitive landscape',
      'Product vision alignment',
      'OKR drafting',
      'Resource planning',
    ],
    category: 'meeting',
    source: 'local',
  },
];

// ---------------------------------------------------------------------------
// Local provider (mock) — conforms to CalendarProvider interface
// ---------------------------------------------------------------------------

export const localProvider: CalendarProvider = {
  name: 'Local (Mock)',
  async listEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
    return MOCK_EVENTS.filter((e) => {
      const start = new Date(e.startAt);
      return start >= from && start <= to;
    });
  },
};

export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((e) => isSameDay(new Date(e.startAt), day))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function getTodayUpcoming(events: CalendarEvent[]): CalendarEvent[] {
  const now = new Date();
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return events
    .filter((e) => {
      const start = new Date(e.startAt);
      return isSameDay(start, now) && new Date(e.endAt) >= now;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}
