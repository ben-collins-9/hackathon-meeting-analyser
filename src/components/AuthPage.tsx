import { useState } from 'react';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

type Screen = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const [screen, setScreen] = useState<Screen>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();

  function reset() {
    setError('');
    setResetSent(false);
    setPassword('');
  }

  function switchScreen(s: Screen) {
    reset();
    setScreen(s);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (screen === 'signin') {
        const err = await signIn(email, password);
        if (err) setError(err);
      } else if (screen === 'signup') {
        if (!displayName.trim()) { setError('Display name is required'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        const err = await signUp(email, password, displayName.trim());
        if (err) setError(err);
      } else {
        const err = await resetPassword(email);
        if (err) setError(err);
        else setResetSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">MeetDetect</h1>
          <p className="text-sm text-gray-500 mt-1">async-first communication analyzer</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab switcher (sign in / sign up) */}
          {screen !== 'reset' && (
            <div className="flex border-b border-gray-100">
              {(['signin', 'signup'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => switchScreen(s)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    screen === s
                      ? 'text-gray-900 border-b-2 border-gray-900 -mb-px bg-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {s === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          <div className="px-6 py-6">
            {/* Password reset success */}
            {resetSent ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Check your email</p>
                  <p className="text-xs text-gray-500 mt-1">
                    We sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <button
                  onClick={() => switchScreen('signin')}
                  className="text-xs text-gray-500 hover:text-gray-800 underline mt-1"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {screen === 'reset' && (
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={() => switchScreen('signin')}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      ← Back to sign in
                    </button>
                    <p className="text-sm font-medium text-gray-900 mt-2">Reset your password</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your email and we'll send you a reset link.
                    </p>
                  </div>
                )}

                {/* Display name (signup only) */}
                {screen === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Display name
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                {screen !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-700">Password</label>
                      {screen === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchScreen('reset')}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={screen === 'signup' ? 'At least 6 characters' : '••••••••'}
                        autoComplete={screen === 'signup' ? 'new-password' : 'current-password'}
                        required
                        className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors mt-1"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {screen === 'signin' ? 'Sign in' : screen === 'signup' ? 'Create account' : 'Send reset link'}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your data is private and protected.
        </p>
      </div>
    </div>
  );
}
