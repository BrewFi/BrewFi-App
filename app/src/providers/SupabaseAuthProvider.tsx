"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthError,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";

interface SignInResult {
  error: AuthError | null;
}

interface SignUpResult {
  error: AuthError | null;
  needsEmailConfirmation: boolean;
}

interface SignOutResult {
  error: AuthError | null;
}

interface AuthContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<SignInResult>;
  signUp: (params: { email: string; password: string }) => Promise<SignUpResult>;
  signOut: () => Promise<SignOutResult>;
}

const SupabaseAuthContext = createContext<AuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const client = supabaseClient;

    client.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async ({
    email,
    password,
  }) => {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ?? null };
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(async ({
    email,
    password,
  }) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    return {
      error: error ?? null,
      needsEmailConfirmation: !data.session,
    };
  }, []);

  const signOut = useCallback<AuthContextValue["signOut"]>(async () => {
    const { error } = await supabaseClient.auth.signOut();
    return { error: error ?? null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase: supabaseClient,
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, signIn, signOut, signUp],
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  }
  return context;
}
