import { useRef, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '../../lib/calendar';
import { isSameDay, categoryLight, eventDurationMins, formatDuration } from '../../lib/calendar';

const HOUR_HEIGHT = 64;
const START_HOUR = 7;
const END_HOUR = 22;
const VISIBLE_HOURS = END_HOUR - START_HOUR;

function topPx(date: Date): number {
  const mins = (date.getHours() - START_HOUR) * 60 + date.getMinutes();
  return Math.max(0, mins) * (HOUR_HEIGHT / 60);
}

function heightPx(durationMins: number): number {
  return Math.max(28, durationMins * (HOUR_HEIGHT / 60));
}

function layoutEvents(events: CalendarEvent[]): { event: CalendarEvent; column: number; totalColumns: number }[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const groups: CalendarEvent[][] = [];
  for (const event of sorted) {
    const eStart = new Date(event.startAt).getTime();
    const eEnd = new Date(event.endAt).getTime();
    let placed = false;
    for (const group of groups) {
      const lastEnd = Math.max(...group.map((e) => new Date(e.endAt).getTime()));
      if (eStart >= lastEnd) { group.push(event); placed = true; break; }
    }
    if (!placed) groups.push([event]);
  }
  const result: { event: CalendarEvent; column: number; totalColumns: number }[] = [];
  for (let col = 0; col < groups.length; col++) {
    for (const event of groups[col]) {
      result.push({ event, column: col, totalColumns: groups.length });
    }
  }
  return result;
}

interface Props {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
}

export default function DayView({ date, events, onEventClick }: Props) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
    }
  }, []);

  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.startAt), date))
    .filter((e) => {
      const h = new Date(e.startAt).getHours();
      return h >= START_HOUR && h < END_HOUR;
    });

  const laid = layoutEvents(dayEvents);
  const hours = Array.from({ length: VISIBLE_HOURS }, (_, i) => START_HOUR + i);
  const totalGridHeight = VISIBLE_HOURS * HOUR_HEIGHT;

  return (
    <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Date header */}
      <div className="px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {date.getDate()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-gray-400">
              {dayEvents.length === 0
                ? 'No meetings scheduled'
                : `${dayEvents.length} meeting${dayEvents.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {dayEvents.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
            <CalendarDays size={28} className="text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">No meetings today</p>
            <p className="text-xs text-gray-400 mt-1">
              {isToday ? 'Enjoy the uninterrupted focus time.' : 'This day is free.'}
            </p>
          </div>
        </div>
      )}

      {/* Time grid */}
      {dayEvents.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex" style={{ minHeight: totalGridHeight }}>
            {/* Hour labels */}
            <div className="w-16 shrink-0 relative" style={{ height: totalGridHeight }}>
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  className="absolute right-3 text-xs text-gray-400 -translate-y-2"
                >
                  {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
                </div>
              ))}
            </div>

            {/* Event column */}
            <div className="flex-1 relative pr-4" style={{ height: totalGridHeight }}>
              {/* Grid lines */}
              {hours.map((h) => (
                <div key={h} style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} className="absolute inset-x-0 border-t border-gray-100" />
              ))}
              {hours.map((h) => (
                <div key={`half-${h}`} style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} className="absolute inset-x-0 border-t border-dashed border-gray-50" />
              ))}

              {/* Now indicator */}
              {isToday && (() => {
                const now = new Date();
                const top = topPx(now);
                if (top < 0 || top > totalGridHeight) return null;
                return (
                  <div style={{ top }} className="absolute inset-x-0 z-10 flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 -ml-1.5 shrink-0" />
                    <div className="flex-1 h-px bg-blue-500" />
                  </div>
                );
              })()}

              {/* Events */}
              {laid.map(({ event, column, totalColumns }) => {
                const start = new Date(event.startAt);
                const durationMins = eventDurationMins(event);
                const top = topPx(start);
                const height = heightPx(durationMins);
                const lightClass = categoryLight(event);
                const w = `calc(${100 / totalColumns}% - 6px)`;
                const l = `calc(${(100 / totalColumns) * column}% + 3px)`;

                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    style={{ top, height, width: w, left: l, position: 'absolute' }}
                    className={`rounded-xl px-3 py-2 text-left overflow-hidden border transition-all hover:shadow-lg hover:scale-[1.01] group ${lightClass}`}
                  >
                    <p className="text-sm font-semibold truncate leading-tight">{event.title}</p>
                    <p className="text-xs opacity-60 mt-0.5">
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {formatDuration(durationMins)}
                    </p>
                    {height > 64 && event.attendees.length > 0 && (
                      <p className="text-xs opacity-50 mt-1 truncate">
                        {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
