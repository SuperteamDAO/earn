import {
  Button,
  Collapse,
  Flex,
  HStack,
  Text,
  Textarea,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { LoginWrapper } from '@/components/LoginWrapper';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { type Comment as IComment } from '@/interface/comments';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { getURL } from '@/utils/validUrl';

import { autoResize, formatFromNow } from '../../utils';
import { WarningModal } from '../WarningModal';

interface Props {
  comment: IComment;
  refId: string;
  refType: 'BOUNTY' | 'SUBMISSION';
  sponsorId: string | undefined;
  isReply?: boolean;
  addNewReply?: (msg: string) => Promise<void>;
}

export const Comment = ({
  comment,
  sponsorId,
  refId,
  refType,
  isReply = false,
  addNewReply,
}: Props) => {
  const { userInfo } = userStore();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [triggerLogin, setTriggerLogin] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replies, setReplies] = useState(comment?.replies ?? []);
  const [newReply, setNewReply] = useState('');
  const [newReplyLoading, setNewReplyLoading] = useState(false);
  const [newReplyError, setNewReplyError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addNewReplyLvl1 = async (msg: string) => {
    const newReplyData = await axios.post(`/api/comment/create`, {
      message: msg,
      listingType: refType,
      listingId: refId,
      replyToId: comment?.id ?? null,
    });
    setReplies((prevReplies) => [newReplyData.data, ...prevReplies]);
  };

  const date = formatFromNow(dayjs(comment?.updatedAt).fromNow());

  const handleSubmit = async () => {
    if (!userInfo?.id) {
      setTriggerLogin(true);
    } else if (!userInfo?.isTalentFilled) {
      onOpen();
    } else {
      try {
        setNewReplyLoading(true);
        setNewReplyError(false);

        if (addNewReply) {
          await addNewReply(newReply);
        } else {
          await addNewReplyLvl1(newReply);
        }

        setNewReply('');
        setNewReplyLoading(false);
        setShowReplyInput(false);
      } catch (e) {
        console.log('error - ', e);
        setNewReplyError(true);
        setNewReplyLoading(false);
      }
    }
  };

  useEffect(() => {
    if (inputRef.current) autoResize(inputRef.current);
  }, [newReply]);

  return (
    <>
      {isOpen && (
        <WarningModal
          isOpen={isOpen}
          onClose={onClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before commenting on the bounty.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
        />
      )}
      <LoginWrapper
        triggerLogin={triggerLogin}
        setTriggerLogin={setTriggerLogin}
      />
      <HStack
        key={comment.id}
        align="start"
        gap={3}
        w="full"
        px={isReply ? 0 : 6}
      >
        <Link
          href={`${getURL()}t/${comment?.author?.username}`}
          tabIndex={-1}
          target="_blank"
          style={{
            minWidth: isReply ? '28px' : '36px',
            maxWidth: isReply ? '28px' : '36px',
          }}
        >
          <UserAvatar size={isReply ? '28px' : '36px'} user={comment?.author} />
        </Link>

        <VStack align={'start'} gap={0} w="full">
          <HStack align="end" gap={2}>
            <Link
              href={`${getURL()}t/${comment?.author?.username}`}
              tabIndex={-1}
              target="_blank"
            >
              <Text color="brand.slate.800" fontSize="sm" fontWeight={500}>
                {`${comment?.author?.firstName} ${comment?.author?.lastName}`}
              </Text>
            </Link>
            {comment?.author?.currentSponsorId === sponsorId && (
              <Text
                gap={0.5}
                display="flex"
                pb="2px"
                color="blue.500"
                fontSize="xxs"
                fontWeight={500}
              >
                <Image
                  width={13}
                  height={13}
                  alt="Sponsor Verified Icon"
                  src="/assets/icons/verified-tick.svg"
                />
                Sponsor
              </Text>
            )}
            <Text
              pb="2px"
              color="brand.slate.400"
              fontSize="xxs"
              fontWeight={500}
            >
              {date}
            </Text>
          </HStack>
          <Text mt={'0px !important'} color="brand.slate.500" fontSize="sm">
            {comment?.message}
          </Text>
          <HStack pt={2}>
            <Button
              pos="relative"
              left="-3px"
              color="brand.slate.900"
              fontSize="xs"
              bg="none"
              onClick={() => setShowReplyInput((prev) => !prev)}
              variant="link"
            >
              Reply
            </Button>
          </HStack>
          <Collapse
            animateOpacity
            in={showReplyInput}
            style={{ width: '100%' }}
          >
            <VStack gap={4} w={'full'} mb={4} pt={4}>
              <HStack align="start" gap={3} w="full">
                <UserAvatar user={userInfo} size="28px" />
                <Textarea
                  ref={inputRef}
                  overflowY="hidden"
                  h="50px"
                  pt={0}
                  fontSize="sm"
                  borderColor="brand.slate.200"
                  _placeholder={{
                    color: 'brand.slate.400',
                  }}
                  resize="none"
                  focusBorderColor="brand.purple"
                  onChange={(e) => {
                    setNewReply(e.target.value);
                  }}
                  placeholder="Write a comment"
                  rows={1}
                  value={newReply}
                  variant="flushed"
                />
              </HStack>
              {!!newReplyError && (
                <Text my={0} mt={4} color="red" fontSize="xs">
                  Error in adding your comment! Please try again!
                </Text>
              )}
              <Collapse
                animateOpacity
                in={!!newReply}
                style={{ width: '100%' }}
              >
                <Flex justify={'end'} gap={4} w="full">
                  <Button
                    h="auto"
                    px={5}
                    py={2}
                    color="brand.slate.800"
                    fontSize="xxs"
                    fontWeight={500}
                    bg="brand.slate.200"
                    _hover={{
                      bg: 'brand.slate.300',
                    }}
                    _active={{
                      bg: 'brand.slate.400',
                    }}
                    isDisabled={!!newReplyLoading || !newReply}
                    isLoading={!!newReplyLoading}
                    loadingText="Adding..."
                    onClick={() => handleSubmit()}
                  >
                    Reply
                  </Button>
                </Flex>
              </Collapse>
            </VStack>
          </Collapse>
          <VStack gap={1} w="full" pt={4}>
            {replies
              ?.toReversed()
              .map((reply) => (
                <Comment
                  addNewReply={addNewReplyLvl1}
                  isReply
                  key={reply.id}
                  refType={refType}
                  sponsorId={sponsorId}
                  comment={reply}
                  refId={refId}
                />
              ))}
          </VStack>
        </VStack>
      </HStack>
    </>
  );
};
