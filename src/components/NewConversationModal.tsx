import { useState, useEffect } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { createConversation, getProfiles, type UserProfile } from '../lib/api';
import type { Conversation } from '../lib/database.types';
import { useAuth } from '../lib/auth';

interface Props {
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
}

export default function NewConversationModal({ onClose, onCreated }: Props) {
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Pre-select the current user
  const [selected, setSelected] = useState<Set<string>>(new Set(user?.id ? [user.id] : []));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .finally(() => setProfilesLoading(false));
  }, []);

  // Always keep the current user selected
  function toggleProfile(id: string) {
    if (id === user?.id) return; // can't deselect yourself
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = profiles.filter((p) =>
    p.display_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (selected.size < 2) { setError('Select at least 2 participants'); return; }
    setError('');
    setSubmitting(true);
    try {
      // Store participants as display names (consistent with how messages use author names)
      const participantNames = profiles
        .filter((p) => selected.has(p.id))
        .map((p) => p.display_name);
      const conv = await createConversation(title.trim(), 'general', participantNames, user?.id);
      onCreated(conv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Conversation</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Conversation title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 roadmap planning thread"
              autoFocus
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Participants
              <span className="ml-1.5 text-gray-400 font-normal">({selected.size} selected)</span>
            </label>

            {profilesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search accounts…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  />
                </div>

                {/* Account list */}
                <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No accounts found</p>
                  ) : (
                    filtered.map((p) => {
                      const isMe = p.id === user?.id;
                      const isSelected = selected.has(p.id);
                      const initials = p.display_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProfile(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                          } ${isMe ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.display_name}</p>
                            {isMe && (
                              <p className="text-[11px] text-gray-400">you</p>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-gray-900 border-gray-900'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {profiles.length === 0 && !profilesLoading && (
                  <p className="text-xs text-gray-400 mt-2">
                    No other accounts yet. Invite teammates to sign up.
                  </p>
                )}
              </>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || profilesLoading}
              className="flex-1 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1.5 justify-center">
                  <Loader2 size={13} className="animate-spin" /> Creating…
                </span>
              ) : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
