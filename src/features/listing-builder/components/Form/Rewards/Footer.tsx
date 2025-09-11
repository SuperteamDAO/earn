import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { tokenList } from '@/constants/tokenList';

import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

import { useListingForm } from '../../../hooks';
import { hasMoreThan72HoursLeft } from '../Boost/utils';
import { RewardsLabel } from './Sheet';

function RewardsFooter({
  panel,
  setPanel,
  setOpen,
}: {
  panel: 'rewards' | 'boost';
  setPanel: (panel: 'rewards' | 'boost') => void;
  setOpen: (open: boolean) => void;
}) {
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
  const token = useWatch({
    control: form.control,
    name: 'token',
  });
  const compensationType = useWatch({
    control: form.control,
    name: 'compensationType',
  });
  const minRewardAsk = useWatch({
    control: form.control,
    name: 'minRewardAsk',
  });
  const maxRewardAsk = useWatch({
    control: form.control,
    name: 'maxRewardAsk',
  });
  const deadline = useWatch({
    control: form.control,
    name: 'deadline',
  });

  const [tokenUsdValue, setTokenUsdValue] = useState<number | null>(null);

  const rewardsSnapshotRef = useRef<any>(null);
  const rewardAmountSnapshotRef = useRef<number | null>(null);

  const totalPrize = useMemo(
    () => calculateTotalPrizes(rewards, maxBonusSpots || 0),
    [type, maxBonusSpots, rewards],
  );

  const deadlineMoreThan72HoursLeft = hasMoreThan72HoursLeft(deadline);

  const totalUsdPrize = useMemo(() => {
    if (type !== 'project') return (tokenUsdValue || 1) * (rewardAmount || 0);
    else {
      if (compensationType === 'fixed')
        return (tokenUsdValue || 1) * (rewardAmount || 0);
      else if (compensationType === 'range')
        return (
          (tokenUsdValue || 1) *
          (((minRewardAsk || 0) + (maxRewardAsk || 0)) / 2)
        );
      else if (compensationType === 'variable') return 1000;
    }
    return 0;
  }, [
    tokenUsdValue,
    rewardAmount,
    type,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
  ]);

  const debouncedFetchTokenValue = useMemo(
    () =>
      debounce(async (tokenSymbol: string) => {
        try {
          const tokenItem = tokenList.find(
            (s) => s.tokenSymbol === tokenSymbol,
          );
          if (tokenItem) {
            const usdValue = await fetchTokenUSDValue(tokenItem.mintAddress);
            setTokenUsdValue(usdValue);
          } else {
            setTokenUsdValue(null);
          }
        } catch (error) {
          console.error('Error fetching token USD value:', error);
          setTokenUsdValue(null);
        }
      }, 1000),
    [],
  );

  useEffect(() => {
    if (token) {
      debouncedFetchTokenValue(token);
    } else {
      setTokenUsdValue(1);
    }
    return () => {
      debouncedFetchTokenValue.cancel();
    };
  }, [token, debouncedFetchTokenValue]);

  return (
    <div className="w-full space-y-4 bg-white">
      {!!tokenUsdValue && totalUsdPrize <= 100 && (
        <p className="text-[0.8rem] text-yellow-600">
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
        <div className="flex">
          <RewardsLabel hideCompensationType />
        </div>
      </div>
      {panel === 'boost' && (
        <div>
          <Button
            type="submit"
            className="w-full"
            onClick={async () => {
              if (await form.validateRewards()) {
                setOpen(false);
              } else {
                toast.warning(
                  'Please resolve all errors in Rewards to Continue',
                );
              }
            }}
          >
            Continue
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full text-slate-500"
            onClick={() => {
              if (rewardsSnapshotRef.current !== null) {
                form.setValue('rewards', rewardsSnapshotRef.current, {
                  shouldValidate: true,
                });
              }
              if (rewardAmountSnapshotRef.current !== null) {
                form.setValue('rewardAmount', rewardAmountSnapshotRef.current, {
                  shouldValidate: true,
                });
              }
              form.saveDraft();
              setOpen(false);
            }}
          >
            Skip
          </Button>
        </div>
      )}

      {panel === 'rewards' && (
        <Button
          type="submit"
          className="w-full"
          onClick={async () => {
            if (await form.validateRewards()) {
              if (compensationType === 'fixed' && deadlineMoreThan72HoursLeft) {
                rewardsSnapshotRef.current =
                  rewards !== undefined
                    ? JSON.parse(JSON.stringify(rewards))
                    : null;
                rewardAmountSnapshotRef.current =
                  typeof rewardAmount === 'number' ? rewardAmount : null;
                setPanel('boost');
              } else {
                setOpen(false);
              }
            } else {
              toast.warning('Please resolve all errors in Rewards to Continue');
            }
          }}
        >
          Continue
        </Button>
      )}
    </div>
  );
}
export { RewardsFooter as Footer };
