import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
  RefreshCw, BellRing, AlertTriangle, Loader2, Scissors,
  MessageSquare, ArrowRight,
} from 'lucide-react';
import {
  runMeetingReviews, getMeetingReviews, acknowledgeReview,
  type MeetingReview, type MeetingReviewResult,
} from '../../lib/api';

// Poll every 5 minutes
const POLL_INTERVAL_MS = 5 * 60 * 1000;

interface Props {
  /** When a meeting is cancelled or shortened, CalendarPage needs to reload events */
  onCalendarChanged: () => void;
}

type PanelState = 'idle' | 'running' | 'error';

interface ReviewEntry {
  review: MeetingReview;
  result?: MeetingReviewResult;
  expanded: boolean;
}

function RecommendationBadge({ rec }: { rec: 'cancel' | 'shorten' | 'keep' }) {
  if (rec === 'cancel') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        <XCircle size={10} /> Cancelled
      </span>
    );
  }
  if (rec === 'shorten') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <Scissors size={10} /> Shortened
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      <CheckCircle2 size={10} /> Kept
    </span>
  );
}

function ActionBadge({ action }: { action: MeetingReview['action_taken'] }) {
  if (action === 'cancelled') return (
    <span className="text-xs text-red-600 font-medium">Auto-cancelled</span>
  );
  if (action === 'shortened') return (
    <span className="text-xs text-amber-600 font-medium">Auto-shortened</span>
  );
  if (action === 'ignored') return (
    <span className="text-xs text-gray-400">Ignored</span>
  );
  return null;
}

export default function MeetingReviewPanel({ onCalendarChanged }: Props) {
  const [state, setState] = useState<PanelState>('idle');
  const [reviews, setReviews] = useState<MeetingReview[]>([]);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasChangedRef = useRef(false);

  const loadReviews = useCallback(async () => {
    const data = await getMeetingReviews();
    setReviews(data);
  }, []);

  const runReview = useCallback(async (silent = false) => {
    if (state === 'running') return;
    setState('running');
    hasChangedRef.current = false;
    try {
      const response = await runMeetingReviews();
      const actionable = response.results.filter(
        (r) => r.actionTaken === 'cancelled' || r.actionTaken === 'shortened'
      );
      if (actionable.length > 0) {
        hasChangedRef.current = true;
        setUnreadCount((n) => n + actionable.length);
        if (!silent) setPanelOpen(true);
        onCalendarChanged();
      }
      await loadReviews();
      setLastRunAt(new Date());
      setState('idle');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  }, [state, loadReviews, onCalendarChanged]);

  // Initial load + start polling
  useEffect(() => {
    loadReviews();
    runReview(true);
    pollRef.current = setInterval(() => runReview(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear unread badge when panel opens
  useEffect(() => {
    if (panelOpen) setUnreadCount(0);
  }, [panelOpen]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAcknowledge(reviewId: string) {
    await acknowledgeReview(reviewId);
    await loadReviews();
  }

  const actionableReviews = reviews.filter(
    (r) => r.recommendation !== 'keep' && r.action_taken !== 'ignored'
  );
  const recentReviews = reviews.slice(0, 20);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setPanelOpen((p) => !p)}
        className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
          panelOpen
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
        }`}
      >
        {state === 'running' ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Zap size={12} />
        )}
        Meeting Review
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {panelOpen && (
        <div className="absolute right-0 top-full mt-2 w-[480px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Continuous Meeting Review</p>
                {lastRunAt && (
                  <p className="text-[11px] text-gray-400">
                    Last checked {lastRunAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runReview(false)}
                disabled={state === 'running'}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={12} className={state === 'running' ? 'animate-spin' : ''} />
                {state === 'running' ? 'Reviewing…' : 'Run now'}
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >
                <ChevronUp size={14} />
              </button>
            </div>
          </div>

          {/* Status banner */}
          {state === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-xs text-red-700">
              <AlertTriangle size={12} /> Failed to run review — will retry automatically.
            </div>
          )}

          {/* Empty state */}
          {actionableReviews.length === 0 && recentReviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <CheckCircle2 size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No scheduled meetings to review yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Once meetings are scheduled, they'll be analysed automatically every 5 minutes.
              </p>
            </div>
          )}

          {/* Actionable reviews */}
          {actionableReviews.length > 0 && (
            <div className="border-b border-gray-100">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Actions taken
              </p>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {actionableReviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    expanded={expandedIds.has(review.id)}
                    onToggle={() => toggleExpand(review.id)}
                    onAcknowledge={() => handleAcknowledge(review.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent review history */}
          {recentReviews.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Review history
              </p>
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {recentReviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    expanded={expandedIds.has(review.id)}
                    onToggle={() => toggleExpand(review.id)}
                    onAcknowledge={() => handleAcknowledge(review.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 flex items-center gap-1">
            <Clock size={10} />
            Auto-reviews run every 5 minutes. Attendees are notified via conversation thread.
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review row sub-component
// ---------------------------------------------------------------------------

function ReviewRow({
  review,
  expanded,
  onToggle,
  onAcknowledge,
  compact = false,
}: {
  review: MeetingReview;
  expanded: boolean;
  onToggle: () => void;
  onAcknowledge: () => void;
  compact?: boolean;
}) {
  const metItems = review.met_agenda_items as string[];
  const unmetItems = review.unmet_agenda_items as string[];
  const timeAgo = formatTimeAgo(new Date(review.reviewed_at));

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <RecommendationBadge rec={review.recommendation} />
            {review.action_taken && <ActionBadge action={review.action_taken} />}
            {review.notification_sent && (
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-600">
                <MessageSquare size={9} /> Notified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">{review.reasoning}</p>
          {!compact && review.recommended_duration_mins && review.recommendation === 'shorten' && (
            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
              <Clock size={10} />
              {review.original_duration_mins}m
              <ArrowRight size={10} />
              {review.recommended_duration_mins}m
            </p>
          )}
          <p className="text-[11px] text-gray-400 mt-1">{timeAgo}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {review.recommendation !== 'keep' && !review.action_taken && (
            <button
              onClick={onAcknowledge}
              className="text-[11px] text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5 transition-colors"
            >
              Ignore
            </button>
          )}
          {(metItems.length > 0 || unmetItems.length > 0) && (
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 p-0.5 transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded agenda detail */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {metItems.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide mb-1">
                Resolved in thread
              </p>
              <ul className="space-y-1">
                {metItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <CheckCircle2 size={11} className="text-green-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {unmetItems.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Still needs discussion
              </p>
              <ul className="space-y-1">
                {unmetItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <BellRing size={11} className="text-amber-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
