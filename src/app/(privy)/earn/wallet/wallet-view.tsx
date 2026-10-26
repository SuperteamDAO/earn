'use client';

import { useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import { ArrowLeft, ArrowUpRight, CopyIcon, X } from 'lucide-react';
import { posthog } from 'posthog-js';
import { Suspense, use, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { getJson } from '@/lib/fetch-json';
import { signInHref } from '@/lib/safe-next';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { WalletActivity } from '@/features/wallet/components/activity/WalletActivity';
import { TokenList } from '@/features/wallet/components/tokens/TokenList';
import { TransactionDetails } from '@/features/wallet/components/withdraw/TransactionDetails';
import type { TokenActivity } from '@/features/wallet/types/TokenActivity';
import type { TokenAsset } from '@/features/wallet/types/TokenAsset';
import type { TxData } from '@/features/wallet/types/TxData';
import type { DrawerView } from '@/features/wallet/types/WalletTypes';

import { PrivyAuthProvider, type PrivyProps } from '../../privy-auth-provider';
import { useTurn } from '../../turn';
import { WithdrawFundsFlow } from './withdraw-funds-flow';

// What the page needs of Privy once it has started; null until then.
interface PrivyState {
  readonly ready: boolean;
  readonly authenticated: boolean;
  readonly hasMfa: boolean;
  readonly showMfaEnrollmentModal: () => Promise<void> | void;
}

interface WalletState {
  readonly tokens: TokenAsset[];
  readonly tokensError: boolean;
  readonly activity: Promise<TokenActivity[] | null>;
  // Read again after a withdrawal; the server's until then.
  readonly freshActivity: TokenActivity[] | null | undefined;
  readonly view: DrawerView;
  readonly setView: (view: DrawerView) => void;
  readonly txData: TxData;
  readonly setTxData: (txData: TxData) => void;
  readonly onWithdrawn: () => Promise<void>;
}

const HERE = '/earn/wallet/';

// Earn's wallet drawer, as a page. Balances and activity need no Privy;
// withdrawing does, so Privy starts on its turn (see turn.ts) and until
// then Withdraw waits.
export function WalletView({
  privy,
  assets,
  activity,
}: {
  privy: PrivyProps;
  assets: TokenAsset[] | null;
  activity: Promise<TokenActivity[] | null>;
}) {
  const { started, ready } = useTurn();
  const [tokens, setTokens] = useState<TokenAsset[] | null>(assets);
  const [freshActivity, setFreshActivity] = useState<
    TokenActivity[] | null | undefined
  >(undefined);
  const [view, setView] = useState<DrawerView>('main');
  const [txData, setTxData] = useState<TxData>({
    signature: '',
    tokenAddress: '',
    amount: '',
    recipientAddress: '',
    timestamp: 0,
    type: 'Withdrawn',
    tokenSymbol: '',
    tokenImg: '',
  });

  const onWithdrawn = async () => {
    const [nextTokens, nextActivity] = await Promise.all([
      getJson<TokenAsset[]>('/api/wallet/assets/').catch(() => null),
      getJson<TokenActivity[]>('/api/wallet/activity/').catch(() => null),
    ]);
    if (nextTokens) setTokens(nextTokens);
    setFreshActivity(nextActivity);
  };

  const state: WalletState = {
    tokens: tokens ?? [],
    tokensError: tokens === null,
    activity,
    freshActivity,
    view,
    setView,
    txData,
    setTxData,
    onWithdrawn,
  };

  if (!started) return <WalletContent state={state} privy={null} />;
  return (
    <PrivyAuthProvider {...privy} onReady={ready}>
      <WithPrivy state={state} />
    </PrivyAuthProvider>
  );
}

function WithPrivy({ state }: { state: WalletState }) {
  const { ready, authenticated, user } = usePrivy();
  const { showMfaEnrollmentModal } = useMfaEnrollment();
  return (
    <WalletContent
      state={state}
      privy={{
        ready,
        authenticated,
        hasMfa: (user?.mfaMethods.length ?? 0) > 0,
        showMfaEnrollmentModal,
      }}
    />
  );
}

function ActivitySection({
  state,
}: {
  state: Pick<
    WalletState,
    'activity' | 'freshActivity' | 'setView' | 'setTxData'
  >;
}) {
  const served = use(state.activity);
  const activities =
    state.freshActivity === undefined ? served : state.freshActivity;
  return (
    <WalletActivity
      activities={activities ?? undefined}
      isLoading={false}
      error={activities === null}
      setView={state.setView}
      setTxData={state.setTxData}
    />
  );
}

function WalletContent({
  state,
  privy,
}: {
  state: WalletState;
  privy: PrivyState | null;
}) {
  const { tokens, view, setView, txData, setTxData } = state;
  const user = useViewer();
  const isMD = useBreakpoint('md');

  const handleBack = () => {
    setView('main');
  };

  const totalBalance = tokens?.reduce((acc, token) => {
    return acc + (token.usdValue || 0);
  }, 0);

  const padding = 'px-6 sm:px-8';

  const handleWithdraw = async () => {
    if (!privy?.ready) return;
    // Privy's session ended: signing needs it, so sign in and come back.
    if (!privy.authenticated) {
      window.location.assign(signInHref(HERE));
      return;
    }
    posthog.capture('withdraw_start');
    if (!privy.hasMfa) {
      toast(
        <div className="relative flex flex-col gap-1">
          <X
            className="absolute top-0 right-0 size-4 cursor-pointer text-slate-400 hover:text-slate-700"
            onClick={() => toast.dismiss()}
          />
          <div className={cn('text-brand-purple mt-1 pr-6 text-xl font-bold')}>
            Two-Factor Auth is Mandatory
          </div>
          <div className="text-sm text-slate-600">
            Setting up two-factor authentication is mandatory to continue
            withdrawing. This will keep your funds secure.
          </div>
          <Button
            onClick={() =>
              void Promise.resolve(privy.showMfaEnrollmentModal()).then(() =>
                setView('withdraw'),
              )
            }
            className={cn(
              'bg-brand-purple hover:bg-brand-purple-dark mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors',
            )}
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
    <div className="mx-auto flex w-full flex-1 flex-col sm:w-120 sm:border-x">
      <div
        className={cn('items-center border-b bg-slate-50 py-5 pb-4', padding)}
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
              {truncatePublicKey(user?.walletAddress ?? undefined)}
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
              onClick={() => void handleWithdraw()}
              className={cn('bg-brand-purple mt-3 rounded-lg px-5 text-base')}
              disabled={!tokens?.length || !privy?.ready}
            >
              Withdraw
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            {privy?.ready && privy.authenticated && (
              <div
                onClick={() => void privy.showMfaEnrollmentModal()}
                className="mt-1.5 cursor-pointer py-0.5 text-xs font-semibold text-slate-400 hover:text-slate-500 hover:underline"
              >
                {!privy.hasMfa
                  ? '+ Add Two Factor Authentication'
                  : 'Edit Two Factor Authentication'}
              </div>
            )}
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
            isLoading={false}
            error={state.tokensError}
          />

          <div
            className={cn(
              'border-b pt-6 pb-2 text-sm font-medium text-slate-500',
              padding,
            )}
          >
            Activity
          </div>
          <Suspense
            fallback={
              <WalletActivity
                activities={undefined}
                isLoading
                error={false}
                setView={setView}
                setTxData={setTxData}
              />
            }
          >
            <ActivitySection state={state} />
          </Suspense>
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
          {privy ? (
            <WithdrawFundsFlow
              tokens={tokens || []}
              setView={setView}
              view={view}
              txData={txData}
              setTxData={setTxData}
              onWithdrawn={state.onWithdrawn}
            />
          ) : (
            view === 'history' && <TransactionDetails txData={txData} />
          )}
        </div>
      )}
      <p className="sticky bottom-0 mt-auto bg-white px-2 py-2 text-center text-xs text-slate-400 sm:text-sm">
        Have questions? Reach out to us at{' '}
        {isMD ? (
          <CopyButton text="support@superteam.fun">
            <p className="underline hover:text-slate-500">
              support@superteam.fun
            </p>
          </CopyButton>
        ) : (
          <a
            href="mailto:support@superteam.fun"
            className="underline hover:text-slate-500"
            target="_blank"
          >
            support@superteam.fun
          </a>
        )}
      </p>
    </div>
  );
}
