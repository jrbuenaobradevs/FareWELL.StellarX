"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  api,
  clearSession,
  loadStoredUser,
  saveSession,
  User,
} from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await api.me();
      setUser(u);
      const token = localStorage.getItem("farewell_token");
      if (token) saveSession(token, u);
    } catch {
      clearSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const stored = loadStoredUser();
    if (stored) {
      setUser(stored);
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, name?: string) => {
    const { user: u, token } = name
      ? await api.register({ name, email })
      : await api.login(email);
    saveSession(token, u);
    setUser(u);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
