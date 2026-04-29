import { X, Clock, MapPin, Video, Users, List, Calendar, CheckCircle, HelpCircle, XCircle, ExternalLink } from 'lucide-react';
import type { CalendarEvent, CalendarAttendee } from '../../lib/calendar';
import { eventDurationMins, formatDuration, categoryLight } from '../../lib/calendar';

function AttendeeRow({ a }: { a: CalendarAttendee }) {
  const icon = {
    accepted: <CheckCircle size={13} className="text-green-500 shrink-0" />,
    tentative: <HelpCircle size={13} className="text-amber-500 shrink-0" />,
    declined: <XCircle size={13} className="text-red-400 shrink-0" />,
    pending: <HelpCircle size={13} className="text-gray-400 shrink-0" />,
  }[a.status];

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
        {a.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-800 truncate block">
          {a.name}
          {a.isOrganizer && <span className="ml-1.5 text-xs text-gray-400">(organizer)</span>}
        </span>
      </div>
      {icon}
    </div>
  );
}

interface Props {
  event: CalendarEvent;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: Props) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const durationMins = eventDurationMins(event);
  const lightClass = categoryLight(event);

  const dateStr = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const accepted = event.attendees.filter((a) => a.status === 'accepted').length;
  const total = event.attendees.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Color stripe */}
        <div className={`h-1.5 ${lightClass.split(' ')[0].replace('bg-', 'bg-').replace('50', '400')}`} />

        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium mb-2 ${lightClass}`}>
                {event.category}
              </span>
              <h2 className="text-lg font-semibold text-gray-900 leading-snug">{event.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {event.description && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Date / time / duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar size={15} className="text-gray-400 shrink-0" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock size={15} className="text-gray-400 shrink-0" />
              <span>{timeStr}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{formatDuration(durationMins)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <MapPin size={15} className="text-gray-400 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {event.videoLink && (
              <div className="flex items-center gap-3 text-sm">
                <Video size={15} className="text-gray-400 shrink-0" />
                <a
                  href={event.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                >
                  Join video call <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Agenda */}
          {event.agendaItems && event.agendaItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <List size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agenda</span>
              </div>
              <ol className="space-y-1.5">
                {event.agendaItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Attendees */}
          {event.attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Attendees
                </span>
                <span className="text-xs text-gray-400 ml-auto">{accepted}/{total} accepted</span>
              </div>
              <div className="space-y-2">
                {event.attendees.map((a) => (
                  <AttendeeRow key={a.email} a={a} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer action */}
        {event.videoLink && (
          <div className="px-6 py-4 border-t border-gray-100">
            <a
              href={event.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Video size={15} /> Join meeting
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
