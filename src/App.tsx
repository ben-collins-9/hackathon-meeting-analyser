import { useEffect, useState, useCallback } from 'react';
import { Plus, Zap, BellRing, CalendarDays, BarChart2 } from 'lucide-react';
import type { Conversation, Message, MeetingProposal } from './lib/database.types';
import { getConversations, getMessages, getMeetingProposals, updateProposalStatus } from './lib/api';
import { useAuth } from './lib/auth';
import ConversationPanel from './components/ConversationPanel';
import NewConversationModal from './components/NewConversationModal';
import MeetingProposalCard from './components/MeetingProposalCard';
import StatsBar from './components/StatsBar';
import CalendarPage from './components/calendar/CalendarPage';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import AuthPage from './components/AuthPage';
import UserMenu from './components/UserMenu';

type Tab = 'conversations' | 'proposals' | 'calendar' | 'analytics';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [proposals, setProposals] = useState<MeetingProposal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    const [convs, props] = await Promise.all([getConversations(), getMeetingProposals()]);
    setConversations(convs);
    setProposals(props);

    const msgMap: Record<string, Message[]> = {};
    await Promise.all(
      convs.map(async (c) => {
        msgMap[c.id] = await getMessages(c.id);
      })
    );
    setMessages(msgMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadData();
    }
  }, [user, loadData]);

  // Show full-page spinner while session is being restored
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  function handleConversationCreated(conv: Conversation) {
    setConversations((prev) => [conv, ...prev]);
    setMessages((prev) => ({ ...prev, [conv.id]: [] }));
    setShowModal(false);
  }

  function handleMessageAdded(conversationId: string, msg: Message) {
    setMessages((prev) => ({ ...prev, [conversationId]: [...(prev[conversationId] ?? []), msg] }));
  }

  async function handleAnalysisComplete() {
    const updated = await getMeetingProposals();
    setProposals(updated);
  }

  function handleConversationDeleted(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setMessages((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  function handleProposalUpdated(updated: MeetingProposal) {
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (updated.status === 'scheduled') {
      setCalendarRefreshKey((k) => k + 1);
    }
  }

  const pendingCount = proposals.filter((p) => p.status === 'pending').length;
  const highUrgencyPending = proposals.filter((p) => p.status === 'pending' && p.urgency === 'high').length;

  const sortedProposals = [...proposals].sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { pending: 0, accepted: 1, scheduled: 2, declined: 3 };
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  const NAV_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'conversations', label: 'Conversations', icon: <Zap size={14} /> },
    { id: 'proposals', label: 'Meeting Proposals', icon: <BellRing size={14} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={14} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} /> },
  ];

  return (
    <div className={`min-h-screen bg-gray-50 font-sans ${tab === 'calendar' ? 'flex flex-col' : ''}`}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">MeetDetect</span>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">async-first communication analyzer</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tab !== 'calendar' && tab !== 'analytics' && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus size={13} /> New conversation
              </button>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${tab === 'calendar' ? 'flex-1 flex flex-col min-h-0 pb-4' : 'py-6 space-y-6'}`}>
        {/* Stats */}
        {!loading && tab !== 'calendar' && tab !== 'analytics' && (
          <StatsBar conversations={conversations} proposals={proposals} />
        )}

        {/* High urgency alert */}
        {highUrgencyPending > 0 && tab !== 'calendar' && tab !== 'analytics' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <BellRing size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                {highUrgencyPending} high-urgency meeting{highUrgencyPending !== 1 ? 's' : ''} need attention
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                These conversations have critical blockers that require immediate synchronous discussion.
              </p>
            </div>
            <button
              onClick={() => setTab('proposals')}
              className="ml-auto text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors shrink-0"
            >
              Review
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex border-b border-gray-200 ${tab === 'calendar' ? 'shrink-0' : ''}`}>
          {NAV_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'calendar' && tab !== 'calendar') {
                  setCalendarRefreshKey((k) => k + 1);
                }
                setTab(t.id);
              }}
              className={`relative inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id ? 'text-gray-900 border-b-2 border-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'proposals' && pendingCount > 0 && (
                <span className="ml-1 text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && tab !== 'calendar' && tab !== 'analytics' ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : tab === 'calendar' ? (
          <div className="flex-1 min-h-0 pt-4" style={{ height: 'calc(100vh - 160px)' }}>
            <CalendarPage refreshKey={calendarRefreshKey} />
          </div>
        ) : tab === 'analytics' ? (
          <AnalyticsDashboard conversations={conversations} proposals={proposals} />
        ) : tab === 'conversations' ? (
          <ConversationPanel
            conversations={conversations}
            messages={messages}
            onNewConversation={() => setShowModal(true)}
            onMessageAdded={handleMessageAdded}
            onAnalysisComplete={handleAnalysisComplete}
            onConversationDeleted={handleConversationDeleted}
          />
        ) : (
          <div className="space-y-3">
            {sortedProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Zap size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No meeting proposals yet.</p>
                <p className="text-gray-400 text-xs mt-1">Analyze a conversation thread to detect when a meeting is needed.</p>
              </div>
            ) : (
              <>
                {sortedProposals.filter((p) => p.status === 'pending').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pending Review</p>
                    <div className="space-y-3">
                      {sortedProposals.filter((p) => p.status === 'pending').map((p) => (
                        <MeetingProposalCard key={p.id} proposal={p} onUpdated={handleProposalUpdated} />
                      ))}
                    </div>
                  </div>
                )}
                {sortedProposals.filter((p) => p.status === 'scheduled').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-6">Scheduled</p>
                    <div className="space-y-3">
                      {sortedProposals.filter((p) => p.status === 'scheduled').map((p) => (
                        <MeetingProposalCard key={p.id} proposal={p} onUpdated={handleProposalUpdated} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <NewConversationModal
          onClose={() => setShowModal(false)}
          onCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}
