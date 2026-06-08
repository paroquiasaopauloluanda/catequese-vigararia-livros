import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Session } from '../types';
import { callApi } from '../api/sheets';

interface AuthContextValue {
  session:  Session | null;
  login:    (username: string, password: string) => Promise<void>;
  logout:   () => void;
  isAdmin:  boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY   = 'catequese_session';
const SESSION_TTL   = 24 * 60 * 60 * 1000; // 24 h

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s: Session = JSON.parse(raw);
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const login = useCallback(async (username: string, password: string) => {
    const res = await callApi('auth', { username, password }) as {
      success: boolean; userId: string; token: string;
      username: string; displayName: string; role: 'admin' | 'parish'; parishId: string | null;
    };

    const s: Session = {
      userId:      res.userId,
      token:       res.token,
      username:    res.username,
      displayName: res.displayName,
      role:        res.role,
      parishId:    res.parishId,
      expiresAt:   Date.now() + SESSION_TTL,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, logout, isAdmin: session?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}