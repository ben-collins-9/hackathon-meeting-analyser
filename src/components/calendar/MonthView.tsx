import { CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '../../lib/calendar';
import { isSameDay, categoryColor, getEventsForDay } from '../../lib/calendar';

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onSelect: () => void;
  onEventClick: (e: CalendarEvent) => void;
}

function DayCell({ date, isCurrentMonth, isToday, isSelected, events, onSelect, onEventClick }: DayCellProps) {
  const MAX_VISIBLE = 3;
  const overflow = events.length - MAX_VISIBLE;

  return (
    <div
      onClick={onSelect}
      className={`min-h-[96px] p-1.5 border-b border-r border-gray-100 cursor-pointer transition-colors group
        ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}
      `}
    >
      <div className="flex items-center justify-end mb-1 pr-0.5">
        <span
          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium transition-colors
            ${isSelected ? 'bg-gray-900 text-white' : isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-gray-700 group-hover:bg-gray-100' : 'text-gray-300'}
          `}
        >
          {date.getDate()}
        </span>
      </div>

      {events.length === 0 && isCurrentMonth && (
        <div />
      )}

      <div className="space-y-0.5">
        {events.slice(0, MAX_VISIBLE).map((e) => {
          const dot = categoryColor(e);
          const start = new Date(e.startAt);
          return (
            <button
              key={e.id}
              onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
              className={`w-full text-left flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity ${dot.replace('bg-', 'bg-opacity-10 bg-')} group/event`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
              <span className="truncate text-gray-700 font-medium text-xs">
                {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {e.title}
              </span>
            </button>
          );
        })}
        {overflow > 0 && (
          <button
            onClick={(ev) => { ev.stopPropagation(); onSelect(); }}
            className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 transition-colors"
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}

export default function MonthView({ year, month, events, selectedDate, onSelectDate, onEventClick }: Props) {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((cell, di) => (
              <DayCell
                key={`${wi}-${di}`}
                date={cell.date}
                isCurrentMonth={cell.isCurrentMonth}
                isToday={isSameDay(cell.date, today)}
                isSelected={isSameDay(cell.date, selectedDate)}
                events={getEventsForDay(events, cell.date)}
                onSelect={() => onSelectDate(new Date(cell.date))}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Empty state when no events exist in month */}
      {events.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <CalendarDays size={36} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No events this month</p>
        </div>
      )}
    </div>
  );
}
