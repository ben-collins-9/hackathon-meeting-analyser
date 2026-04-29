import { MessageSquare, CalendarCheck, AlertTriangle, TrendingDown } from 'lucide-react';
import type { Conversation, MeetingProposal } from '../lib/database.types';

interface Props {
  conversations: Conversation[];
  proposals: MeetingProposal[];
}

export default function StatsBar({ conversations, proposals }: Props) {
  const pending = proposals.filter((p) => p.status === 'pending').length;
  const scheduled = proposals.filter((p) => p.status === 'scheduled').length;
  const highUrgency = proposals.filter((p) => p.urgency === 'high' && p.status === 'pending').length;
  const declined = proposals.filter((p) => p.status === 'declined').length;

  const stats = [
    { label: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Pending review', value: pending, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Scheduled', value: scheduled, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Saved meetings', value: declined, icon: TrendingDown, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  if (highUrgency > 0) {
    stats[1].value = pending;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <Icon size={16} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
