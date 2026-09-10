import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiUser, getToken, setToken } from "@/lib/api";
import { authApi } from "@/lib/backend";

type AuthContextType = {
  user: ApiUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data: ApiUser | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; data: ApiUser | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (patch: Partial<Pick<ApiUser, "full_name" | "avatar_url" | "theme">> & { allow_learning?: boolean }) => Promise<ApiUser>;
  changePassword: (current: string, next: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function applyTheme(theme: string) {
  try {
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    localStorage.setItem("theme", theme);
  } catch {
    /* no-op */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const { user: me } = await authApi.me();
      setUser(me);
      applyTheme(me.theme || "light");
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { token, user: u } = await authApi.signIn(email, password);
      setToken(token);
      setUser(u);
      applyTheme(u.theme || "light");
      return { error: null, data: u };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const { token, user: u } = await authApi.signUp(email, password, fullName);
      setToken(token);
      setUser(u);
      applyTheme(u.theme || "light");
      return { error: null, data: u };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      /* best effort */
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateUser = useCallback(
    async (patch: Parameters<typeof authApi.updateMe>[0]) => {
      const { user: updated } = await authApi.updateMe(patch);
      setUser(updated);
      if (patch.theme) applyTheme(patch.theme);
      return updated;
    },
    [],
  );

  const changePassword = useCallback(async (current: string, next: string) => {
    try {
      const { token } = await authApi.changePassword(current, next);
      setToken(token);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await authApi.deleteAccount();
      setToken(null);
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refresh,
    updateUser,
    changePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
