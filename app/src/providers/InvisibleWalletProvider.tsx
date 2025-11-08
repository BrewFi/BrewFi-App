"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { generateMnemonic } from "@scure/bip39";
import { wordlist as english } from "@scure/bip39/wordlists/english.js";
import type {
  AccountSummary,
  NativeTransferParams,
  TokenTransferParams,
} from "@/lib/tetherWallet";
import {
  AVALANCHE_FUJI_USDC,
  TetherWalletService,
} from "@/lib/tetherWallet";
import {
  fetchWalletRow,
  updatePrimaryAccount,
  upsertWalletRow,
  type WalletRow,
} from "@/lib/invisibleWalletStorage";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";
import { BREWFI_CONTRACT, USDT_CONTRACT } from "@/config/contracts";

const TOKEN_ADDRESSES: `0x${string}`[] = [
  AVALANCHE_FUJI_USDC,
  USDT_CONTRACT.address,
  BREWFI_CONTRACT.address,
];

export interface TransactionResult {
  hash: string;
  fee?: bigint;
}

export interface InvisibleWalletContextValue {
  hydrated: boolean;
  loading: boolean;
  isReady: boolean;
  accounts: AccountSummary[];
  primaryAccount: AccountSummary | null;
  error: string | null;
  refresh: () => Promise<void>;
  createWallet: () => Promise<AccountSummary>;
  sendNative: (params: NativeTransferParams) => Promise<TransactionResult>;
  transferToken: (params: TokenTransferParams) => Promise<TransactionResult>;
  callContract: (params: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  }) => Promise<TransactionResult>;
}

const InvisibleWalletContext = createContext<InvisibleWalletContextValue | undefined>(
  undefined,
);

export function InvisibleWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useSupabaseAuth();
  const userId = session?.user?.id ?? null;

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [walletRow, setWalletRow] = useState<WalletRow | null>(null);

  const serviceRef = useRef<TetherWalletService | null>(null);
  const seedRef = useRef<string | null>(null);
  const lastPrimaryAccountRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const disposeService = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.dispose();
      serviceRef.current = null;
    }
    seedRef.current = null;
    lastPrimaryAccountRef.current = null;
  }, []);

  const loadAccounts = useCallback(
    async (service: TetherWalletService) => {
      const summaries = await service.getMultipleAccountSummaries(1, TOKEN_ADDRESSES);
      if (isMountedRef.current) {
        setAccounts(summaries);
      }
      return summaries;
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      disposeService();
    };
  }, [disposeService]);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      setWalletRow(null);
      setHydrated(true);
      setLoading(false);
      setError(null);
      disposeService();
      return;
    }

    let cancelled = false;

    const syncWallet = async () => {
      setLoading(true);
      setError(null);

      try {
        const row = await fetchWalletRow(userId);
        if (cancelled || !isMountedRef.current) return;

        setWalletRow(row);
        
        if (row?.seed_phrase) {
          const seed = row.seed_phrase;
          
          // Initialize or update service if seed changed
          if (!serviceRef.current || seedRef.current !== seed) {
            if (serviceRef.current) {
              serviceRef.current.dispose();
            }
            serviceRef.current = new TetherWalletService(seed);
            seedRef.current = seed;
          }

          // Load accounts
          const summaries = await loadAccounts(serviceRef.current);
          if (cancelled || !isMountedRef.current) return;

          // Update primary account if needed (only once per address)
          const primary = summaries[0]?.address;
          if (primary && lastPrimaryAccountRef.current !== primary) {
            try {
              await updatePrimaryAccount(userId, primary);
              if (!cancelled && isMountedRef.current) {
                lastPrimaryAccountRef.current = primary;
                setWalletRow((prev) =>
                  prev ? { ...prev, primary_account: primary } : prev,
                );
              }
            } catch (updateError) {
              console.warn("Failed to update primary account", updateError);
            }
          } else if (row.primary_account) {
            lastPrimaryAccountRef.current = row.primary_account;
          }
        } else {
          disposeService();
          if (!cancelled && isMountedRef.current) {
            setAccounts([]);
          }
        }
      } catch (err) {
        if (cancelled || !isMountedRef.current) return;
        console.error("Failed to load invisible wallet", err);
        setError((err as Error).message ?? "Unable to load wallet");
        disposeService();
        setAccounts([]);
      } finally {
        if (!cancelled && isMountedRef.current) {
          setHydrated(true);
          setLoading(false);
        }
      }
    };

    syncWallet();

    return () => {
      cancelled = true;
    };
  }, [userId, loadAccounts, disposeService]);

  const refresh = useCallback(async () => {
    if (!userId || !seedRef.current) return;
    
    if (!serviceRef.current) {
      serviceRef.current = new TetherWalletService(seedRef.current);
    }

    const summaries = await loadAccounts(serviceRef.current);
    if (!isMountedRef.current) return;

    const primary = summaries[0]?.address;
    if (primary && lastPrimaryAccountRef.current !== primary) {
      try {
        await updatePrimaryAccount(userId, primary);
        if (isMountedRef.current) {
          lastPrimaryAccountRef.current = primary;
          setWalletRow((prev) =>
            prev ? { ...prev, primary_account: primary } : prev,
          );
        }
      } catch (updateError) {
        console.warn("Failed to update primary account", updateError);
      }
    }
  }, [userId, loadAccounts]);

  const createWallet = useCallback(async () => {
    if (!userId) {
      throw new Error("User must be signed in to create wallet");
    }

    const mnemonic = generateMnemonic(english);
    const row: WalletRow = {
      user_id: userId,
      seed_phrase: mnemonic,
      primary_account: null,
    };

    await upsertWalletRow(row);
    
    // Dispose old service if exists
    if (serviceRef.current) {
      serviceRef.current.dispose();
    }
    
    // Create new service
    serviceRef.current = new TetherWalletService(mnemonic);
    seedRef.current = mnemonic;
    lastPrimaryAccountRef.current = null;
    
    // Load accounts
    const summaries = await loadAccounts(serviceRef.current);
    if (!isMountedRef.current || !summaries[0]) {
      throw new Error("Unable to initialize invisible wallet");
    }
    
    // Update state
    setWalletRow(row);
    setHydrated(true);
    
    // Update primary account
    const primary = summaries[0].address;
    try {
      await updatePrimaryAccount(userId, primary);
      if (isMountedRef.current) {
        lastPrimaryAccountRef.current = primary;
        setWalletRow((prev) =>
          prev ? { ...prev, primary_account: primary } : prev,
        );
      }
    } catch (updateError) {
      console.warn("Failed to update primary account", updateError);
    }
    
    return summaries[0];
  }, [userId, loadAccounts]);

  const sendNative = useCallback<
    InvisibleWalletContextValue["sendNative"]
  >(async (params) => {
    const service = serviceRef.current;
    if (!service) {
      throw new Error("Invisible wallet not ready");
    }
    const result = await service.sendNativeTransaction(params);
    await refresh();
    return result;
  }, [refresh]);

  const transferToken = useCallback<
    InvisibleWalletContextValue["transferToken"]
  >(async (params) => {
    const service = serviceRef.current;
    if (!service) {
      throw new Error("Invisible wallet not ready");
    }
    const result = await service.transferToken(params);
    await refresh();
    return result;
  }, [refresh]);

  const callContract = useCallback<
    InvisibleWalletContextValue["callContract"]
  >(async (params) => {
    const service = serviceRef.current;
    if (!service) {
      throw new Error("Invisible wallet not ready");
    }
    // Use sendContractTransaction for contract calls with data
    const result = await service.sendContractTransaction({
      index: 0,
      to: params.to,
      data: params.data,
      value: params.value || 0n,
    });
    await refresh();
    return result;
  }, [refresh]);

  const value = useMemo<InvisibleWalletContextValue>(() => {
    const primaryAccount = accounts[0] ?? null;
    const isReady = hydrated && Boolean(seedRef.current) && Boolean(primaryAccount);

    return {
      hydrated,
      loading,
      isReady,
      accounts,
      primaryAccount,
      error,
      refresh,
      createWallet,
      sendNative,
      transferToken,
      callContract,
    };
  }, [accounts, callContract, createWallet, error, hydrated, loading, refresh, sendNative, transferToken]);

  return (
    <InvisibleWalletContext.Provider value={value}>
      {children}
    </InvisibleWalletContext.Provider>
  );
}

export function useInvisibleWallet() {
  const context = useContext(InvisibleWalletContext);
  if (!context) {
    throw new Error("useInvisibleWallet must be used within InvisibleWalletProvider");
  }
  return context;
}
