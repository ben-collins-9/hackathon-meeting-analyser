import { Clock, Video, MapPin, CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '../../lib/calendar';
import { categoryColor, categoryLight, eventDurationMins, formatDuration, getTodayUpcoming, isSameDay, getEventsForDay } from '../../lib/calendar';

function MiniEventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const start = new Date(event.startAt);
  const durationMins = eventDurationMins(event);
  const dot = categoryColor(event);

  return (
    <button
      onClick={onClick}
      className="w-full text-left group px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white"
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">{event.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Clock size={11} />
              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-gray-400">{formatDuration(durationMins)}</span>
          </div>
          {event.location && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin size={10} /> {event.location}
            </span>
          )}
          {event.videoLink && !event.location && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-500 mt-0.5">
              <Video size={10} /> Video call
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MiniMonthCalendar({
  selectedDate,
  events,
  onSelectDate,
}: {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (d: Date) => void;
}) {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

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

  function prevMonth() {
    onSelectDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    onSelectDate(new Date(year, month + 1, 1));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">
          {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xs leading-none">‹</button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xs leading-none">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
        {weeks.map((week, wi) =>
          week.map((cell, di) => {
            const isToday = isSameDay(cell.date, today);
            const isSelected = isSameDay(cell.date, selectedDate);
            const hasEvents = events.some((e) => isSameDay(new Date(e.startAt), cell.date));
            return (
              <button
                key={`${wi}-${di}`}
                onClick={() => onSelectDate(new Date(cell.date))}
                className={`relative text-xs py-1 rounded-full mx-0.5 my-0.5 transition-all leading-5 w-6 h-6 flex items-center justify-center mx-auto
                  ${!cell.isCurrentMonth ? 'text-gray-300' : isSelected ? 'bg-gray-900 text-white' : isToday ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {cell.date.getDate()}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

interface Props {
  allEvents: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarSidebar({ allEvents, selectedDate, onSelectDate, onEventClick }: Props) {
  const today = new Date();
  const todayUpcoming = getTodayUpcoming(allEvents);
  const selectedDayEvents = getEventsForDay(allEvents, selectedDate);
  const isSelectedToday = isSameDay(selectedDate, today);

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-5">
      {/* Mini month calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <MiniMonthCalendar
          selectedDate={selectedDate}
          events={allEvents}
          onSelectDate={onSelectDate}
        />
      </div>

      {/* Today's upcoming */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex-1 min-h-0">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {isSelectedToday ? "Today's schedule" : selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {isSelectedToday ? (
          todayUpcoming.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CalendarDays size={18} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-400">No more meetings today</p>
              <p className="text-xs text-gray-300 mt-0.5">Enjoy the rest of your day</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-80">
              {todayUpcoming.map((e) => (
                <MiniEventCard key={e.id} event={e} onClick={() => onEventClick(e)} />
              ))}
            </div>
          )
        ) : (
          selectedDayEvents.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CalendarDays size={18} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-400">No meetings this day</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-80">
              {selectedDayEvents.map((e) => (
                <MiniEventCard key={e.id} event={e} onClick={() => onEventClick(e)} />
              ))}
            </div>
          )
        )}
      </div>
    </aside>
  );
}
