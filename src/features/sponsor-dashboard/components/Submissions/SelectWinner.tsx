import { CloseIcon } from '@chakra-ui/icons';
import { Button, Circle, Flex, Select, Tooltip } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import React, { type Dispatch, type SetStateAction } from 'react';
import { MdArrowDropDown } from 'react-icons/md';

import { BONUS_REWARD_POSITION } from '@/constants';
import { type Listing } from '@/features/listings';
import { useDisclosure } from '@/hooks/use-disclosure';
import { type SubmissionWithUser } from '@/interface/submission';
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
      <Tooltip
        bg={'brand.purple'}
        hasArrow={true}
        isDisabled={!bounty?.isWinnersAnnounced}
        label="You cannot change the winners once the results are published!"
        placement="top"
      >
        {isProject ? (
          <Flex
            className="ph-no-capture"
            align="center"
            justify={'flex-end'}
            gap={2}
            w="fit-content"
          >
            {isPending && (
              <>
                <Button
                  color="#E11D48"
                  bg="#FEF2F2"
                  _hover={{ bg: '#FED7D7' }}
                  isDisabled={isMultiSelectOn}
                  leftIcon={
                    <Circle p={'5px'} bg="#E11D48">
                      <CloseIcon color="white" boxSize="2" />
                    </Circle>
                  }
                  onClick={rejectedOnOpen}
                >
                  Reject
                </Button>
                <Button
                  isDisabled={isMultiSelectOn}
                  onClick={onWinnersAnnounceOpen}
                >
                  Announce As Winner
                </Button>
              </>
            )}
          </Flex>
        ) : (
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
              selectWinner(Number(e.target.value), selectedSubmission?.id)
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
                  <option key={reward} value={reward}>
                    {isProject ? 'Winner' : getRankLabels(reward)}
                  </option>
                )
              );
            })}
          </Select>
        )}
      </Tooltip>
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
