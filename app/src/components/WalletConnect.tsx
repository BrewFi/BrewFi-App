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
                    className="px-4 py-2 cyber-border rounded-lg text-sm hover:bg-cyber-blue/10 transition-all"
                  >
                    Connect Wallet
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
                <div className="flex gap-2">
                  <button
                    onClick={openChainModal}
                    className="px-3 py-2 cyber-border rounded-lg text-sm hover:bg-cyber-blue/10 transition-all flex items-center gap-2"
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
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="px-4 py-2 cyber-border rounded-lg text-sm hover:bg-cyber-blue/10 transition-all"
                  >
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}
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



