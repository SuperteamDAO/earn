import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { tokenAssetsQuery } from '../queries/fetch-assets';
import { type TokenAsset } from '../utils/fetchUserTokens';
import { SendTokenForm } from './SendTokenForm';
import { TokenSelector } from './TokenSelector';
import { WalletActivity } from './WalletActivity';

type DrawerView = 'main' | 'send' | 'tokenSelect';

export function WalletDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState<DrawerView>('main');
  const [selectedToken, setSelectedToken] = useState<TokenAsset | null>(null);

  const { user } = useUser();

  const handleBack = () => {
    if (view === 'tokenSelect') setView('main');
    if (view === 'send') setView('tokenSelect');
  };

  const { data: tokens, isLoading, error } = useQuery(tokenAssetsQuery);

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
                onClick={() => setView('tokenSelect')}
                className="mt-6 rounded-lg bg-indigo-600 px-5 text-base"
              >
                Withdraw
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {view === 'main' && (
            <>
              <div className="border-b px-8 pb-2 pt-2 text-slate-500">
                Assets
              </div>
              <TokenSelector
                onSelect={() => {}}
                tokens={tokens || []}
                isLoading={isLoading}
                error={error}
              />

              <div className="border-b px-8 pb-2 pt-6 text-slate-500">
                Activity
              </div>
              <WalletActivity />
            </>
          )}

          {view !== 'main' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="flex-1 overflow-y-auto py-4">
            {view === 'tokenSelect' && (
              <TokenSelector
                onSelect={(token) => {
                  setSelectedToken(token);
                  setView('send');
                }}
                tokens={tokens || []}
                isLoading={isLoading}
                error={error}
              />
            )}

            {view === 'send' && selectedToken && (
              <SendTokenForm
                token={selectedToken}
                onSuccess={() => onClose()}
              />
            )}
          </div>
        </div>
      </SideDrawerContent>
    </SideDrawer>
  );
}
