import { supabaseClient } from "@/lib/supabaseClient";

export interface WalletRow {
  user_id: string;
  seed_phrase: string;
  primary_account: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch wallet row for a user from Supabase
 */
export async function fetchWalletRow(userId: string): Promise<WalletRow | null> {
  const { data, error } = await supabaseClient
    .from("wallets")
    .select("user_id, seed_phrase, primary_account, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching wallet row:", error);
    throw new Error(`Failed to fetch wallet: ${error.message}`);
  }

  return (data as WalletRow | null) ?? null;
}

/**
 * Upsert wallet row (create or update)
 */
export async function upsertWalletRow(row: WalletRow): Promise<void> {
  const { error } = await supabaseClient.from("wallets").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    console.error("Error upserting wallet row:", error);
    throw new Error(`Failed to save wallet: ${error.message}`);
  }
}

/**
 * Update primary account address for a user's wallet
 */
export async function updatePrimaryAccount(
  userId: string,
  primaryAccount: string,
): Promise<void> {
  const { error } = await supabaseClient
    .from("wallets")
    .update({ primary_account: primaryAccount })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating primary account:", error);
    throw new Error(`Failed to update primary account: ${error.message}`);
  }
}

/**
 * Check wallet status using the edge function (optional)
 * This can be used to verify wallet existence before attempting operations
 */
export async function checkWalletStatus(
  sessionToken: string,
): Promise<{ exists: boolean; wallet: WalletRow | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-wallet?action=check`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to check wallet status");
    }

    const data = await response.json();
    return {
      exists: data.exists,
      wallet: data.wallet as WalletRow | null,
    };
  } catch (error) {
    console.error("Error checking wallet status via edge function:", error);
    throw error;
  }
}
