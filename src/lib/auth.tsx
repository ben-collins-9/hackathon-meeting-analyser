import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  updateProfile: (fields: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => { await fetchProfile(session.user.id); })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }

  async function signUp(email: string, password: string, displayName: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return error.message;
    // Upsert profile row immediately (trigger may lag)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName || email.split('@')[0],
      });
    }
    return null;
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string): Promise<string | null> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? error.message : null;
  }

  async function updateProfile(fields: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>): Promise<string | null> {
    if (!user) return 'Not signed in';
    const { error } = await supabase
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) return error.message;
    setProfile((prev) => prev ? { ...prev, ...fields } : prev);
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
