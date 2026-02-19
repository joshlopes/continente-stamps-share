import { useState, useEffect, useCallback } from 'react';
import type { Profile } from '@stamps-share/shared';
import { api } from '../api/client';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ profile: null, loading: true });

  const fetchProfile = useCallback(async () => {
    try {
      const { profile } = await api.getMe();
      setState({ profile, loading: false });
    } catch {
      api.setToken(null);
      setState({ profile: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      fetchProfile();
    } else {
      setState({ profile: null, loading: false });
    }
  }, [fetchProfile]);

  const sendOtp = useCallback(async (phone: string) => {
    return api.sendOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const data = await api.verifyOtp(phone, code);
    api.setToken(data.token);
    setState({ profile: data.profile, loading: false });
    return data;
  }, []);

  const signOut = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    api.setToken(null);
    setState({ profile: null, loading: false });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    const { profile } = await api.updateProfile(updates as any);
    setState((prev) => ({ ...prev, profile }));
    return profile;
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { profile } = await api.getMe();
      setState((prev) => ({ ...prev, profile }));
    } catch { /* ignore */ }
  }, []);

  return {
    ...state,
    isAuthenticated: !!state.profile,
    sendOtp,
    verifyOtp,
    signOut,
    updateProfile,
    refreshProfile,
  };
}
