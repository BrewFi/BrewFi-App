"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";
import { useInvisibleWallet } from "@/providers/InvisibleWalletProvider";

interface SubmitState {
  error: string | null;
  success: string | null;
}

type Mode = "signup" | "signin";

export default function DappOnboardingPage() {
  const router = useRouter();
  const { signIn, signUp, session, loading: authLoading } = useSupabaseAuth();
  const {
    hydrated: walletHydrated,
    isReady: walletReady,
    walletExists,
    loading: walletLoading,
    error: walletError,
    createWallet,
  } = useInvisibleWallet();

  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    error: null,
    success: null,
  });
  const [creatingWallet, setCreatingWallet] = useState(false);

  const isBusy = useMemo(
    () => authLoading || isSubmitting || walletLoading || creatingWallet,
    [authLoading, creatingWallet, isSubmitting, walletLoading],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState({ error: null, success: null });

    if (!email || !password) {
      setSubmitState({ error: "Email and password are required", success: null });
      return;
    }

    if (mode === "signup" && password.length < 8) {
      setSubmitState({
        error: "Password must contain at least 8 characters",
        success: null,
      });
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setSubmitState({ error: "Passwords do not match", success: null });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const { error, needsEmailConfirmation } = await signUp({ email, password });
        if (error) {
          setSubmitState({ error: error.message, success: null });
        } else if (needsEmailConfirmation) {
          setSubmitState({
            error: null,
            success:
              "Check your inbox to confirm the account before continuing.",
          });
        } else {
          setSubmitState({
            error: null,
            success: "Account created! Finalising your invisible wallet...",
          });
        }
      } else {
        const { error } = await signIn({ email, password });
        if (error) {
          setSubmitState({ error: error.message, success: null });
        } else {
          setSubmitState({
            error: null,
            success: "Welcome back! Preparing your invisible wallet...",
          });
        }
      }
    } catch (err) {
      setSubmitState({
        error: (err as Error).message ?? "Authentication failed",
        success: null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!session || !walletHydrated) {
      return;
    }

    // If wallet exists and is ready, redirect to home
    if (walletReady) {
      router.replace("/dapp/home");
      return;
    }

    // If wallet exists but not ready yet, wait for it to load
    // Don't create a new wallet if one already exists
    if (walletExists) {
      // Wallet exists in DB but not fully loaded yet, wait
      return;
    }

    // Only create wallet if it doesn't exist and we're not already creating one
    if (!walletExists && !creatingWallet) {
      setCreatingWallet(true);
      createWallet()
        .then(() => {
          router.replace("/dapp/home");
        })
        .catch((err) => {
          console.error("Failed to create wallet", err);
          setSubmitState({
            error: (err as Error).message ?? "Unable to create wallet",
            success: null,
          });
          setCreatingWallet(false);
        });
    }
  }, [
    session,
    walletHydrated,
    walletReady,
    walletExists,
    creatingWallet,
    createWallet,
    router,
  ]);

  const toggleMode = () => {
    setMode((prev) => (prev === "signup" ? "signin" : "signup"));
    setSubmitState({ error: null, success: null });
  };

  return (
    <main className="min-h-screen flex flex-col pb-32 bg-black">
      <Navbar />

      <div className="flex-1 px-4 sm:px-8 pt-12 pb-6 max-w-xl mx-auto w-full space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold neon-text">
            {mode === "signup" ? "Create BrewFi Account" : "Sign In"}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            {mode === "signup"
              ? "Use your email and password to spin up an invisible wallet backed by Supabase."
              : "Welcome back! Sign in to access your custodial wallet."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="cyber-card p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm text-gray-400" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-sm text-white focus:border-cyber-blue focus:outline-none"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-sm text-white focus:border-cyber-blue focus:outline-none"
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full bg-black/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-sm text-white focus:border-cyber-blue focus:outline-none"
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {submitState.error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              {submitState.error}
            </div>
          )}

          {submitState.success && (
            <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              {submitState.success}
            </div>
          )}

          {walletError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              {walletError}
            </div>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="w-full px-4 py-3 rounded-lg bg-cyber-blue text-black font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            {isBusy
              ? "Working..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>

          <div className="text-center text-xs text-gray-500">
            {mode === "signup"
              ? "Already have an account?"
              : "Need to set up a BrewFi account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-cyber-blue hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </div>
        </form>
      </div>

      <BottomNav />
    </main>
  );
}
