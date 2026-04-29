import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown, X, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function UserMenu() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function startEdit() {
    setDisplayName(profile?.display_name ?? '');
    setSaveError('');
    setEditing(true);
  }

  async function handleSave() {
    if (!displayName.trim()) { setSaveError('Name required'); return; }
    setSaving(true);
    setSaveError('');
    const err = await updateProfile({ display_name: displayName.trim() });
    setSaving(false);
    if (err) { setSaveError(err); return; }
    setEditing(false);
  }

  const initials = (profile?.display_name || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen((v) => !v); setEditing(false); }}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
          {profile?.display_name || user?.email}
        </span>
        <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile?.display_name || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Edit profile */}
          {editing ? (
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Edit display name</p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus
                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 mb-2"
              />
              {saveError && <p className="text-xs text-red-500 mb-2">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={11} />}
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <Settings size={14} className="text-gray-400" />
              Edit profile
            </button>
          )}

          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={14} className="text-gray-400" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
