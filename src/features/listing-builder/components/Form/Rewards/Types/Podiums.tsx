import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
} from '@/constants';
import { calculateTotalRewardsForPodium } from '@/features/listing-builder';
import { getRankLabels } from '@/utils/rank';

import { useListingForm } from '../../../../hooks';
import { TokenNumberInput } from '../Tokens';

export const Podiums = () => {
  const form = useListingForm();

  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  }) || { '1': NaN };

  useEffect(() => {
    console.log('rewards', rewards);
  }, [rewards]);

  const maxBonusSpots =
    useWatch({
      control: form.control,
      name: 'maxBonusSpots',
    }) || NaN;
  useEffect(() => {
    console.log('maxBonusSpots', maxBonusSpots);
  }, [maxBonusSpots]);

  useEffect(() => {
    // react hook form has a bug that saves rewards as array when single item instead of object
    if (Array.isArray(rewards)) {
      const rewardsObject = rewards.reduce((acc, value, index) => {
        acc[index] = value;
        return acc;
      }, {});
      form.setValue('rewards', rewardsObject);
    }
  }, [rewards, form]);

  const rewardPositions = useMemo(
    () =>
      Object.keys(rewards)
        .map(Number)
        .filter((pos) => pos !== BONUS_REWARD_POSITION)
        .sort((a, b) => a - b),
    [rewards],
  );

  const updateTotalReward = useCallback(
    (currentRewards: Record<string, number>, maxBonusSpots?: number) => {
      const totalRewards = calculateTotalRewardsForPodium(
        currentRewards,
        maxBonusSpots,
      );

      form.setValue('rewardAmount', totalRewards, { shouldValidate: true });
      form.saveDraft();
    },
    [form],
  );

  const addReward = useCallback(() => {
    const nextPosition =
      rewardPositions.length > 0 ? Math.max(...rewardPositions) + 1 : 1;

    const updatedRewards = {
      ...rewards,
      [nextPosition]: NaN,
    };

    form.setValue('rewards', updatedRewards);
    updateTotalReward(updatedRewards);
  }, [form, rewards, rewardPositions, updateTotalReward]);

  const removeReward = useCallback(
    (position: number) => {
      //eslint-disable-next-line
    const { [position]: removed, ...rest } = rewards;
      const reindexedRewards = Object.entries(rest).reduce(
        (acc, [key, value]) => {
          const pos = Number(key);
          if (pos === BONUS_REWARD_POSITION) return { ...acc, [key]: value };
          const newPos = pos > position ? pos - 1 : pos;
          return { ...acc, [newPos]: value };
        },
        {},
      );

      form?.setValue('rewards', reindexedRewards);
      updateTotalReward(reindexedRewards);
    },
    [form, rewards, updateTotalReward],
  );

  const addBonusReward = useCallback(() => {
    const updatedRewards = {
      ...rewards,
      [BONUS_REWARD_POSITION]: NaN,
    };
    form?.setValue('rewards', updatedRewards);
    form?.setValue('maxBonusSpots', undefined);
    updateTotalReward(updatedRewards);
  }, [form, rewards, updateTotalReward]);

  const removeBonusReward = useCallback(() => {
    //eslint-disable-next-line
    const { [BONUS_REWARD_POSITION]: removed, ...rest } = rewards;
    form?.setValue('rewards', rest);
    form?.setValue('maxBonusSpots', undefined);
    updateTotalReward(rest);
  }, [form, rewards, updateTotalReward]);

  return (
    <div className="space-y-4">
      <FormField
        key="rewards"
        name="rewards"
        render={() => (
          <FormItem className="gap-2">
            <div className="max-h-[62vh] space-y-4 overflow-y-auto rounded-md border p-4">
              {rewardPositions.map((position, index) => (
                <FormField
                  key={position}
                  name={`rewards.${position}`}
                  render={({ field }) => (
                    <FormItem className="group relative gap-2">
                      <div className="flex justify-between">
                        <FormLabel className="w-24 capitalize">
                          {getRankLabels(position)} Prize
                        </FormLabel>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <TokenNumberInput
                            {...field}
                            placeholder={`${5000 - index * 500}`}
                            className="pr-6"
                            value={rewards[position]}
                            onChange={(value) => {
                              field.onChange(value);
                              const updatedRewards = {
                                ...rewards,
                                [position]: value ?? NaN,
                              };
                              updateTotalReward(updatedRewards);
                            }}
                            onBlur={(event) => {
                              // react form hook has a bug where onblur error is not set when only one podium reward is available before adding any value
                              if (!event.target.value) {
                                form.setError(`rewards.${position}`, {
                                  message: 'Reward amount is required',
                                });
                              }
                            }}
                          />
                          {rewardPositions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeReward(position)}
                              className="absolute right-0 top-0 hidden text-muted-foreground hover:text-destructive group-hover:flex"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {rewards[BONUS_REWARD_POSITION] !== undefined && (
                <div className="group relative flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <FormField
                        name={`rewards.${BONUS_REWARD_POSITION}`}
                        render={({ field }) => (
                          <FormItem className="gap-2">
                            <div className="flex justify-between">
                              <FormLabel className="w-fit">
                                Bonus Per Prize
                              </FormLabel>
                            </div>
                            <FormControl>
                              <TokenNumberInput
                                {...field}
                                placeholder="10"
                                className="relative rounded-r-none focus-within:z-10"
                                value={rewards[BONUS_REWARD_POSITION]}
                                onChange={(value) => {
                                  field.onChange(value);
                                  const updatedRewards = {
                                    ...rewards,
                                    [BONUS_REWARD_POSITION]: value ?? 0,
                                  };
                                  updateTotalReward(
                                    updatedRewards,
                                    maxBonusSpots,
                                  );
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="maxBonusSpots"
                        render={({ field }) => (
                          <FormItem className="gap-2">
                            <FormLabel># of Prizes</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <TokenNumberInput
                                  placeholder="50"
                                  {...field}
                                  min={1}
                                  max={MAX_BONUS_SPOTS}
                                  onChange={(value) => {
                                    field.onChange(value);
                                    updateTotalReward(
                                      rewards,
                                      value || undefined,
                                    );
                                  }}
                                  hideToken
                                  className="relative rounded-l-none pr-6 focus-within:z-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={removeBonusReward}
                                  className="absolute right-0 top-0 hidden text-muted-foreground hover:text-destructive group-hover:flex"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name={`rewards.${BONUS_REWARD_POSITION}`}
                    render={() => (
                      <FormItem className="group relative flex flex-col gap-2">
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxBonusSpots"
                    render={() => (
                      <FormItem className="group relative flex flex-col gap-2">
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="flex justify-between gap-2">
                {rewardPositions.length < MAX_PODIUMS && (
                  <Button
                    size="sm"
                    type="button"
                    onClick={addReward}
                    variant="link"
                    className="flex items-center gap-2 px-0 text-[0.9rem]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Individual Position
                  </Button>
                )}

                {rewards[BONUS_REWARD_POSITION] === undefined && (
                  <Button
                    size="sm"
                    type="button"
                    onClick={addBonusReward}
                    variant="link"
                    className="flex items-center gap-2 px-0 text-[0.9rem] text-slate-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add Bonus Prize
                  </Button>
                )}
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
