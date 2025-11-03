import { useWallet } from '@solana/wallet-adapter-react';
import { ChevronDown, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import posthog from 'posthog-js';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/tooltip';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

const DynamicWalletMultiButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false },
);

export const WalletManagement = () => {
  const { connected, publicKey, disconnect, wallet } = useWallet();

  const handleDisconnect = async () => {
    try {
      await disconnect();
      posthog.capture('wallet_disconnected_payments');
      toast.success('Wallet disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      posthog.capture('wallet_disconnect_failed');
      toast.error('Failed to disconnect wallet');
    }
  };

  const handleConnectClick = () => {
    posthog.capture('wallet_connect_clicked_payments');
  };

  const handleSwitchWallet = () => {
    posthog.capture('wallet_switch_requested_payments');
    // The WalletMultiButton will handle showing the wallet selection modal
    // We'll trigger it by clicking the button again
    const walletButton = document.querySelector(
      '[data-testid="wallet-adapter-button"]',
    ) as HTMLElement;
    if (walletButton) {
      walletButton.click();
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Wallet className="h-4 w-4" />
          <span>Connect wallet to make payments</span>
        </div>
        <div onClick={handleConnectClick}>
          <DynamicWalletMultiButton
            style={{
              height: '36px',
              minWidth: '140px',
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 500,
              fontFamily: 'Inter',
              paddingRight: '16px',
              paddingLeft: '16px',
              fontSize: '14px',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Wallet className="h-4 w-4" />
        <span>Connected wallet:</span>
      </div>

      <DropdownMenu>
        <Tooltip content="Click to manage wallet connection">
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex h-9 items-center gap-2 px-3 py-2 text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                {wallet?.adapter?.icon && (
                  <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    className="h-4 w-4 rounded"
                  />
                )}
                <span className="font-mono text-xs">
                  {truncatePublicKey(publicKey?.toBase58() || '', 4)}
                </span>
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleSwitchWallet}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            Switch Wallet
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="flex items-center gap-2 text-red-600 focus:text-red-600"
          >
            <Wallet className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
