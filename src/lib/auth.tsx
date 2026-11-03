import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone_last4: string | null;
  preferred_version: string | null;
  is_super_admin: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<string | null>;  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_ERROR_MESSAGE = 'Profil Anda belum bisa dimuat. Periksa koneksi lalu coba lagi.';
const SIGN_OUT_ERROR_MESSAGE = 'Gagal keluar dari akun. Silakan coba lagi.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(supabase));
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, phone_last4, preferred_version, is_super_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Gagal memuat profil:', error.message);
      setProfile(null);
      setProfileError(PROFILE_ERROR_MESSAGE);
      return;
    }

    setProfile((data as Profile | null) ?? null);
    setProfileError(null);
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    await fetchProfile(userId);
  }, [fetchProfile, session]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;
    let active = true;

    const init = async () => {
      const { data, error } = await client.auth.getSession();
      if (!active) return;

      if (error) {
        console.error('Gagal memuat sesi:', error.message);
        setSession(null);
        setLoading(false);
        return;
      }

      const current = data.session ?? null;
      setSession(current);
      if (current) {
        await fetchProfile(current.user.id);
      }
      if (active) setLoading(false);
    };

    void init();

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession) {
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async (): Promise<string | null> => {
    if (!supabase) return null;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Gagal keluar:', error.message);
      return SIGN_OUT_ERROR_MESSAGE;
    }
    setProfile(null);
    setProfileError(null);
    return null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileError,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, profileError, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return context;
}
