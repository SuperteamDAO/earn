import { ArrowLeft, ArrowUpRight, CheckIcon, CopyIcon, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useClipboard } from '@/hooks/use-clipboard';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type TokenAsset } from '../types/TokenAsset';
import { WalletActivity } from './activity/WalletActivity';
import { TokenList } from './tokens/TokenList';
import { WithdrawFundsFlow } from './withdraw/WithdrawFundsFlow';

export type DrawerView = 'main' | 'withdraw' | 'success';

export function WalletDrawer({
  isOpen,
  onClose,
  tokens,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  tokens: TokenAsset[];
  isLoading: boolean;
  error: Error | null;
}) {
  const [view, setView] = useState<DrawerView>('main');

  const { user } = useUser();
  const router = useRouter();

  const handleBack = () => {
    if (view === 'withdraw') setView('main');
    if (view === 'success') setView('main');
  };

  const totalBalance = tokens?.reduce((acc, token) => {
    return acc + (token.usdValue || 0);
  }, 0);

  const padding = 'px-6 sm:px-8';

  const { onCopy, hasCopied } = useClipboard(user?.walletAddress || '');

  const handleClose = () => {
    const currentPath = window.location.hash;

    if (currentPath === '#wallet') {
      router.push(window.location.pathname, undefined, { shallow: true });
    }

    onClose();
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose}>
      <SideDrawerContent className="w-screen sm:w-[30rem]">
        <X
          className="absolute right-4 top-5 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:hidden"
          onClick={onClose}
        />
        <div className="flex h-full flex-col">
          <div
            className={cn(
              'items-center border-b bg-slate-50 py-5 pb-4',
              padding,
            )}
          >
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {user?.firstName + "'s Wallet"}
              </h2>
              <div
                onClick={onCopy}
                className="flex cursor-pointer items-center gap-1 text-slate-500 hover:text-slate-700"
              >
                <p className="text-xs font-medium">
                  {truncatePublicKey(user?.walletAddress)}
                </p>
                {hasCopied ? (
                  <CheckIcon className="size-2.5 text-green-500" />
                ) : (
                  <CopyIcon className="size-2.5" />
                )}
              </div>
            </div>

            <p className="text-sm font-medium text-slate-500">
              You will receive payments in this wallet each time you win
            </p>
          </div>
          <div className={cn('bg-slate-50 py-4', padding)}>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                ${formatNumberWithSuffix(totalBalance || 0, 2, true)}
              </p>
              <p className="text-xl font-semibold tracking-tight text-slate-500">
                USD
              </p>
            </div>
            <p className="text-base font-medium text-slate-400">BALANCE</p>
            {view === 'main' && (
              <Button
                onClick={() => setView('withdraw')}
                className="mt-6 rounded-lg bg-brand-purple px-5 text-base"
                disabled={!tokens?.length}
              >
                Withdraw
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {view === 'main' && (
            <>
              <div
                className={cn(
                  'border-b pb-2 pt-6 text-sm font-medium text-slate-500',
                  padding,
                )}
              >
                Assets
              </div>
              <TokenList
                tokens={tokens || []}
                isLoading={isLoading}
                error={error}
              />

              <div
                className={cn(
                  'border-b pb-2 pt-6 text-sm font-medium text-slate-500',
                  padding,
                )}
              >
                Activity
              </div>
              <WalletActivity />
            </>
          )}
          {view !== 'main' && (
            <div className="flex items-center border-b py-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="ml-4 mr-1"
              >
                <ArrowLeft className="h-4 w-4 text-slate-400" />
              </Button>
              <h2 className="text-sm font-medium text-slate-500">
                {view === 'withdraw' && 'Withdraw Funds'}
                {view === 'success' && 'Successfully Withdrawn'}
              </h2>
            </div>
          )}
          {view !== 'main' && (
            <div className={cn('flex-1 overflow-y-auto py-4', padding)}>
              <WithdrawFundsFlow
                tokens={tokens || []}
                setView={setView}
                view={view}
              />
            </div>
          )}
          <p className="mt-auto px-2 py-3 text-center text-xs text-slate-400 sm:text-sm">
            Have questions? Reach out to us at{' '}
            <a
              href="mailto:support@superteamearn.com"
              className="underline hover:text-slate-500"
              target="_blank"
            >
              support@superteamearn.com
            </a>
          </p>
        </div>
      </SideDrawerContent>
    </SideDrawer>
  );
}
