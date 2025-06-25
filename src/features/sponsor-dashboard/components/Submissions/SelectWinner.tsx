import { useAtom } from 'jotai';
import { Check, ChevronDown, X } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { tokenList } from '@/constants/tokenList';
import { useDisclosure } from '@/hooks/use-disclosure';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { cleanRewards, getRankLabels, sortRank } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import type { Listing, Rewards } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../../atoms';
import { useRejectSubmissions } from '../../mutations/useRejectSubmissions';
import { useToggleWinner } from '../../mutations/useToggleWinner';
import { RejectSubmissionModal } from './Modals/RejectModal';

interface Props {
  bounty: Listing | undefined;
  usedPositions: number[];
  isHackathonPage?: boolean;
  onWinnersAnnounceOpen: () => void;
  isMultiSelectOn: boolean;
}

export const SelectWinner = ({
  bounty,
  usedPositions,
  isHackathonPage,
  onWinnersAnnounceOpen,
  isMultiSelectOn,
}: Props) => {
  const rewards = sortRank(cleanRewards(bounty?.rewards));

  const [selectedSubmission] = useAtom(selectedSubmissionAtom);

  const isProject = bounty?.type === 'project';

  const isPending = selectedSubmission?.status === 'Pending';

  const {
    isOpen: rejectedIsOpen,
    onOpen: rejectedOnOpen,
    onClose: rejectedOnClose,
  } = useDisclosure();

  const { mutateAsync: toggleWinner } = useToggleWinner(bounty);

  const rejectSubmissions = useRejectSubmissions(bounty?.slug || '');

  const handleRejectSubmission = (submissionIds: string) => {
    rejectSubmissions.mutate([submissionIds]);
    rejectedOnClose();
  };

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
        {isProject ? (
          <div className="ph-no-capture flex items-center justify-end gap-2">
            {isPending && (
              <>
                <Button
                  variant="destructive"
                  className="rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  disabled={isMultiSelectOn}
                  onClick={rejectedOnOpen}
                >
                  <div className="rounded-full bg-red-600 p-0.5">
                    <X className="size-1 text-white" />
                  </div>
                  Reject
                </Button>
                <Button
                  disabled={isMultiSelectOn}
                  onClick={onWinnersAnnounceOpen}
                  className="rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <div className="rounded-full bg-emerald-600 p-0.5">
                    <Check className="size-1 text-white" />
                  </div>
                  Announce As Winner
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
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
                    className={cn(
                      'w-full justify-between rounded-lg border border-emerald-500 bg-emerald-50 py-4 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600 disabled:opacity-50 data-[state=open]:rounded-b-none data-[state=open]:border-slate-200',
                      isValueSelected && 'pr-10',
                    )}
                  >
                    <div className="flex items-center">
                      <div className="mr-2 rounded-full bg-emerald-600 p-0.5">
                        <Check className="size-1 text-white" />
                      </div>
                      <span className="capitalize">
                        {selectedSubmission?.isWinner &&
                        selectedSubmission.winnerPosition
                          ? getRankLabels(selectedSubmission.winnerPosition) +
                            ' Prize'
                          : 'Select Winner'}
                      </span>
                    </div>
                    {!isValueSelected && <ChevronDown className="size-4" />}
                  </Button>
                </DropdownMenuTrigger>
                {isValueSelected && (
                  <button
                    className="absolute top-1/2 right-4 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-full border border-slate-500 text-slate-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
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
                )}
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
                            {getRankLabels(reward)}
                          </p>
                          <div className="flex items-center gap-1">
                            {bounty?.token && (
                              <div className="flex items-center gap-1">
                                <img
                                  src={
                                    tokenList.find(
                                      (t) => t.tokenSymbol === bounty?.token,
                                    )?.icon
                                  }
                                  alt="token"
                                  className="h-4 w-4"
                                />
                                <p className="font-semibold text-slate-700">
                                  {bounty?.compensationType === 'fixed'
                                    ? bounty?.rewards &&
                                      formatNumberWithSuffix(
                                        bounty?.rewards[
                                          reward as keyof Rewards
                                        ] ?? 0,
                                        2,
                                        true,
                                      )
                                    : selectedSubmission?.ask}
                                </p>
                                <span className="text-slate-400">
                                  {bounty?.token}
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
          </div>
        )}
      </div>
      <RejectSubmissionModal
        onRejectSubmission={handleRejectSubmission}
        rejectIsOpen={rejectedIsOpen}
        submissionId={selectedSubmission?.id}
        applicantName={selectedSubmission?.user.firstName}
        rejectOnClose={rejectedOnClose}
      />
    </>
  );
};
