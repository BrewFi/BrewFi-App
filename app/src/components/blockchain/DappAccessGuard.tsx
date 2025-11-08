"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";
import { useInvisibleWallet } from "@/providers/InvisibleWalletProvider";

const ONBOARDING_PATH = "/onboarding";
const HOME_PATH = "/home";

interface DappAccessGuardProps {
  children: React.ReactNode;
}

export function DappAccessGuard({ children }: DappAccessGuardProps) {
  const { session, loading: authLoading } = useSupabaseAuth();
  const { hydrated: walletHydrated, isReady: walletReady } = useInvisibleWallet();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = Boolean(session);
  const walletReadyOrHydrated = walletHydrated ? walletReady : false;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (pathname === ONBOARDING_PATH) {
      if (isAuthenticated && walletReadyOrHydrated) {
        router.replace(HOME_PATH);
      }
      return;
    }

    if (!isAuthenticated) {
      router.replace(ONBOARDING_PATH);
    }
  }, [
    authLoading,
    isAuthenticated,
    walletReadyOrHydrated,
    pathname,
    router,
  ]);

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated && pathname !== ONBOARDING_PATH) {
    return null;
  }

  return <>{children}</>;
}
