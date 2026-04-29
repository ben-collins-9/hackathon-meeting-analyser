import { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle, XCircle, Calendar, ChevronDown, ChevronUp, AlertTriangle, Minus, ArrowUp, Activity, Tag, Sparkles, Loader2 } from 'lucide-react';
import type { MeetingProposal, SignalHit } from '../lib/database.types';
import { updateProposalStatus, getScheduledProposalEvents } from '../lib/api';
import type { FreeSlot } from '../lib/calendar';
import { findFreeSlots, localProvider } from '../lib/calendar';

const URGENCY_CONFIG = {
  high: { label: 'High urgency', color: 'text-red-600 bg-red-50 border-red-200', icon: ArrowUp },
  medium: { label: 'Medium urgency', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
  low: { label: 'Low urgency', color: 'text-sky-600 bg-sky-50 border-sky-200', icon: Minus },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  accepted: { label: 'Accepted', color: 'bg-green-50 text-green-700 border-green-200' },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-700 border-red-200' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const CONFIDENCE_CONFIG = {
  high: { label: 'High confidence', bar: 'w-full bg-green-400' },
  medium: { label: 'Medium confidence', bar: 'w-2/3 bg-amber-400' },
  low: { label: 'Low confidence', bar: 'w-1/3 bg-gray-300' },
};

const SIGNAL_CATEGORY_COLORS: Record<string, string> = {
  blocker: 'bg-red-100 text-red-700 border-red-200',
  conflict: 'bg-orange-100 text-orange-700 border-orange-200',
  decision: 'bg-amber-100 text-amber-700 border-amber-200',
  confusion: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  urgency: 'bg-rose-100 text-rose-700 border-rose-200',
  frustration: 'bg-pink-100 text-pink-700 border-pink-200',
};

interface Props {
  proposal: MeetingProposal;
  onUpdated: (updated: MeetingProposal) => void;
}

export default function MeetingProposalCard({ proposal, onUpdated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<FreeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load suggested free slots whenever the scheduler panel opens
  useEffect(() => {
    if (!showScheduler) return;
    let cancelled = false;
    setLoadingSlots(true);
    async function load() {
      try {
        const from = new Date();
        from.setMonth(from.getMonth() - 1);
        const to = new Date();
        to.setMonth(to.getMonth() + 2);
        const [mockEvts, scheduledEvts] = await Promise.all([
          localProvider.listEvents(from, to),
          getScheduledProposalEvents(),
        ]);
        if (cancelled) return;
        const allEvents = [...mockEvts, ...scheduledEvts];
        setSuggestedSlots(findFreeSlots(proposal.suggested_duration_mins, allEvents));
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [showScheduler, proposal.suggested_duration_mins]);

  function applySlot(slot: FreeSlot) {
    const d = slot.start;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setScheduleDate(`${yyyy}-${mm}-${dd}`);
    setScheduleTime(`${hh}:${min}`);
  }

  const urgency = URGENCY_CONFIG[proposal.urgency];
  const UrgencyIcon = urgency.icon;
  const status = STATUS_CONFIG[proposal.status];
  const confidence = CONFIDENCE_CONFIG[proposal.confidence ?? 'low'];
  const agendaItems = proposal.agenda_items as string[];
  const participants = proposal.participants as string[];
  const triggeredSignals = (proposal.triggered_signals ?? []) as SignalHit[];

  async function handleAccept() {
    setLoading(true);
    try {
      const updated = await updateProposalStatus(proposal.id, 'accepted');
      pendo.track('proposal_accepted', {
        proposal_id: proposal.id,
        urgency: proposal.urgency,
        confidence: proposal.confidence ?? '',
        suggested_duration_mins: proposal.suggested_duration_mins,
      });
      onUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    setLoading(true);
    try {
      const updated = await updateProposalStatus(proposal.id, 'declined');
      pendo.track('proposal_declined', {
        proposal_id: proposal.id,
        urgency: proposal.urgency,
        confidence: proposal.confidence ?? '',
        suggested_duration_mins: proposal.suggested_duration_mins,
      });
      onUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleSchedule() {
    if (!scheduleDate || !scheduleTime) return;
    setLoading(true);
    try {
      const dt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const updated = await updateProposalStatus(proposal.id, 'scheduled', dt);
      pendo.track('proposal_scheduled', {
        proposal_id: proposal.id,
        urgency: proposal.urgency,
        confidence: proposal.confidence ?? '',
        scheduled_at: dt,
        suggested_duration_mins: proposal.suggested_duration_mins,
      });
      onUpdated(updated);
      setShowScheduler(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-shadow hover:shadow-md ${proposal.urgency === 'high' ? 'border-red-200' : 'border-gray-200'}`}>
      {proposal.urgency === 'high' && (
        <div className="h-1 bg-gradient-to-r from-red-400 to-orange-400" />
      )}

      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${urgency.color}`}>
                <UrgencyIcon size={10} />
                {urgency.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{proposal.title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{proposal.summary}</p>
          </div>
          <button onClick={() => setExpanded((p) => !p)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} /> {proposal.suggested_duration_mins} min
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Users size={12} /> {participants.length} attendee{participants.length !== 1 ? 's' : ''}
          </span>
          {proposal.analysis_score != null && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Activity size={12} /> Score: {proposal.analysis_score}
            </span>
          )}
          {proposal.scheduled_at && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
              <Calendar size={12} /> {new Date(proposal.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Confidence meter */}
        {proposal.confidence && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">{confidence.label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${confidence.bar}`} />
            </div>
          </div>
        )}

        {/* Triggered signals chips */}
        {triggeredSignals.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {triggeredSignals.map((s) => (
              <span
                key={s.category}
                title={`Matched: ${s.matches.slice(0, 5).join(', ')}`}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${SIGNAL_CATEGORY_COLORS[s.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
              >
                <Tag size={9} />
                {s.label} ×{s.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          {triggeredSignals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Detected signals</p>
              <div className="space-y-2">
                {triggeredSignals.map((s) => (
                  <div key={s.category} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${SIGNAL_CATEGORY_COLORS[s.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400">weight: +{s.weight}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Matched: <span className="font-mono text-gray-700">{s.matches.slice(0, 5).join(', ')}</span>
                      {s.matches.length > 5 && ` +${s.matches.length - 5} more`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {agendaItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Suggested agenda</p>
              <ul className="space-y-1">
                {agendaItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {participants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Attendees</p>
              <div className="flex flex-wrap gap-1.5">
                {participants.map((p) => (
                  <span key={p} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-700">{p}</span>
                ))}
              </div>
            </div>
          )}

          {showScheduler && (
            <div className="bg-white border border-blue-100 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-500" />
                <p className="text-xs font-semibold text-gray-800">Schedule meeting</p>
                <span className="ml-auto text-xs text-gray-400">{proposal.suggested_duration_mins} min</span>
              </div>

              {/* Suggested slots */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Suggested free slots</p>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                    <Loader2 size={12} className="animate-spin" /> Finding available times…
                  </div>
                ) : suggestedSlots.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No free slots found in the next 7 days — pick manually below.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedSlots.map((slot, i) => {
                      const isSelected =
                        scheduleDate ===
                          `${slot.start.getFullYear()}-${String(slot.start.getMonth() + 1).padStart(2, '0')}-${String(slot.start.getDate()).padStart(2, '0')}` &&
                        scheduleTime ===
                          `${String(slot.start.getHours()).padStart(2, '0')}:${String(slot.start.getMinutes()).padStart(2, '0')}`;
                      return (
                        <button
                          key={i}
                          onClick={() => applySlot(slot)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manual override */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Or pick a custom time</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <button
                onClick={handleSchedule}
                disabled={!scheduleDate || !scheduleTime || loading}
                className="w-full py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium"
              >
                {loading ? 'Saving…' : 'Confirm schedule'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {proposal.status === 'pending' && (
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            <CheckCircle size={13} /> Accept
          </button>
          <button
            onClick={() => { setShowScheduler((p) => !p); setExpanded(true); }}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Calendar size={13} /> Schedule
          </button>
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs bg-white text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
          >
            <XCircle size={13} /> Decline
          </button>
        </div>
      )}

      {proposal.status === 'accepted' && (
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => { setShowScheduler((p) => !p); setExpanded(true); }}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar size={13} /> Schedule it
          </button>
        </div>
      )}
    </div>
  );
}
