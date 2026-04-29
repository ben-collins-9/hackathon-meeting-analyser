import { useState, useEffect } from 'react';
import {
  X, ArrowRight, BarChart3, FileText, Phone, Mail, Video,
  AlertTriangle, ShieldCheck, Zap, Clock, Users, ChevronDown,
  ChevronUp, CheckCircle2, Loader2,
} from 'lucide-react';
import type { CalendarEvent } from '../../lib/calendar';
import { eventDurationMins, formatDuration } from '../../lib/calendar';
import { assessCriticality, type CriticalityResult, type Alternative, type AlternativeType } from '../../lib/meetingOptimizer';
import { saveMeetingOptimization } from '../../lib/api';

// ---------------------------------------------------------------------------
// Icon map for alternatives
// ---------------------------------------------------------------------------

const ALT_ICONS: Record<AlternativeType, React.ReactNode> = {
  poll: <BarChart3 size={18} />,
  async_doc: <FileText size={18} />,
  quick_call: <Phone size={18} />,
  email_thread: <Mail size={18} />,
  recorded_update: <Video size={18} />,
};

const ALT_COLORS: Record<AlternativeType, string> = {
  poll: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700',
  async_doc: 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700',
  quick_call: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
  email_thread: 'border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700',
  recorded_update: 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700',
};

const ALT_SELECTED_COLORS: Record<AlternativeType, string> = {
  poll: 'border-blue-500 bg-blue-600 text-white ring-2 ring-blue-300',
  async_doc: 'border-amber-500 bg-amber-600 text-white ring-2 ring-amber-300',
  quick_call: 'border-emerald-500 bg-emerald-600 text-white ring-2 ring-emerald-300',
  email_thread: 'border-sky-500 bg-sky-600 text-white ring-2 ring-sky-300',
  recorded_update: 'border-rose-500 bg-rose-600 text-white ring-2 ring-rose-300',
};

// ---------------------------------------------------------------------------
// Criticality indicator
// ---------------------------------------------------------------------------

const CRITICALITY_CONFIG = {
  low: {
    label: 'Low Criticality',
    sublabel: 'This meeting has good alternatives',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bar: ['bg-emerald-400', 'bg-emerald-200', 'bg-emerald-200', 'bg-emerald-200', 'bg-emerald-200'],
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    scoreColor: 'text-emerald-700',
  },
  medium: {
    label: 'Medium Criticality',
    sublabel: 'Alternatives may work for parts of this',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    bar: ['bg-amber-400', 'bg-amber-400', 'bg-amber-400', 'bg-amber-200', 'bg-amber-200'],
    icon: <AlertTriangle size={20} className="text-amber-600" />,
    scoreColor: 'text-amber-700',
  },
  high: {
    label: 'High Criticality',
    sublabel: 'This meeting likely requires real-time discussion',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-200',
    bar: ['bg-red-500', 'bg-red-500', 'bg-red-500', 'bg-red-500', 'bg-red-500'],
    icon: <Zap size={20} className="text-red-600" />,
    scoreColor: 'text-red-700',
  },
};

// ---------------------------------------------------------------------------
// Score bar component
// ---------------------------------------------------------------------------

function ScoreBar({ score, level }: { score: number; level: 'low' | 'medium' | 'high' }) {
  const config = CRITICALITY_CONFIG[level];
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all ${
            i <= score ? config.bar[i - 1] : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alternative card
// ---------------------------------------------------------------------------

function AlternativeCard({
  alt,
  selected,
  onSelect,
}: {
  alt: Alternative;
  selected: boolean;
  onSelect: () => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const colorClass = selected ? ALT_SELECTED_COLORS[alt.type] : ALT_COLORS[alt.type];

  return (
    <div
      className={`rounded-xl border-2 transition-all cursor-pointer ${colorClass}`}
      onClick={onSelect}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-70'}`}>
            {ALT_ICONS[alt.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-semibold text-sm leading-snug ${selected ? '' : ''}`}>
                {alt.title}
              </p>
              {selected && (
                <CheckCircle2 size={14} className="shrink-0 text-white" />
              )}
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed ${selected ? 'opacity-90' : 'opacity-75'}`}>
              {alt.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={11} className="opacity-60 shrink-0" />
              <span className={`text-xs font-medium ${selected ? 'opacity-90' : 'opacity-60'}`}>
                {alt.timeEstimate}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowReasoning((p) => !p); }}
                className={`ml-auto text-xs flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity`}
              >
                Why? {showReasoning ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>
            {showReasoning && (
              <p className={`text-xs mt-2 leading-relaxed border-t pt-2 ${selected ? 'border-white/30 opacity-90' : 'border-current/20 opacity-60'}`}>
                {alt.reasoning}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score breakdown mini-bar
// ---------------------------------------------------------------------------

function BreakdownRow({ label, score }: { label: string; score: number }) {
  const pct = Math.round((score / 25) * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-28 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-400 w-6 text-right">{score}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

interface Props {
  event: CalendarEvent;
  onProceed: () => void;
  onClose: () => void;
  /** Called when user picks a duration-reducing alternative (quick_call). New duration in minutes. */
  onShortenEvent?: (event: CalendarEvent, newDurationMins: number) => Promise<void>;
  /** Called when user picks an alternative that eliminates the meeting. */
  onDeleteEvent?: (event: CalendarEvent) => Promise<void>;
}

const QUICK_CALL_DURATION = 15;

export default function MeetingInterceptModal({ event, onProceed, onClose, onShortenEvent, onDeleteEvent }: Props) {
  const [result] = useState<CriticalityResult>(() => assessCriticality(event));
  const [selected, setSelected] = useState<AlternativeType | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const config = CRITICALITY_CONFIG[result.level];
  const durationMins = eventDurationMins(event);

  // Auto-select first alternative when score is low
  useEffect(() => {
    if (result.score <= 2 && result.suggestedAlternatives.length > 0) {
      setSelected(result.suggestedAlternatives[0].type);
    }
  }, [result]);

  async function persist(chosenAlternative: string | null, proceeded: boolean) {
    try {
      await saveMeetingOptimization({
        event_id: event.id,
        event_title: event.title,
        criticality_score: result.score,
        criticality_level: result.level,
        score_breakdown: result.breakdown as unknown as Record<string, number>,
        chosen_alternative: chosenAlternative,
        proceeded_with_meeting: proceeded,
      });
    } catch {
      // Non-blocking — don't fail UX over analytics write
    }
  }

  async function handleChooseAlternative() {
    if (!selected) return;
    setSaving(true);
    try {
      await persist(selected, false);
      if (selected === 'quick_call' && onShortenEvent) {
        await onShortenEvent(event, QUICK_CALL_DURATION);
      } else if (selected !== 'quick_call' && onDeleteEvent) {
        await onDeleteEvent(event);
      }
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleProceed() {
    await persist(null, true);
    onProceed();
  }

  if (done) {
    const chosenAlt = result.suggestedAlternatives.find((a) => a.type === selected);
    const wasShortened = selected === 'quick_call';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {wasShortened ? 'Meeting shortened!' : 'Meeting removed!'}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {wasShortened
              ? <>The meeting has been shortened to <span className="font-medium text-gray-800">{QUICK_CALL_DURATION} minutes</span>. You chose <span className="font-medium text-gray-800">{chosenAlt?.title}</span> to keep it focused.</>
              : <>The meeting has been removed from your calendar. You chose <span className="font-medium text-gray-800">{chosenAlt?.title}</span> as a more efficient alternative.</>
            }
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Meeting Optimizer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

          {/* Event summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Analyzing invitation</p>
            <p className="font-semibold text-gray-900 leading-snug">{event.title}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} /> {formatDuration(durationMins)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Users size={11} /> {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
              </span>
              {event.category && (
                <span className="text-xs text-gray-400 capitalize">{event.category}</span>
              )}
            </div>
          </div>

          {/* Criticality score */}
          <div className={`rounded-xl border-2 px-4 py-4 ${config.bg} ${config.border}`}>
            <div className="flex items-center gap-3 mb-3">
              {config.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-base ${config.scoreColor}`}>{config.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${config.badge}`}>
                    {result.score}/5
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{config.sublabel}</p>
              </div>
            </div>

            <ScoreBar score={result.score} level={result.level} />

            {/* Score factors */}
            {result.reasoning.length > 0 && (
              <div className="mt-3 space-y-1">
                {result.reasoning.slice(0, 3).map((r, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5 shrink-0">·</span>
                    {r}
                  </p>
                ))}
              </div>
            )}

            {/* Breakdown toggle */}
            <button
              type="button"
              onClick={() => setShowBreakdown((p) => !p)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
            >
              Score breakdown {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showBreakdown && (
              <div className="mt-2 space-y-1.5 pt-2 border-t border-black/10">
                <BreakdownRow label="Keywords" score={result.breakdown.keywords} />
                <BreakdownRow label="Attendees" score={result.breakdown.attendees} />
                <BreakdownRow label="Duration" score={result.breakdown.duration} />
                <BreakdownRow label="Agenda complexity" score={result.breakdown.agendaComplexity} />
              </div>
            )}
          </div>

          {/* Alternatives */}
          {result.level !== 'high' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Suggested alternatives
              </p>
              <div className="space-y-2.5">
                {result.suggestedAlternatives.map((alt) => (
                  <AlternativeCard
                    key={alt.type}
                    alt={alt}
                    selected={selected === alt.type}
                    onSelect={() => setSelected((p) => p === alt.type ? null : alt.type)}
                  />
                ))}
              </div>
            </div>
          )}

          {result.level === 'high' && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium mb-1">High criticality detected</p>
              <p className="text-xs leading-relaxed opacity-80">
                Based on the meeting content, real-time collaboration is likely needed here.
                Alternatives may still be useful for portions of the agenda.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 space-y-2">
          {result.level !== 'high' && selected && (
            <button
              onClick={handleChooseAlternative}
              disabled={saving}
              className="w-full py-3 text-sm font-semibold rounded-xl transition-all bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <>Use this alternative <ArrowRight size={14} /></>}
            </button>
          )}
          <button
            onClick={handleProceed}
            disabled={saving}
            className={`w-full py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
              result.level === 'high'
                ? 'bg-gray-900 text-white hover:bg-gray-700'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Proceed with Meeting
            {result.level !== 'high' && <ChevronDown size={13} className="opacity-50 rotate-[-90deg]" />}
          </button>
        </div>
      </div>
    </div>
  );
}
