import { Select, Tooltip } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAtom } from 'jotai';
import React, { type Dispatch, type SetStateAction } from 'react';
import { MdArrowDropDown } from 'react-icons/md';

import { BONUS_REWARD_POSITION } from '@/constants';
import { type Listing, type Rewards } from '@/features/listings';
import { type SubmissionWithUser } from '@/interface/submission';
import { cleanRewards, getRankLabels, sortRank } from '@/utils/rank';

import { selectedSubmissionAtom } from '../..';

interface Props {
  bounty: Listing | undefined;
  submissions: SubmissionWithUser[];
  usedPositions: number[];
  isHackathonPage?: boolean;
  setRemainings: Dispatch<
    SetStateAction<{ podiums: number; bonus: number } | null>
  >;
}

export const SelectWinner = ({
  bounty,
  submissions,
  usedPositions,
  setRemainings,
  isHackathonPage,
}: Props) => {
  const queryClient = useQueryClient();
  const rewards = sortRank(cleanRewards(bounty?.rewards));

  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const isProject = bounty?.type === 'project';

  const { mutate: toggleWinner } = useMutation({
    mutationFn: ({
      id,
      isWinner,
      winnerPosition,
      ask,
    }: {
      id: string;
      isWinner: boolean;
      winnerPosition: number | null;
      ask: number | undefined;
    }) =>
      axios.post(`/api/sponsor-dashboard/submission/toggle-winner/`, {
        id,
        isWinner,
        winnerPosition,
        ask,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', bounty?.slug],
        (old) =>
          old?.map((submission) =>
            submission.id === variables.id
              ? {
                  ...submission,
                  isWinner: variables.isWinner,
                  winnerPosition: variables.winnerPosition ?? undefined,
                }
              : submission,
          ),
      );

      const submissionIndex = submissions.findIndex(
        (s) => s.id === variables.id,
      );
      if (submissionIndex >= 0) {
        const oldPosition: number =
          Number(submissions[submissionIndex]?.winnerPosition) || 0;
        const newPosition = variables.winnerPosition || 0;

        let newUsedPositions = [...usedPositions];
        if (oldPosition && oldPosition !== newPosition) {
          newUsedPositions = newUsedPositions.filter(
            (pos) => pos !== oldPosition,
          );
        }

        if (newPosition) {
          if (
            newPosition === BONUS_REWARD_POSITION &&
            newUsedPositions.filter((n) => n === BONUS_REWARD_POSITION).length <
              (bounty?.maxBonusSpots ?? 0)
          ) {
            newUsedPositions.push(newPosition);
          } else if (!newUsedPositions.includes(newPosition)) {
            newUsedPositions.push(newPosition);
          }
        }

        const updatedSubmission: SubmissionWithUser = {
          ...submissions[submissionIndex],
          isWinner: variables.isWinner,
          winnerPosition: variables.winnerPosition as keyof Rewards | undefined,
        } as SubmissionWithUser;

        setSelectedSubmission(updatedSubmission);

        setRemainings((prevRemainings) => {
          if (!prevRemainings) return prevRemainings;

          const newRemainings = { ...prevRemainings };
          const isNewPositionValid = !isNaN(newPosition) && newPosition !== 0;
          const isOldPositionValid = !isNaN(oldPosition) && oldPosition !== 0;

          if (isNewPositionValid) {
            if (newPosition === BONUS_REWARD_POSITION) {
              newRemainings.bonus--;
            } else {
              newRemainings.podiums--;
            }
          }

          if (isOldPositionValid) {
            if (oldPosition === BONUS_REWARD_POSITION) {
              newRemainings.bonus++;
            } else {
              newRemainings.podiums++;
            }
          }

          return newRemainings;
        });
      }
    },
    onError: (error) => {
      console.error('Failed to toggle winner:', error);
    },
  });

  const selectWinner = async (
    position: number,
    id: string | undefined,
    ask: number | undefined,
  ) => {
    if (!id) return;
    toggleWinner({
      id,
      isWinner: !!position,
      winnerPosition: position || null,
      ask,
    });
  };
  return (
    <Tooltip
      bg={'brand.purple'}
      hasArrow={true}
      isDisabled={!bounty?.isWinnersAnnounced}
      label="You cannot change the winners once the results are published!"
      placement="top"
    >
      <Select
        minW={44}
        maxW={44}
        color="brand.slate.500"
        fontWeight={500}
        textTransform="capitalize"
        borderColor="brand.slate.300"
        _placeholder={{ color: 'brand.slate.300' }}
        focusBorderColor="brand.purple"
        icon={<MdArrowDropDown />}
        isDisabled={!!bounty?.isWinnersAnnounced || isHackathonPage}
        onChange={(e) =>
          selectWinner(
            Number(e.target.value),
            selectedSubmission?.id,
            selectedSubmission?.ask,
          )
        }
        value={
          selectedSubmission?.isWinner
            ? selectedSubmission.winnerPosition || ''
            : ''
        }
      >
        <option>Select Winner</option>
        {rewards.map((reward) => {
          let isRewardUsed = usedPositions.includes(reward);
          if (reward === BONUS_REWARD_POSITION) {
            if (
              usedPositions.filter((u) => u === BONUS_REWARD_POSITION).length <
              (bounty?.maxBonusSpots ?? 0)
            ) {
              isRewardUsed = false;
            }
          }
          const isCurrentSubmissionReward =
            Number(selectedSubmission?.winnerPosition) === reward;
          return (
            (!isRewardUsed || isCurrentSubmissionReward) && (
              <option key={reward} value={reward}>
                {isProject ? 'Winner' : getRankLabels(reward)}
              </option>
            )
          );
        })}
      </Select>
    </Tooltip>
  );
};
