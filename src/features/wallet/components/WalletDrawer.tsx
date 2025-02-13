import { useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import { ArrowLeft, ArrowUpRight, CheckIcon, CopyIcon, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { WalletFeature } from '@/components/modals/WalletFeature';
import { Button } from '@/components/ui/button';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useClipboard } from '@/hooks/use-clipboard';
import { useUpdateUser, useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type TokenAsset } from '../types/TokenAsset';
import { type TxData } from '../types/TxData';
import { WalletActivity } from './activity/WalletActivity';
import { TokenList } from './tokens/TokenList';
import { WithdrawFundsFlow } from './withdraw/WithdrawFundsFlow';

export type DrawerView = 'main' | 'withdraw' | 'success' | 'history' | 'intro';

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
    address: '',
    timestamp: 0,
    type: 'Withdrawn',
  });

  const { user } = useUser();
  const router = useRouter();
  const updateUser = useUpdateUser();
  const { user: privyUser } = usePrivy();
  const { showMfaEnrollmentModal } = useMfaEnrollment();

  const handleBack = () => {
    setView('main');
  };

  const handleIntroClose = () => {
    setView('main');
    updateUser.mutateAsync({ featureModalShown: true });
  };

  useEffect(() => {
    const targetDate = new Date('2025-02-09T00:00:00.000Z');
    const userCreatedDate = user?.createdAt ? new Date(user.createdAt) : null;
    if (
      user &&
      user.featureModalShown === false &&
      user.isTalentFilled &&
      userCreatedDate &&
      userCreatedDate > targetDate
    ) {
      setView('intro');
    }
  }, [user]);

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
      <SideDrawerContent className="w-screen overflow-y-auto sm:w-[30rem]">
        <X
          className="absolute top-5 right-4 z-10 h-5 w-5 cursor-pointer text-slate-600 sm:hidden"
          onClick={onClose}
        />
        {view === 'intro' && (
          <div className="flex h-full flex-col justify-center">
            <WalletFeature onClick={handleIntroClose} />
          </div>
        )}
        {view !== 'intro' && (
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
                    onClick={() => setView('withdraw')}
                    className="bg-brand-purple mt-3 rounded-lg px-5 text-base"
                    disabled={!tokens?.length}
                  >
                    Withdraw
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  <div
                    onClick={() => showMfaEnrollmentModal()}
                    className="text-brand-purple hover:text-brand-purple-dark mt-1.5 cursor-pointer py-0.5 text-xs font-semibold hover:underline"
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
              <a
                href="mailto:support@superteamearn.com"
                className="underline hover:text-slate-500"
                target="_blank"
              >
                support@superteamearn.com
              </a>
            </p>
          </div>
        )}
      </SideDrawerContent>
    </SideDrawer>
  );
}
