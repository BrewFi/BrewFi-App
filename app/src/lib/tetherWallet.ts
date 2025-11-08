"use client";

import WalletManagerEvm, {
  WalletAccountEvm,
  WalletAccountReadOnlyEvm,
} from "@tetherto/wdk-wallet-evm";

export interface TetherWalletOptions {
  provider?: string | WalletProvider;
  transferMaxFee?: bigint;
}

interface WalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export interface AccountSummary {
  index: number;
  derivationPath: string;
  address: string;
  balanceWei: bigint;
  tokenBalances: Record<string, bigint>;
  readOnlyAccount?: WalletAccountReadOnlyEvm;
}

export interface TransferQuote {
  fee: bigint;
}

export interface NativeTransferParams {
  index: number;
  to: `0x${string}`;
  value: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit?: number;
}

export interface TokenTransferParams {
  index: number;
  token: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  transferMaxFee?: bigint;
}

const DEFAULT_RPC =
  process.env.NEXT_PUBLIC_AVALANCHE_RPC ??
  "https://api.avax-test.network/ext/bc/C/rpc";

const DEFAULT_TRANSFER_MAX_FEE = 1_000_000_000_000_000n; // 0.001 AVAX in wei

export class TetherWalletService {
  private walletManager?: WalletManagerEvm;
  private readonly provider: string | WalletProvider;
  private readonly transferMaxFee: bigint;

  constructor(
    private readonly seedPhrase: string,
    options?: TetherWalletOptions,
  ) {
    if (!seedPhrase || seedPhrase.trim().split(" ").length < 12) {
      throw new Error("A valid BIP-39 seed phrase is required");
    }

    this.provider = options?.provider ?? DEFAULT_RPC;
    this.transferMaxFee = options?.transferMaxFee ?? DEFAULT_TRANSFER_MAX_FEE;
  }

  /**
   * Lazily instantiate the Wallet Manager the first time it is needed.
   */
  private getManager(): WalletManagerEvm {
    if (!this.walletManager) {
      this.walletManager = new WalletManagerEvm(this.seedPhrase, {
        provider: this.provider,
        transferMaxFee: Number(this.transferMaxFee),
      });
    }
    return this.walletManager;
  }

  private async resolveAccount(index: number): Promise<WalletAccountEvm> {
    if (index < 0) {
      throw new Error("Account index must be zero or greater");
    }
    const manager = this.getManager();
    return manager.getAccount(index);
  }

  async getAccountSummary(
    index: number,
    tokenAddresses: `0x${string}`[] = [],
  ): Promise<AccountSummary> {
    const account = await this.resolveAccount(index);
    const address = await account.getAddress();
    const balanceWei = await account.getBalance();

    const tokenBalancesEntries = await Promise.all(
      tokenAddresses.map(async (token) => [
        token,
        await account.getTokenBalance(token),
      ] as const),
    );

    const tokenBalances = Object.fromEntries(tokenBalancesEntries);

    const readOnlyAccount = await account.toReadOnlyAccount();

    return {
      index,
      derivationPath: getDefaultDerivationPath(index),
      address,
      balanceWei,
      tokenBalances,
      readOnlyAccount,
    };
  }

  async getMultipleAccountSummaries(
    count: number,
    tokenAddresses: `0x${string}`[] = [],
  ): Promise<AccountSummary[]> {
    const summaries: AccountSummary[] = [];
    for (let i = 0; i < count; i += 1) {
      summaries.push(await this.getAccountSummary(i, tokenAddresses));
    }
    return summaries;
  }

  async sendNativeTransaction(params: NativeTransferParams) {
    const { index, ...tx } = params;
    const account = await this.resolveAccount(index);
    return account.sendTransaction(tx);
  }

  async sendContractTransaction(params: {
    index: number;
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasLimit?: number;
  }) {
    const { index, ...tx } = params;
    const account = await this.resolveAccount(index);
    // @ts-ignore - WDK may support data field even if type doesn't show it
    return account.sendTransaction({
      ...tx,
      value: tx.value || 0n,
    });
  }

  async transferToken({ index, transferMaxFee, ...args }: TokenTransferParams) {
    const account = await this.resolveAccount(index);
    // Note: transferMaxFee is configured at the WalletManager level
    // If a different fee is needed, it would require manager reconfiguration
    return account.transfer(args);
  }

  async quoteTokenTransfer({ index, ...args }: TokenTransferParams): Promise<TransferQuote> {
    const account = await this.resolveAccount(index);
    const quote = await account.quoteTransfer(args);
    return { fee: quote.fee };
  }

  async signMessage(index: number, message: string): Promise<string> {
    const account = await this.resolveAccount(index);
    return account.sign(message);
  }

  async verifyMessage(
    index: number,
    message: string,
    signature: string,
  ): Promise<boolean> {
    const account = await this.resolveAccount(index);
    return account.verify(message, signature);
  }

  dispose() {
    this.walletManager?.dispose();
    this.walletManager = undefined;
  }
}

export function getDefaultDerivationPath(index: number): string {
  return `m/44'/60'/0'/0/${index}`;
}

export async function createReadOnlyAccount(
  address: `0x${string}`,
  provider: string = DEFAULT_RPC,
) {
  return new WalletAccountReadOnlyEvm(address, { provider });
}

export const AVALANCHE_FUJI_USDC =
  "0x5425890298aed601595a70AB815c96711a31Bc65" as const;
