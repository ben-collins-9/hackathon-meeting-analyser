import { useState } from 'react';
import { Plus, Send, Trash2, Zap, ChevronDown, ChevronUp, Users, Tag, Save, CheckCircle2 } from 'lucide-react';
import type { Conversation, Message } from '../lib/database.types';
import type { AnalysisResult } from '../lib/analyzer';
import { addMessage, analyzeConversation, deleteConversation, saveLocalProposal } from '../lib/api';

const PLATFORM_COLORS: Record<string, string> = {
  slack: 'bg-emerald-100 text-emerald-700',
  email: 'bg-sky-100 text-sky-700',
  github: 'bg-gray-100 text-gray-700',
  jira: 'bg-blue-100 text-blue-700',
  discord: 'bg-violet-100 text-violet-700',
  teams: 'bg-teal-100 text-teal-700',
};

const SIGNAL_CATEGORY_COLORS: Record<string, string> = {
  blocker: 'bg-red-100 text-red-700 border-red-200',
  conflict: 'bg-orange-100 text-orange-700 border-orange-200',
  decision: 'bg-amber-100 text-amber-700 border-amber-200',
  confusion: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  urgency: 'bg-rose-100 text-rose-700 border-rose-200',
  frustration: 'bg-pink-100 text-pink-700 border-pink-200',
};

interface LocalResult {
  needs_meeting: boolean;
  summary: string;
  analysis?: AnalysisResult;
  source: 'edge' | 'local';
  saved?: boolean;
}

interface Props {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  onNewConversation: () => void;
  onMessageAdded: (conversationId: string, msg: Message) => void;
  onAnalysisComplete: () => void;
  onConversationDeleted: (id: string) => void;
}

export default function ConversationPanel({
  conversations,
  messages,
  onNewConversation,
  onMessageAdded,
  onAnalysisComplete,
  onConversationDeleted,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [composing, setComposing] = useState<Record<string, { author: string; content: string }>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, LocalResult>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function setCompose(id: string, field: 'author' | 'content', value: string) {
    setComposing((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSend(conv: Conversation) {
    const c = composing[conv.id];
    if (!c?.author?.trim() || !c?.content?.trim()) return;
    const msg = await addMessage(conv.id, c.author.trim(), c.content.trim());
    onMessageAdded(conv.id, msg);
    setComposing((prev) => ({ ...prev, [conv.id]: { author: c.author, content: '' } }));
  }

  async function handleAnalyze(conv: Conversation) {
    const msgs = messages[conv.id] ?? [];
    if (msgs.length === 0) return;
    setAnalyzing(conv.id);
    try {
      const result = await analyzeConversation(conv, msgs);
      setResults((prev) => ({
        ...prev,
        [conv.id]: {
          needs_meeting: result.needs_meeting,
          summary: result.needs_meeting ? (result.proposal?.summary ?? result.analysis?.summary ?? '') : (result.summary ?? result.analysis?.summary ?? ''),
          analysis: result.analysis,
          source: result.source,
          saved: result.source === 'edge' && result.needs_meeting,
        },
      }));
      if (result.source === 'edge') onAnalysisComplete();
    } finally {
      setAnalyzing(null);
    }
  }

  async function handleSaveProposal(convId: string) {
    const r = results[convId];
    if (!r?.analysis) return;
    setSaving(convId);
    try {
      await saveLocalProposal(convId, r.analysis);
      setResults((prev) => ({ ...prev, [convId]: { ...prev[convId], saved: true } }));
      onAnalysisComplete();
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    onConversationDeleted(id);
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Users size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm mb-4">No conversations yet.</p>
        <button
          onClick={onNewConversation}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} /> Add first conversation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => {
        const msgs = messages[conv.id] ?? [];
        const isExpanded = expanded === conv.id;
        const result = results[conv.id];
        const platformColor = PLATFORM_COLORS[conv.platform] ?? 'bg-gray-100 text-gray-700';
        const participants = conv.participants as string[];
        const analysis = result?.analysis;

        return (
          <div key={conv.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              onClick={() => toggleExpand(conv.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm truncate">{conv.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platformColor}`}>
                    {conv.platform}
                  </span>
                  {msgs.length > 0 && (
                    <span className="text-xs text-gray-400">{msgs.length} message{msgs.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {participants.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{participants.join(', ')}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {result && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.needs_meeting ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {result.needs_meeting ? 'Meeting needed' : 'Async OK'}
                  </span>
                )}
                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </div>

            {/* Analysis result banner */}
            {result && isExpanded && (
              <div className={`mx-4 mb-1 rounded-lg text-xs overflow-hidden border ${result.needs_meeting ? 'border-amber-200' : 'border-green-200'}`}>
                <div className={`px-3 py-2 ${result.needs_meeting ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="leading-relaxed">{result.summary}</p>
                    {result.source === 'local' && (
                      <span className="shrink-0 text-xs bg-white border border-gray-200 text-gray-500 rounded px-1.5 py-0.5 font-mono">local</span>
                    )}
                  </div>

                  {/* Signal chips */}
                  {analysis && analysis.triggered_signals.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {analysis.triggered_signals.map((s) => (
                        <span
                          key={s.category}
                          title={`Matched: ${s.matches.slice(0, 5).join(', ')}`}
                          className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium ${SIGNAL_CATEGORY_COLORS[s.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                        >
                          <Tag size={8} />
                          {s.label} ×{s.count}
                        </span>
                      ))}
                      {analysis.async_ok_signals.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium bg-green-100 text-green-700 border-green-200">
                          <Tag size={8} />
                          Async progress ×{analysis.async_ok_signals[0].count}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Score + confidence */}
                  {analysis && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs opacity-70">Score: <strong>{analysis.score}</strong></span>
                      <span className="text-xs opacity-70">Confidence: <strong>{analysis.confidence}</strong></span>
                    </div>
                  )}
                </div>

                {/* Save prompt for local results */}
                {result.source === 'local' && result.needs_meeting && !result.saved && (
                  <div className="bg-white border-t border-amber-100 px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Analyzed locally — save this proposal?</span>
                    <button
                      onClick={() => handleSaveProposal(conv.id)}
                      disabled={saving === conv.id}
                      className="inline-flex items-center gap-1 text-xs bg-gray-900 text-white px-2.5 py-1 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {saving === conv.id ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={11} />
                      )}
                      Save proposal
                    </button>
                  </div>
                )}

                {result.saved && result.needs_meeting && (
                  <div className="bg-white border-t border-green-100 px-3 py-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-xs text-green-700">Proposal saved — view in Meeting Proposals tab</span>
                  </div>
                )}
              </div>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-gray-100 mt-3">
                {/* Messages */}
                <div className="px-4 py-3 max-h-72 overflow-y-auto space-y-2 bg-gray-50">
                  {msgs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No messages yet. Add some below.</p>
                  ) : (
                    msgs.map((m) => (
                      <div key={m.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 mt-0.5">
                          {m.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-gray-700">{m.author}</span>
                            <span className="text-xs text-gray-400">{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Compose */}
                <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={composing[conv.id]?.author ?? ''}
                      onChange={(e) => setCompose(conv.id, 'author', e.target.value)}
                      className="w-28 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <input
                      type="text"
                      placeholder="Type a message…"
                      value={composing[conv.id]?.content ?? ''}
                      onChange={(e) => setCompose(conv.id, 'content', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSend(conv); }}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                      onClick={() => handleSend(conv)}
                      className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                    <button
                      onClick={() => handleAnalyze(conv)}
                      disabled={msgs.length === 0 || analyzing === conv.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {analyzing === conv.id ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <Zap size={12} /> Analyze for meeting
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
