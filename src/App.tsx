import { useEffect, useState, useCallback } from 'react';
import { Plus, Zap, BellRing } from 'lucide-react';
import type { Conversation, Message, MeetingProposal } from './lib/database.types';
import { getConversations, getMessages, getMeetingProposals, updateProposalStatus } from './lib/api';
import ConversationPanel from './components/ConversationPanel';
import NewConversationModal from './components/NewConversationModal';
import MeetingProposalCard from './components/MeetingProposalCard';
import StatsBar from './components/StatsBar';

type Tab = 'conversations' | 'proposals';

export default function App() {
  const [tab, setTab] = useState<Tab>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [proposals, setProposals] = useState<MeetingProposal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { loadData(); }, [loadData]);

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
    if (updated.some((p) => p.status === 'pending')) setTab('proposals');
  }

  function handleConversationDeleted(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setMessages((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  function handleProposalUpdated(updated: MeetingProposal) {
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  const pendingCount = proposals.filter((p) => p.status === 'pending').length;
  const highUrgencyPending = proposals.filter((p) => p.status === 'pending' && p.urgency === 'high').length;

  const sortedProposals = [...proposals].sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { pending: 0, accepted: 1, scheduled: 2, declined: 3 };
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">MeetDetect</span>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">async-first communication analyzer</span>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={13} /> New conversation
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        {!loading && <StatsBar conversations={conversations} proposals={proposals} />}

        {/* High urgency alert */}
        {highUrgencyPending > 0 && (
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
        <div className="flex border-b border-gray-200">
          {(['conversations', 'proposals'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === t ? 'text-gray-900 border-b-2 border-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'conversations' ? 'Conversations' : 'Meeting Proposals'}
              {t === 'proposals' && pendingCount > 0 && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
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
                {sortedProposals.filter((p) => p.status !== 'pending').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-6">Resolved</p>
                    <div className="space-y-3">
                      {sortedProposals.filter((p) => p.status !== 'pending').map((p) => (
                        <MeetingProposalCard key={p.id} proposal={p} onUpdated={handleProposalUpdated} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <NewConversationModal
          onClose={() => setShowModal(false)}
          onCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}
