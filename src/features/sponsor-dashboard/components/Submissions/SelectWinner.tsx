import { useAtom } from 'jotai';
import { ChevronDown, Trophy, X } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TokenIcon } from '@/components/ui/token-icon';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { cleanRewards, nthLabelGenerator, sortRank } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import type { Listing, Rewards } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../../atoms';
import { useToggleWinner } from '../../mutations/useToggleWinner';

interface Props {
  bounty: Listing | undefined;
  usedPositions: number[];
  isHackathonPage?: boolean;
  isMultiSelectOn: boolean;
}

export const SelectWinner = ({
  bounty,
  usedPositions,
  isHackathonPage,
  isMultiSelectOn,
}: Props) => {
  const rewards = sortRank(cleanRewards(bounty?.rewards));

  const [selectedSubmission] = useAtom(selectedSubmissionAtom);

  const { mutateAsync: toggleWinner } = useToggleWinner(bounty);

  const selectWinner = async (position: number, id: string | undefined) => {
    if (!id) return;
    toggleWinner([
      {
        id,
        isWinner: !!position,
        winnerPosition: position || null,
      },
    ]);
  };

  const isValueSelected = useMemo(
    () =>
      selectedSubmission?.isWinner &&
      selectedSubmission.winnerPosition !== null,
    [selectedSubmission],
  );

  return (
    <>
      <div>
        <div className="relative">
          {!isValueSelected ? (
            <DropdownMenu>
              <div className="relative flex">
                <DropdownMenuTrigger asChild className="min-w-[180px]">
                  <Button
                    variant="outline"
                    disabled={
                      !!bounty?.isWinnersAnnounced ||
                      isHackathonPage ||
                      isMultiSelectOn
                    }
                    className="w-full justify-between rounded-lg border border-emerald-600 bg-emerald-50 py-4 text-emerald-600 transition-all duration-300 ease-out hover:bg-emerald-100 hover:text-emerald-700 disabled:opacity-50 data-[state=open]:rounded-b-none data-[state=open]:border-slate-200"
                  >
                    <div className="flex items-center">
                      <div className="mr-2">
                        <Trophy className="size-4 text-emerald-600 transition-all duration-300 ease-out" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 capitalize">
                        Select Winner
                      </span>
                    </div>
                    <ChevronDown className="size-4 text-emerald-600" />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent
                sideOffset={-1}
                className="w-full min-w-[180px] divide-y divide-slate-100 rounded-t-none p-0"
              >
                {rewards.map((reward) => {
                  let isRewardUsed = usedPositions.includes(reward);
                  if (reward === BONUS_REWARD_POSITION) {
                    if (
                      usedPositions.filter((u) => u === BONUS_REWARD_POSITION)
                        .length < (bounty?.maxBonusSpots ?? 0)
                    ) {
                      isRewardUsed = false;
                    }
                  }
                  const isCurrentSubmissionReward =
                    Number(selectedSubmission?.winnerPosition) === reward;

                  return (
                    (!isRewardUsed || isCurrentSubmissionReward) && (
                      <DropdownMenuItem
                        key={reward}
                        className="cursor-pointer font-medium capitalize"
                        onClick={() =>
                          selectWinner(reward, selectedSubmission?.id)
                        }
                      >
                        <div className="flex w-full justify-between px-0 py-0.5">
                          <p className="text-slate-500">
                            {nthLabelGenerator(reward)}
                          </p>
                          <div className="flex items-center gap-1">
                            {bounty?.token && (
                              <div className="flex items-center gap-1">
                                <TokenIcon
                                  symbol={bounty.token}
                                  alt="token"
                                  className="h-4 w-4"
                                />
                                <p className="font-semibold text-slate-700">
                                  {bounty?.rewards &&
                                    formatNumberWithSuffix(
                                      bounty?.rewards[
                                        reward as keyof Rewards
                                      ] ?? 0,
                                      1,
                                      false,
                                    )}
                                </p>
                                <span className="text-slate-400">
                                  {bounty.token}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="relative flex">
              <Button
                variant="outline"
                disabled={
                  !!bounty?.isWinnersAnnounced ||
                  isHackathonPage ||
                  isMultiSelectOn
                }
                className="w-full justify-between rounded-lg border border-slate-200 bg-white py-4 transition-all duration-300 ease-out hover:bg-slate-50 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <div className="mr-2">
                    <Trophy className="size-4 text-emerald-600 transition-all duration-300 ease-out" />
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 capitalize">
                    {selectedSubmission?.winnerPosition &&
                      nthLabelGenerator(selectedSubmission.winnerPosition)}
                  </span>
                  {selectedSubmission?.winnerPosition && (
                    <>
                      <div className="mx-3 h-4 w-px bg-slate-200" />
                      <div className="flex items-center gap-2">
                        {bounty?.token && (
                          <TokenIcon
                            symbol={bounty.token}
                            alt={bounty.token}
                            className="h-5 w-5 rounded-full"
                          />
                        )}
                        <span className="font-semibold text-slate-900">
                          {bounty?.rewards && bounty?.token && (
                            <>
                              {formatNumberWithSuffix(
                                bounty.rewards[
                                  selectedSubmission.winnerPosition as keyof Rewards
                                ] ?? 0,
                                1,
                                false,
                              )}
                              <span className="ml-1 font-normal text-slate-400">
                                {bounty.token}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  className="flex h-6 w-6 items-center justify-center text-slate-500 transition-all duration-300 ease-out hover:text-slate-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isMultiSelectOn) return;
                    selectWinner(0, selectedSubmission?.id);
                  }}
                  disabled={isMultiSelectOn}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
