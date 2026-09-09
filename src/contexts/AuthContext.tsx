import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { ApiError, apiGet, apiPost, isApiConfigured, toDemoCompatibleUser, type ApiUser, type MeResponse } from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

const DEMO_SESSION_KEY = "promptgineer-demo-session";

const demoUser = {
  id: "demo-user",
  email: "alex@promptgineer.dev",
  user_metadata: { full_name: "Alex Morgan", avatar_url: "" },
  app_metadata: { role: "user" },
} as unknown as User;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data: Session | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null; data: User | null }>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
  resetPassword: (email: string) => Promise<{ error: Error | null; data: Record<string, never> | null }>;
  completePasswordReset: (token: string, password: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function asClientUser(user: ApiUser): User {
  return toDemoCompatibleUser(user) as unknown as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      if (window.localStorage.getItem(DEMO_SESSION_KEY) === "true") {
        if (mounted) {
          setUser(demoUser);
          setIsDemo(true);
          setLoading(false);
        }
        return;
      }

      if (isApiConfigured) {
        try {
          const response = await apiGet<MeResponse>("/me");
          if (mounted) setUser(asClientUser(response.user));
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401)) {
            console.warn("Unable to restore the Prompt-Gineer API session", error);
          }
        } finally {
          if (mounted) setLoading(false);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.warn("Unable to restore the legacy remote session", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void getSession();

    if (isApiConfigured || !isSupabaseConfigured) return () => { mounted = false; };

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isApiConfigured) {
      try {
        const response = await apiPost<{ user: ApiUser }>("/auth/login", { email, password });
        const nextUser = asClientUser(response.user);
        setUser(nextUser);
        setIsDemo(false);
        return { error: null, data: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error("Unable to sign in"), data: null };
      }
    }
    if (!isSupabaseConfigured) return { error: new Error("Remote authentication is not configured. Open the demo workspace instead."), data: null };
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      if (response.error) return { error: response.error, data: null };
      return { error: null, data: response.data.session };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Unable to sign in"), data: null };
    }
  };

  const signUp = async (email: string, password: string, metadata: Record<string, unknown> = {}) => {
    if (isApiConfigured) {
      try {
        const response = await apiPost<{ user: ApiUser; requiresEmailVerification?: boolean }>("/auth/register", {
          email,
          password,
          fullName: metadata.fullName ?? metadata.full_name ?? "",
        });
        if (!response.requiresEmailVerification) {
          const nextUser = asClientUser(response.user);
          setUser(nextUser);
          setIsDemo(false);
          return { error: null, data: nextUser };
        }
        return { error: null, data: asClientUser(response.user) };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error("Unable to create account"), data: null };
      }
    }
    if (!isSupabaseConfigured) return { error: new Error("Remote authentication is not configured. Open the demo workspace instead."), data: null };
    try {
      const response = await supabase.auth.signUp({ email, password, options: { data: metadata } });
      if (response.error) return { error: response.error, data: null };
      return { error: null, data: response.data.user };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Unable to create account"), data: null };
    }
  };

  const signOut = async () => {
    if (isDemo) {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setSession(null);
      setIsDemo(false);
      return;
    }
    if (isApiConfigured) {
      try {
        await apiPost("/auth/logout");
      } finally {
        setSession(null);
        setUser(null);
      }
      return;
    }
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const enterDemo = () => {
    window.localStorage.setItem(DEMO_SESSION_KEY, "true");
    setUser(demoUser);
    setSession(null);
    setIsDemo(true);
  };

  const resetPassword = async (email: string) => {
    if (isApiConfigured) {
      try {
        await apiPost("/auth/forgot-password", { email });
        return { error: null, data: {} };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error("Unable to send reset email"), data: null };
      }
    }
    if (!isSupabaseConfigured) return { error: new Error("Remote authentication is not configured."), data: null };
    try {
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=1`,
      });
      if (response.error) return { error: response.error, data: null };
      return { error: null, data: {} };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Unable to send reset email"), data: null };
    }
  };

  const completePasswordReset = async (token: string, password: string) => {
    if (!isApiConfigured) return { error: new Error("Password reset requires the Prompt-Gineer API.") };
    try {
      await apiPost("/auth/reset-password", { token, password });
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Unable to reset password") };
    }
  };

  const refreshSession = async () => {
    if (isApiConfigured) {
      try {
        const response = await apiGet<MeResponse>("/me");
        setUser(asClientUser(response.user));
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
        setUser(null);
      }
    } else if (isSupabaseConfigured) {
      const response = await supabase.auth.getUser();
      setUser(response.data.user ?? null);
    }
  };

  const value = { session, user, loading, isDemo, signIn, signUp, signOut, enterDemo, resetPassword, completePasswordReset, refreshSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
