'use client';
import { useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import { ArrowLeft, ArrowUpRight, CopyIcon, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type TokenAsset } from '../types/TokenAsset';
import { type TxData } from '../types/TxData';
import { type DrawerView } from '../types/WalletTypes';
import { WalletActivity } from './activity/WalletActivity';
import { TokenList } from './tokens/TokenList';
import { WithdrawFundsFlow } from './withdraw/WithdrawFundsFlow';

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
  const [txData, setTxData] = useState<TxData>({
    signature: '',
    tokenAddress: '',
    amount: '',
    recipientAddress: '',
    timestamp: 0,
    type: 'Withdrawn',
  });

  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const { user: privyUser } = usePrivy();
  const { showMfaEnrollmentModal } = useMfaEnrollment();

  const isMD = useBreakpoint('md');

  const handleBack = () => {
    setView('main');
  };

  const totalBalance = tokens?.reduce((acc, token) => {
    return acc + (token.usdValue || 0);
  }, 0);

  const padding = 'px-6 sm:px-8';

  const handleClose = () => {
    const currentPath = window.location.hash;

    if (currentPath === '#wallet' && pathname) {
      router.push(pathname);
    }

    onClose();
  };

  const handleWithdraw = async () => {
    posthog.capture('withdraw_start');
    if (privyUser?.mfaMethods.length === 0) {
      toast(
        <div className="relative flex flex-col gap-1">
          <X
            className="absolute top-0 right-0 size-4 cursor-pointer text-slate-400 hover:text-slate-700"
            onClick={() => toast.dismiss()}
          />
          <div className="text-brand-purple mt-1 pr-6 text-xl font-bold">
            Two-Factor Auth is Mandatory
          </div>
          <div className="text-sm text-slate-600">
            Setting up two-factor authentication is mandatory to continue
            withdrawing. This will keep your funds secure.
          </div>
          <Button
            onClick={async () => {
              await showMfaEnrollmentModal();
              setView('withdraw');
            }}
            className="bg-brand-purple hover:bg-brand-purple-dark mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Set up 2FA
          </Button>
        </div>,
        {
          duration: 7000,
          style: {
            border: '1px solid #7471ff',
            padding: '1rem',
          },
          className: 'shadow-lg',
          dismissible: true,
        },
      );
    } else {
      setView('withdraw');
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose}>
      <SideDrawerContent className="w-screen overflow-hidden sm:w-[30rem]">
        <ScrollArea className="h-full overflow-y-auto">
          <X
            className="absolute top-5 right-4 z-10 h-5 w-5 cursor-pointer text-slate-600 sm:hidden"
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
                <CopyButton
                  text={user?.walletAddress || ''}
                  className="flex cursor-pointer items-center gap-1 text-slate-500 hover:text-slate-700"
                  contentProps={{ side: 'right' }}
                  content={'Click to copy'}
                >
                  <p className="text-xs font-medium">
                    {truncatePublicKey(user?.walletAddress)}
                  </p>
                  <CopyIcon className="size-2.5" />
                </CopyButton>
              </div>
              <p className="text-sm font-medium text-slate-500">
                You will receive payments in this wallet each time you win.{' '}
                <a
                  href="https://superteamdao.notion.site/using-your-earn-wallet"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>{' '}
                about what you can do with your rewards.
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
                <div className="w-full items-end justify-between">
                  <Button
                    onClick={handleWithdraw}
                    className="bg-brand-purple mt-3 rounded-lg px-5 text-base"
                    disabled={!tokens?.length}
                  >
                    Withdraw
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  <div
                    onClick={() => showMfaEnrollmentModal()}
                    className="mt-1.5 cursor-pointer py-0.5 text-xs font-semibold text-slate-400 hover:text-slate-500 hover:underline"
                  >
                    {privyUser?.mfaMethods.length === 0
                      ? '+ Add Two Factor Authentication'
                      : 'Edit Two Factor Authentication'}
                  </div>
                </div>
              )}
            </div>
            {view === 'main' && (
              <>
                <div
                  className={cn(
                    'border-b pt-6 pb-2 text-sm font-medium text-slate-500',
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
                    'border-b pt-6 pb-2 text-sm font-medium text-slate-500',
                    padding,
                  )}
                >
                  Activity
                </div>
                <WalletActivity setView={setView} setTxData={setTxData} />
              </>
            )}
            {view !== 'main' && (
              <div className="flex items-center border-b py-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="mr-1 ml-4"
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
                  txData={txData}
                  setTxData={setTxData}
                />
              </div>
            )}
            <p className="sticky bottom-0 mt-auto bg-white px-2 py-2 text-center text-xs text-slate-400 sm:text-sm">
              Have questions? Reach out to us at{' '}
              {isMD ? (
                <CopyButton text="support@superteamearn.com">
                  <p className="underline hover:text-slate-500">
                    support@superteamearn.com
                  </p>
                </CopyButton>
              ) : (
                <a
                  href="mailto:support@superteamearn.com"
                  className="underline hover:text-slate-500"
                  target="_blank"
                >
                  support@superteamearn.com
                </a>
              )}
            </p>
          </div>
        </ScrollArea>
      </SideDrawerContent>
    </SideDrawer>
  );
}
