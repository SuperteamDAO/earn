import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PROJECT_NAME } from '@/constants/project';

import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';

import { useListingForm } from '../../../hooks';
import { RewardsLabel } from './Sheet';

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
    [type, maxBonusSpots, rewards],
  );

  return (
    <div className="w-full space-y-4">
      {!!rewardAmount && rewardAmount <= 100 && (
        <p className="text-[0.8rem] text-yellow-600">
          {`Note: This listing will not show up on ${PROJECT_NAME}'s Landing Page since it is ≤$100 in value. Increase the total compensation for better discoverability.`}
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
        <div className="flex">
          <RewardsLabel hideCompensationType />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full"
        onClick={async () => {
          if (await form.validateRewards()) {
            closeSheet();
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
