import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ChevronDown, LogOut, RefreshCw, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

const DynamicWalletMultiButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false },
);

interface WalletConnectionBadgeProps {
  className?: string;
}

export function WalletConnectionBadge({
  className,
}: WalletConnectionBadgeProps) {
  const { connected, publicKey, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const handleSwitchWallet = () => {
    posthog.capture('switch_wallet_payments_tab');
    setVisible(true);
  };

  const handleDisconnect = async () => {
    posthog.capture('disconnect_wallet_payments_tab');
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (!connected) {
    return (
      <div
        className={cn('ph-no-capture wallet-header-button', className)}
        onClick={() => {
          posthog.capture('connect_wallet_payments_tab');
        }}
      >
        <DynamicWalletMultiButton
          style={{
            height: '40px',
            minWidth: '160px',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 600,
            fontFamily: 'Inter',
            paddingRight: '20px',
            paddingLeft: '20px',
            fontSize: '14px',
            borderRadius: '0px',
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex h-2 w-2 items-center justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        </div>
        <Wallet className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-900">
          {truncatePublicKey(publicKey?.toBase58(), 4)}
        </span>
        {wallet && (
          <span className="text-xs text-slate-500">
            ({wallet.adapter.name})
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1 border-slate-200"
          >
            <span className="text-sm">Manage</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleSwitchWallet}
            className="cursor-pointer"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Switch Wallet</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
