import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type TokenAsset } from '../utils/fetchUserTokens';
import { SendTokenForm } from './SendTokenForm';
import { TokenList } from './TokenList';
import { WalletActivity } from './WalletActivity';

type DrawerView = 'main' | 'send';

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

  const handleBack = () => {
    if (view === 'send') setView('main');
  };

  const totalBalance = tokens?.reduce((acc, token) => {
    return acc + (token.usdValue || 0);
  }, 0);

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose}>
      <SideDrawerContent className="w-[30rem]">
        <div className="flex h-full flex-col">
          <div className="items-center border-b bg-slate-50 px-8 py-5 pb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {user?.firstName + "'s Wallet"}
            </h2>
            <p className="text-sm font-medium text-slate-500">
              You will get paid in this wallet everytime you win
            </p>
          </div>
          <div className="bg-slate-50 px-8 py-4">
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                ${formatNumberWithSuffix(totalBalance || 0, 2, true)}
              </p>
              <p className="text-xl font-semibold tracking-tight text-slate-500">
                USD
              </p>
            </div>
            <p className="mt-1 text-base font-medium text-slate-500">BALANCE</p>
            {view === 'main' && (
              <Button
                onClick={() => setView('send')}
                className="mt-6 rounded-lg bg-indigo-600 px-5 text-base"
                disabled={!tokens?.length}
              >
                Withdraw
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {view === 'main' && (
            <>
              <div className="border-b px-8 pb-2 pt-6 text-sm font-medium text-slate-500">
                Assets
              </div>
              <TokenList
                tokens={tokens || []}
                isLoading={isLoading}
                error={error}
              />

              <div className="border-b px-8 pb-2 pt-6 text-sm font-medium text-slate-500">
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
                {view === 'send' && 'Withdraw Funds'}
              </h2>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-8 py-4">
            {view === 'send' && (
              <SendTokenForm
                tokens={tokens || []}
                onSuccess={() => onClose()}
              />
            )}
          </div>
        </div>
      </SideDrawerContent>
    </SideDrawer>
  );
}
