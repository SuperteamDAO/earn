import { BONUS_REWARD_POSITION, MAX_BONUS_SPOTS, MAX_PODIUMS } from "@/constants";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { TokenNumberInput } from "../Tokens";
import { getRankLabels } from "@/utils/rank";
import { useCallback, useEffect, useMemo } from "react";
import { useListingForm } from "@/features/listing-builder/hooks";
import { useWatch } from "react-hook-form";
import { useSetAtom } from "jotai";
import { listingTotalPrizesAtom } from "@/features/listing-builder/atoms";

export const Podiums = () => {
  const form = useListingForm();

  const totalPrizes = useSetAtom(listingTotalPrizesAtom)
  const rewards = useWatch({
    control: form.control,
    name: 'rewards',
  }) || {"1": NaN};

  useEffect(() => {
    console.log('rewards', rewards)
  }, [rewards]);
  useEffect(() => {
    console.log('form errors', form.formState.errors)
  }, [form]);

  const maxBonusSpots = useWatch({
    control: form.control,
    name: 'maxBonusSpots',
  }) || NaN;

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
    [rewards]
  );

  const updateTotalReward = useCallback(
    (currentRewards: Record<string, number>) => {
      const regularSum = Object.entries(currentRewards).reduce(
        (sum, [pos, value]) => {
          if (isNaN(value)) return sum;

          if (Number(pos) === BONUS_REWARD_POSITION) {
            return sum + value * (maxBonusSpots || 0);
          }
          return sum + value;
        },
        0
      );

      form.setValue('rewardAmount', regularSum, { shouldValidate: true });

      const numRegularRewards = Object.keys(currentRewards).filter(
        (pos) => Number(pos) !== BONUS_REWARD_POSITION
      ).length;
      const numBonusSpots =
        currentRewards[BONUS_REWARD_POSITION] !== undefined
          ? maxBonusSpots || 0
          : 0;
      const totalPrizesCount = numRegularRewards + numBonusSpots;
      totalPrizes(totalPrizesCount);
    },
    [form, maxBonusSpots]
  );

  const addReward = useCallback(() => {
    const nextPosition =
      rewardPositions.length > 0
        ? Math.max(...rewardPositions) + 1
        : 1;

    const updatedRewards = {
      ...rewards,
      [nextPosition]: NaN,
    };

    form.setValue('rewards', updatedRewards);
    updateTotalReward(updatedRewards);
  }, [form, rewards, rewardPositions, updateTotalReward]);


  const removeReward = useCallback((position: number) => {
    const { [position]: removed, ...rest } = rewards;
    const reindexedRewards = Object.entries(rest).reduce((acc, [key, value]) => {
      const pos = Number(key);
      if (pos === BONUS_REWARD_POSITION) return { ...acc, [key]: value };
      const newPos = pos > position ? pos - 1 : pos;
      return { ...acc, [newPos]: value };
    }, {});

    form?.setValue("rewards", reindexedRewards);
    updateTotalReward(reindexedRewards);
  }, [form, rewards, updateTotalReward]);

  const addBonusReward = useCallback(() => {
    const updatedRewards = {
      ...rewards,
      [BONUS_REWARD_POSITION]: NaN
    };
    form?.setValue("rewards", updatedRewards);
    form?.setValue("maxBonusSpots", 1);
    updateTotalReward(updatedRewards);
  }, [form, rewards, updateTotalReward]);

  const removeBonusReward = useCallback(() => {
    const { [BONUS_REWARD_POSITION]: removed, ...rest } = rewards;
    form?.setValue("rewards", rest);
    form?.setValue("maxBonusSpots", undefined);
    updateTotalReward(rest);
  }, [form, rewards, updateTotalReward]);

  return (
    <div className="space-y-4">
      <FormField
        key="rewards"
        name="rewards"
        render={() => (
          <FormItem>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 border rounded-md">
              {rewardPositions.map((position) => (
                <FormField
                  key={position}
                  name={`rewards.${position}`}
                  render={({field}) => (
                    <FormItem className="flex flex-col gap-2 relative group">
                      <div className="flex justify-between">
                        <FormLabel className="w-24 capitalize">
                          {getRankLabels(position)} Prize
                        </FormLabel>
                      </div>
                      <FormControl>
                        <div className='relative'>
                          <TokenNumberInput
                            {...field}
                            placeholder='Enter Reward'
                            className='pr-6'
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              const updatedRewards = {
                                ...rewards,
                                [position]: value ?? NaN
                              };
                              updateTotalReward(updatedRewards);
                            }}
                            onBlur={(event) => {
                              // react form hook has a bug where onblur error is not set when only one podium reward is available before adding any value
                              if(!event.target.value) {
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
                              className="absolute top-0 right-0 hidden group-hover:flex text-muted-foreground hover:text-destructive"
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
                <div className="flex flex-col gap-2 relative group">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 space-y-2">
                      <FormField
                        name={`rewards."${BONUS_REWARD_POSITION}"`}
                        render={({field}) => (
                          <FormItem>
                            <div className="flex justify-between py-1.5">
                              <FormLabel className="w-24">Bonus Per Prize</FormLabel>
                            </div>
                            <FormControl>
                              <TokenNumberInput
                                {...field}
                                placeholder='Enter Bonus per Prize'
                                className='rounded-r-none relative focus-within:z-10'
                                value={field.value}
                                onChange={(value) => {
                                  field.onChange(value);
                                  const updatedRewards = {
                                    ...rewards,
                                    [BONUS_REWARD_POSITION]: value ?? 0
                                  };
                                  updateTotalReward(updatedRewards);
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
                          <FormItem>
                            <FormLabel># of Prizes</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <TokenNumberInput
                                  placeholder="Enter Bonus Spots"
                                  {...field}
                                  min={1}
                                  max={MAX_BONUS_SPOTS}
                                  onChange={(value) => {
                                    field.onChange(value);
                                    updateTotalReward(rewards);
                                  }}
                                  hideToken
                                  className='rounded-l-none relative focus-within:z-10 pr-6'
                                />
                                <Button 
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={removeBonusReward}
                                  className="absolute top-0 right-0 hidden group-hover:flex text-muted-foreground hover:text-destructive"
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
                    name={`rewards."${BONUS_REWARD_POSITION}"`}
                    render={() => (
                      <FormItem className="flex flex-col gap-2 relative group">
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxBonusSpots"
                    render={() => (
                      <FormItem className="flex flex-col gap-2 relative group">
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="flex gap-2 justify-between">
                {rewardPositions.length < MAX_PODIUMS && (
                  <Button
                    size="sm"
                    type="button"
                    onClick={addReward}
                    variant="link"
                    className="flex items-center gap-2 px-0"
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
                    className="flex items-center gap-2 px-0 text-slate-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add Bonus Prize
                  </Button>
                )}
              </div>
              <FormMessage />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
