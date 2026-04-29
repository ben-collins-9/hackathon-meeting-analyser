import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { createConversation } from '../lib/api';
import type { Conversation } from '../lib/database.types';
import { useAuth } from '../lib/auth';

interface Props {
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
}

export default function NewConversationModal({ onClose, onCreated }: Props) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([profile?.display_name || '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateParticipant(index: number, value: string) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addParticipant() {
    setParticipants((prev) => [...prev, '']);
  }

  function removeParticipant(index: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    const filtered = participants.filter((p) => p.trim());
    if (filtered.length < 2) { setError('At least 2 participants required'); return; }
    setLoading(true);
    setError('');
    try {
      const conv = await createConversation(title.trim(), 'general', filtered, user?.id);
      onCreated(conv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Conversation</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Conversation title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 roadmap planning thread"
              autoFocus
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Participants</label>
            <div className="space-y-2">
              {participants.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={p}
                    onChange={(e) => updateParticipant(i, e.target.value)}
                    placeholder={`Participant ${i + 1}`}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  {participants.length > 2 && (
                    <button type="button" onClick={() => removeParticipant(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addParticipant}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Plus size={13} /> Add participant
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
