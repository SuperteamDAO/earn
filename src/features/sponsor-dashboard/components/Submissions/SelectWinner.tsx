import { useAtom } from 'jotai';
import { X } from 'lucide-react';
import React, { type Dispatch, type SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDisclosure } from '@/hooks/use-disclosure';
import { type SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { cleanRewards, getRankLabels, sortRank } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { type Listing } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../../atoms';
import { useRejectSubmissions } from '../../mutations/useRejectSubmissions';
import { useToggleWinner } from '../../mutations/useToggleWinner';
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
                'h-10 w-40 border-slate-300 font-medium capitalize text-slate-700',
                'focus:border-brand-purple focus:ring-brand-purple',
              )}
            >
              <SelectValue
                className="placeholder:text-slate-800"
                placeholder="Select Winner"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">Select Winner</SelectItem>
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
                    <SelectItem
                      className="capitalize"
                      key={reward}
                      value={reward.toString()}
                    >
                      {isProject ? 'Winner' : getRankLabels(reward)}
                    </SelectItem>
                  )
                );
              })}
            </SelectContent>
          </Select>
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
