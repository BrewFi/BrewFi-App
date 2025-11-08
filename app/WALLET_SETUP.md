# Invisible Wallet Setup Guide

This document explains the Supabase setup for the invisible wallet functionality.

## Database Migration

### Wallets Table

A `wallets` table has been created in Supabase with the following structure:

- `user_id` (UUID, Primary Key) - References `auth.users(id)`
- `seed_phrase` (TEXT) - BIP-39 mnemonic seed phrase (12-24 words, unencrypted)
- `primary_account` (TEXT, nullable) - Primary wallet address derived from seed phrase
- `created_at` (TIMESTAMPTZ) - Timestamp when wallet was created
- `updated_at` (TIMESTAMPTZ) - Timestamp when wallet was last updated

### Row Level Security (RLS)

RLS policies are enabled to ensure users can only:
- View their own wallet
- Create their own wallet
- Update their own wallet
- Delete their own wallet

### Automatic Timestamps

A trigger function automatically updates the `updated_at` column whenever a wallet row is modified.

## Edge Function

### create-wallet

An edge function has been deployed that provides:

**GET `/functions/v1/create-wallet?action=check`**
- Checks if a wallet exists for the authenticated user
- Returns: `{ exists: boolean, wallet: WalletRow | null }`

**POST `/functions/v1/create-wallet?action=store`**
- Stores a wallet (seed phrase generated client-side)
- Body: `{ seed_phrase: string, primary_account?: string }`
- Returns: `{ success: boolean, wallet: WalletRow }`

**Note:** The edge function requires authentication via the `Authorization` header with a valid JWT token.

## Client-Side Usage

### Direct Database Access (Recommended)

The current implementation uses direct Supabase client access:

```typescript
import { fetchWalletRow, upsertWalletRow, updatePrimaryAccount } from '@/lib/invisibleWalletStorage';

// Fetch wallet for a user
const wallet = await fetchWalletRow(userId);

// Create or update wallet
await upsertWalletRow({
  user_id: userId,
  seed_phrase: mnemonic,
  primary_account: address,
});

// Update primary account address
await updatePrimaryAccount(userId, address);
```

### Using Edge Function (Optional)

You can also use the edge function for wallet status checks:

```typescript
import { checkWalletStatus } from '@/lib/invisibleWalletStorage';
import { supabaseClient } from '@/lib/supabaseClient';

const session = await supabaseClient.auth.getSession();
if (session.data.session) {
  const status = await checkWalletStatus(session.data.session.access_token);
  console.log('Wallet exists:', status.exists);
}
```

## Wallet Creation Flow

1. User signs up/signs in via Supabase Auth
2. Onboarding page checks if wallet exists
3. If no wallet exists, generates BIP-39 mnemonic client-side using `@scure/bip39`
4. Stores mnemonic in Supabase `wallets` table
5. Derives wallet address using Tether Wallet Developer Kit
6. Updates `primary_account` in database

## Security Considerations

⚠️ **Important:** Seed phrases are stored **unencrypted** in the database as requested. 

- Users can only access their own wallets (RLS enforced)
- Edge function requires authentication
- All database operations are logged

For production use, consider:
- Encrypting seed phrases at rest
- Using a key management service
- Implementing backup/recovery mechanisms
- Adding rate limiting to wallet creation

## Environment Variables

Ensure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The edge function uses:
- `SUPABASE_URL` (automatically available in edge functions)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically available in edge functions)

## Testing

1. Sign up a new user
2. Complete onboarding flow
3. Wallet should be automatically created
4. Check Supabase dashboard to verify wallet row exists
5. Verify RLS policies prevent accessing other users' wallets

## Troubleshooting

**Error: "Failed to fetch wallet"**
- Check RLS policies are enabled
- Verify user is authenticated
- Check Supabase connection

**Error: "Wallet already exists"**
- Wallet was already created for this user
- Check `wallets` table in Supabase dashboard

**Edge function returns 401**
- Verify JWT token is valid
- Check `Authorization` header is set correctly
- Ensure user is authenticated

