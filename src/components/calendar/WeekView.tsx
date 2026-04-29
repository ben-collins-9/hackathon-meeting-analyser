import { useRef, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '../../lib/calendar';
import { isSameDay, categoryColor, categoryLight, addDays, startOfWeek, eventDurationMins, formatDuration } from '../../lib/calendar';

const HOUR_HEIGHT = 56; // px per hour
const START_HOUR = 7;
const END_HOUR = 21;
const VISIBLE_HOURS = END_HOUR - START_HOUR;

function topPct(date: Date): number {
  const mins = (date.getHours() - START_HOUR) * 60 + date.getMinutes();
  return Math.max(0, mins) * (HOUR_HEIGHT / 60);
}

function heightPx(durationMins: number): number {
  return Math.max(22, durationMins * (HOUR_HEIGHT / 60));
}

interface EventBlockProps {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
  onClick: () => void;
}

function EventBlock({ event, column, totalColumns, onClick }: EventBlockProps) {
  const start = new Date(event.startAt);
  const durationMins = eventDurationMins(event);
  const top = topPct(start);
  const height = heightPx(durationMins);
  const lightClass = categoryLight(event);
  const width = `calc(${100 / totalColumns}% - 4px)`;
  const left = `calc(${(100 / totalColumns) * column}% + 2px)`;

  return (
    <button
      onClick={onClick}
      style={{ top, height, width, left, position: 'absolute' }}
      className={`rounded-lg px-2 py-1 text-left overflow-hidden border transition-all hover:shadow-md hover:scale-[1.01] group ${lightClass}`}
    >
      <p className="text-xs font-semibold truncate leading-tight">{event.title}</p>
      {height > 36 && (
        <p className="text-xs opacity-70 mt-0.5">
          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {formatDuration(durationMins)}
        </p>
      )}
    </button>
  );
}

function layoutEventsForDay(events: CalendarEvent[]): { event: CalendarEvent; column: number; totalColumns: number }[] {
  if (events.length === 0) return [];

  // Simple overlap detection
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const groups: CalendarEvent[][] = [];

  for (const event of sorted) {
    const eStart = new Date(event.startAt).getTime();
    const eEnd = new Date(event.endAt).getTime();
    let placed = false;
    for (const group of groups) {
      const lastEnd = Math.max(...group.map((e) => new Date(e.endAt).getTime()));
      if (eStart >= lastEnd) {
        group.push(event);
        placed = true;
        break;
      }
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
  weekStart: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}

export default function WeekView({ weekStart, events, selectedDate, onEventClick, onSelectDate }: Props) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
    }
  }, []);

  const hours = Array.from({ length: VISIBLE_HOURS }, (_, i) => START_HOUR + i);

  const totalGridHeight = VISIBLE_HOURS * HOUR_HEIGHT;

  const hasAnyEvent = events.length > 0;

  return (
    <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Day headers */}
      <div className="flex border-b border-gray-100 shrink-0">
        <div className="w-14 shrink-0" />
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <div
              key={i}
              onClick={() => onSelectDate(new Date(day))}
              className="flex-1 py-2.5 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs text-gray-400 uppercase font-medium block">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span
                className={`w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center mx-auto mt-0.5 transition-colors
                  ${isSelected ? 'bg-gray-900 text-white' : isToday ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasAnyEvent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-16">
            <CalendarDays size={32} className="text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No events this week</p>
          </div>
        )}
        <div className="flex" style={{ minHeight: totalGridHeight }}>
          {/* Hour labels */}
          <div className="w-14 shrink-0 relative" style={{ height: totalGridHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                className="absolute right-2 text-xs text-gray-400 -translate-y-2"
              >
                {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            const dayEvents = events
              .filter((e) => isSameDay(new Date(e.startAt), day))
              .filter((e) => {
                const h = new Date(e.startAt).getHours();
                return h >= START_HOUR && h < END_HOUR;
              });
            const laid = layoutEventsForDay(dayEvents);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={di}
                className={`flex-1 relative border-l border-gray-100 ${isToday ? 'bg-blue-50/30' : ''}`}
                style={{ height: totalGridHeight }}
              >
                {/* Hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    className="absolute inset-x-0 border-t border-gray-100"
                  />
                ))}
                {/* Half-hour lines */}
                {hours.map((h) => (
                  <div
                    key={`half-${h}`}
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    className="absolute inset-x-0 border-t border-dashed border-gray-50"
                  />
                ))}

                {/* Current time indicator */}
                {isToday && (() => {
                  const now = new Date();
                  const top = topPct(now);
                  if (top < 0 || top > totalGridHeight) return null;
                  return (
                    <div style={{ top }} className="absolute inset-x-0 z-10 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 -ml-1 shrink-0" />
                      <div className="flex-1 h-px bg-blue-500" />
                    </div>
                  );
                })()}

                {/* Events */}
                {laid.map(({ event, column, totalColumns }) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    column={column}
                    totalColumns={totalColumns}
                    onClick={() => onEventClick(event)}
                  />
                ))}

                {/* Empty day state */}
                {dayEvents.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-xs text-gray-300">Free</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
