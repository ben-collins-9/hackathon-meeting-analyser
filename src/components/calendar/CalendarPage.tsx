import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '../../lib/calendar';
import { localProvider, startOfWeek, addDays, isSameDay } from '../../lib/calendar';
import { getScheduledProposalEvents } from '../../lib/api';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import CalendarSidebar from './CalendarSidebar';
import EventDetailModal from './EventDetailModal';
import MeetingReviewPanel from './MeetingReviewPanel';
import MeetingInterceptModal from './MeetingInterceptModal';

type ViewMode = 'day' | 'week' | 'month';

function formatHeaderLabel(date: Date, mode: ViewMode): string {
  if (mode === 'day') {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (mode === 'week') {
    const ws = startOfWeek(date);
    const we = addDays(ws, 6);
    const sameMonth = ws.getMonth() === we.getMonth();
    const sameYear = ws.getFullYear() === we.getFullYear();
    if (sameMonth) {
      return `${ws.toLocaleDateString(undefined, { month: 'long' })} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
    }
    if (sameYear) {
      return `${ws.toLocaleDateString(undefined, { month: 'short' })} ${ws.getDate()} – ${we.toLocaleDateString(undefined, { month: 'short' })} ${we.getDate()}, ${ws.getFullYear()}`;
    }
    return `${ws.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${we.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function navigate(date: Date, mode: ViewMode, dir: -1 | 1): Date {
  const d = new Date(date);
  if (mode === 'day') d.setDate(d.getDate() + dir);
  else if (mode === 'week') d.setDate(d.getDate() + dir * 7);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

interface Props {
  refreshKey?: number;
}

export default function CalendarPage({ refreshKey = 0 }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [interceptEvent, setInterceptEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    const from = new Date();
    from.setMonth(from.getMonth() - 2);
    const to = new Date();
    to.setMonth(to.getMonth() + 3);

    const [mockEvts, scheduledEvts] = await Promise.all([
      localProvider.listEvents(from, to),
      getScheduledProposalEvents(),
    ]);

    // Merge: scheduled proposals override mock events with same id (none expected),
    // and are distinguished by their 'proposal-' id prefix.
    const proposalIds = new Set(scheduledEvts.map((e) => e.id));
    const merged = [
      ...mockEvts.filter((e) => !proposalIds.has(e.id)),
      ...scheduledEvts,
    ];
    setEvents(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshKey]);

  // Refresh scheduled meetings whenever the browser tab regains focus
  // (user may have just scheduled something on another tab/view).
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible') loadEvents();
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadEvents]);

  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  const weekStart = startOfWeek(currentDate);

  function goToday() {
    setCurrentDate(new Date());
  }

  const VIEW_LABELS: Record<ViewMode, string> = { day: 'Day', week: 'Week', month: 'Month' };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap shrink-0">
        {/* Today button */}
        <button
          onClick={goToday}
          disabled={isToday && viewMode !== 'month'}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Today
        </button>

        {/* Nav arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate((d) => navigate(d, viewMode, -1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate((d) => navigate(d, viewMode, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Header label */}
        <h2 className="text-base font-semibold text-gray-900 flex-1 min-w-0 truncate">
          {formatHeaderLabel(currentDate, viewMode)}
        </h2>

        {/* View switcher */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 shrink-0">
          {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Meeting review panel */}
        <MeetingReviewPanel onCalendarChanged={loadEvents} />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Sidebar — hidden on small screens */}
          <div className="hidden lg:flex flex-col shrink-0">
            <CalendarSidebar
              allEvents={events}
              selectedDate={currentDate}
              onSelectDate={(d) => { setCurrentDate(d); if (viewMode === 'month') setViewMode('day'); }}
              onEventClick={setInterceptEvent}
            />
          </div>

          {/* Main view */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {viewMode === 'month' && (
              <MonthView
                year={currentDate.getFullYear()}
                month={currentDate.getMonth()}
                events={events}
                selectedDate={currentDate}
                onSelectDate={(d) => { setCurrentDate(d); setViewMode('day'); }}
                onEventClick={setInterceptEvent}
              />
            )}
            {viewMode === 'week' && (
              <WeekView
                weekStart={weekStart}
                events={events}
                selectedDate={currentDate}
                onSelectDate={setCurrentDate}
                onEventClick={setInterceptEvent}
              />
            )}
            {viewMode === 'day' && (
              <DayView
                date={currentDate}
                events={events}
                onEventClick={setInterceptEvent}
              />
            )}
          </div>
        </div>
      )}

      {interceptEvent && !selectedEvent && (
        <MeetingInterceptModal
          event={interceptEvent}
          onProceed={() => {
            setSelectedEvent(interceptEvent);
            setInterceptEvent(null);
          }}
          onClose={() => setInterceptEvent(null)}
        />
      )}

      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
