import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { tokenUsdValueQuery } from '@/features/listing-builder/queries/token-usd-value';
import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';

import { useListingForm } from '../../../hooks';
import { RewardsLabel } from './Sheet';

function RewardsFooter({ setOpen }: { setOpen: (open: boolean) => void }) {
  const form = useListingForm();
  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  });
  const maxBonusSpots = useWatch({
    control: form.control,
    name: 'maxBonusSpots',
  });
  const rewardAmount = useWatch({
    control: form.control,
    name: 'rewardAmount',
  });
  const token = useWatch({
    control: form.control,
    name: 'token',
  });

  const totalPrize = useMemo(
    () => calculateTotalPrizes(rewards, maxBonusSpots || 0),
    [maxBonusSpots, rewards],
  );

  const { data: tokenUsdValueData } = useQuery(
    tokenUsdValueQuery(token as string | undefined),
  );
  const tokenUsdValue =
    typeof tokenUsdValueData === 'number' ? tokenUsdValueData : 1;

  const totalUsdPrize = (tokenUsdValue || 1) * (rewardAmount || 0);

  return (
    <div className="w-full space-y-4 bg-white">
      {!!tokenUsdValue && totalUsdPrize <= 100 && (
        <p className="text-[0.8rem] text-yellow-600">
          {`Note: This listing will not show up on Earn's Landing Page since it is ≤$100 in value. Increase the total compensation for better discoverability.`}
        </p>
      )}
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="flex gap-2">
          <p className="">{totalPrize}</p>
          <p className="text-slate-400">
            Total {totalPrize > 1 ? 'Prizes' : 'Prize'}
          </p>
        </span>
        <div className="flex">
          <RewardsLabel hideCompensationType />
        </div>
      </div>
      <Button
        type="button"
        className="w-full"
        onClick={async () => {
          if (await form.validateRewards()) {
            setOpen(false);
          } else {
            toast.warning('Please resolve all errors in Rewards to Continue');
          }
        }}
      >
        Continue
      </Button>
    </div>
  );
}
export { RewardsFooter as Footer };
