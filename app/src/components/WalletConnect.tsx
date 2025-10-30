'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';

// WalletConnect component - Integrates with wagmi/RainbowKit

export function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    className="px-3 md:px-4 py-2 cyber-border rounded-lg text-xs md:text-sm hover:bg-cyber-blue hover:text-black transition-all whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal}
                    className="px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg text-sm hover:bg-red-500/30 transition-all"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={openChainModal}
                    className="px-2 md:px-3 py-2 cyber-border rounded-lg text-xs md:text-sm hover:bg-cyber-blue hover:text-black transition-all flex items-center gap-2"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="hidden sm:inline">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="px-3 md:px-4 py-2 cyber-border rounded-lg text-xs md:text-sm hover:bg-cyber-blue hover:text-black transition-all max-w-[120px] sm:max-w-none truncate"
                  >
                    <span className="truncate inline-block align-bottom max-w-full">
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
