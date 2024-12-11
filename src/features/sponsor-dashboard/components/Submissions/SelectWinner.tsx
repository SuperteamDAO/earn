import { TooltipArrow } from '@radix-ui/react-tooltip';
import { useAtom } from 'jotai';
import { ChevronDown, X } from 'lucide-react';
import React, { type Dispatch, type SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BONUS_REWARD_POSITION } from '@/constants';
import { type Listing } from '@/features/listings';
import { useDisclosure } from '@/hooks/use-disclosure';
import { type SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils';
import { cleanRewards, getRankLabels, sortRank } from '@/utils/rank';

import { selectedSubmissionAtom } from '../..';
import { useRejectSubmissions, useToggleWinner } from '../../mutations';
import { RejectSubmissionModal } from './Modals/RejectModal';

interface Props {
  bounty: Listing | undefined;
  submissions: SubmissionWithUser[];
  usedPositions: number[];
  isHackathonPage?: boolean;
  setRemainings: Dispatch<
    SetStateAction<{ podiums: number; bonus: number } | null>
  >;
  onWinnersAnnounceOpen: () => void;
  isMultiSelectOn: boolean;
}

export const SelectWinner = ({
  bounty,
  submissions,
  usedPositions,
  setRemainings,
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

  const { mutateAsync: toggleWinner } = useToggleWinner(
    bounty,
    submissions,
    setRemainings,
    usedPositions,
  );

  const rejectSubmissions = useRejectSubmissions(bounty?.slug || '');

  const handleRejectSubmission = (submissionIds: string) => {
    rejectSubmissions.mutate([submissionIds]);
    rejectedOnClose();
  };

  const selectWinner = async (position: number, id: string | undefined) => {
    if (!id) return;
    toggleWinner({
      id,
      isWinner: !!position,
      winnerPosition: position || null,
    });
  };
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {isProject ? (
                <div className="ph-no-capture flex w-fit items-center justify-end gap-2">
                  {isPending && (
                    <>
                      <Button
                        variant="destructive"
                        className="bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        disabled={isMultiSelectOn}
                        onClick={rejectedOnOpen}
                      >
                        <div className="mr-2 rounded-full bg-red-600 p-[5px]">
                          <X className="h-2 w-2 text-white" />
                        </div>
                        Reject
                      </Button>
                      <Button
                        disabled={isMultiSelectOn}
                        onClick={onWinnersAnnounceOpen}
                      >
                        Announce As Winner
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <Select
                  disabled={!!bounty?.isWinnersAnnounced || isHackathonPage}
                  onValueChange={(value) =>
                    selectWinner(Number(value), selectedSubmission?.id)
                  }
                  value={
                    selectedSubmission?.isWinner
                      ? selectedSubmission.winnerPosition?.toString() || ''
                      : ''
                  }
                >
                  <SelectTrigger
                    className={cn(
                      'w-44 border-slate-300 font-medium capitalize text-slate-500',
                      'focus:border-brand-purple focus:ring-brand-purple',
                    )}
                  >
                    <SelectValue placeholder="Select Winner" />
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select Winner</SelectItem>
                    {rewards.map((reward) => {
                      let isRewardUsed = usedPositions.includes(reward);
                      if (reward === BONUS_REWARD_POSITION) {
                        if (
                          usedPositions.filter(
                            (u) => u === BONUS_REWARD_POSITION,
                          ).length < (bounty?.maxBonusSpots ?? 0)
                        ) {
                          isRewardUsed = false;
                        }
                      }
                      const isCurrentSubmissionReward =
                        Number(selectedSubmission?.winnerPosition) === reward;

                      return (
                        (!isRewardUsed || isCurrentSubmissionReward) && (
                          <SelectItem key={reward} value={reward.toString()}>
                            {isProject ? 'Winner' : getRankLabels(reward)}
                          </SelectItem>
                        )
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </TooltipTrigger>
          {!bounty?.isWinnersAnnounced && (
            <TooltipContent sideOffset={5}>
              You cannot change the winners once the results are published!
              <TooltipArrow className="fill-brand-purple" />
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
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
