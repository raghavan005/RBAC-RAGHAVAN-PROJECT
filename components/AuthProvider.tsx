"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("accessToken");

      if (storedUser && storedToken) {
        // Persisted browser state is restored only after the hydration pass.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(storedUser) as AuthUser);
        setAccessToken(storedToken);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function setAuth(newUser: AuthUser, newToken: string) {
    setUser(newUser);
    setAccessToken(newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("accessToken", newToken);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // silently ignore — clear local state regardless
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
