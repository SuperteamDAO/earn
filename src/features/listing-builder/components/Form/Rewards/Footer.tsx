import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { calculateTotalPrizes } from '@/features/listing-builder';

import { useListingForm } from '../../../hooks';
import { TokenLabel } from './Tokens';

function RewardsFooter({ closeSheet }: { closeSheet: () => void }) {
  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
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

  const totalPrize = useMemo(
    () => calculateTotalPrizes(rewards, maxBonusSpots || 0),
    [type, maxBonusSpots],
  );

  return (
    <div className="w-full space-y-4">
      {!!rewardAmount && rewardAmount <= 100 && (
        <p className="text-[0.8rem] text-muted-foreground">
          {`Note: This listing will not show up on Earn's Landing Page since it is ≤$100 in value. Increase the total compensation for better discoverability.`}
        </p>
      )}
      <div className="flex items-center justify-between text-sm font-medium">
        {type !== 'project' ? (
          <span className="flex gap-2">
            <p className="">{totalPrize}</p>
            <p className="text-slate-400">
              Total {totalPrize > 1 ? 'Prizes' : 'Prize'}
            </p>
          </span>
        ) : (
          <p className="text-slate-400">Total Prize</p>
        )}
        <TokenLabel showIcon showSymbol amount={rewardAmount} />
      </div>
      <Button
        type="submit"
        className="w-full"
        onClick={async () => {
          if (await form.validateRewards()) {
            closeSheet();
          }
        }}
      >
        Continue
      </Button>
    </div>
  );
}
export { RewardsFooter as Footer };
