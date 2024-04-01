import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  AlertTitle,
  Button,
  Collapse,
  Fade,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { LoginWrapper } from '@/components/LoginWrapper';
import { AutoResizeTextarea } from '@/components/shared/autosize-textarea';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { type Comment as IComment } from '@/interface/comments';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { getURL } from '@/utils/validUrl';

import { formatFromNow } from '../../utils';
import { WarningModal } from '../WarningModal';

interface Props {
  comment: IComment;
  refId: string;
  refType: 'BOUNTY' | 'SUBMISSION';
  sponsorId: string | undefined;
  deleteComment: (commentId: string) => Promise<void>;
  isReply?: boolean;
  addNewReply?: (msg: string) => Promise<void>;
}

export const Comment = ({
  comment,
  sponsorId,
  refId,
  refType,
  deleteComment,
  isReply = false,
  addNewReply,
}: Props) => {
  const { userInfo } = userStore();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: deleteIsOpen,
    onOpen: deleteOnOpen,
    onClose: deleteOnClose,
  } = useDisclosure();
  const [triggerLogin, setTriggerLogin] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment?.replies ?? []);
  const [newReply, setNewReply] = useState('');
  const [newReplyLoading, setNewReplyLoading] = useState(false);
  const [newReplyError, setNewReplyError] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const cancelRef = useRef<any>(null);

  useEffect(() => {
    const reply = localStorage.getItem(`comment-${refId}-${comment.id}`);
    if (reply) {
      setNewReply(reply);
      setShowReplies(true);
      setShowReplyInput(true);
      localStorage.removeItem(`comment-${refId}-${comment.id}`);
    }
  }, []);

  const deleteReplyLvl1 = async (replyId: string) => {
    const replyIndex = replies.findIndex((reply) => reply.id === replyId);
    if (replyIndex > -1) {
      await axios.delete(`/api/comment/${replyId}/delete`);
      setReplies((prevReplies) => {
        const newReplies = [...prevReplies];
        newReplies.splice(replyIndex, 1);
        return newReplies;
      });
    } else {
      throw new Error('Reply not found');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(false);
    try {
      await deleteComment(comment.id);
      setDeleteLoading(false);
      deleteOnClose();
    } catch (e) {
      console.log('error - ', e);
      setDeleteError(true);
      setDeleteLoading(false);
    }
  };

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
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
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
              <Text
                color="brand.slate.800"
                fontSize={{
                  base: 'sm',
                  '2xl': 'medium',
                }}
                fontWeight={500}
              >
                {`${comment?.author?.firstName} ${comment?.author?.lastName}`}
              </Text>
            </Link>
            {comment?.author?.currentSponsorId === sponsorId && (
              <Text
                gap={0.5}
                display="flex"
                pb="2px"
                color="blue.500"
                fontSize={{
                  base: 'xx-small',
                  '2xl': 'sm',
                }}
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
              fontSize={{
                base: 'xx-small',
                '2xl': 'sm',
              }}
              fontWeight={500}
            >
              {date}
            </Text>
          </HStack>
          <Text
            mt={'0px !important'}
            color="brand.slate.500"
            fontSize={{
              base: 'sm',
              '2xl': 'md',
            }}
          >
            {comment?.message}
          </Text>
          <HStack pt={2}>
            {replies?.length > 0 && (
              <Button
                pos="relative"
                left="-3px"
                color="brand.purple.dark"
                fontSize={{
                  base: 'sm',
                  '2xl': 'md',
                }}
                bg="none"
                onClick={() => setShowReplies((prev) => !prev)}
                variant="link"
              >
                <svg
                  style={{ marginRight: '4px' }}
                  width="7"
                  height="4"
                  viewBox="0 0 7 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.375 0.25L3.5 3.375L6.625 0.25H0.375Z"
                    fill="#4F46E5"
                  />
                </svg>
                {replies?.length} {replies?.length === 1 ? 'Reply' : 'Replies'}
              </Button>
            )}
            <Button
              pos="relative"
              left="-3px"
              color="brand.slate.900"
              fontSize={{
                base: 'sm',
                '2xl': 'md',
              }}
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
                <AutoResizeTextarea
                  pt={0}
                  fontSize={{
                    base: 'sm',
                    '2xl': 'md',
                  }}
                  borderColor="brand.slate.200"
                  _placeholder={{
                    color: 'brand.slate.400',
                  }}
                  focusBorderColor="brand.purple"
                  onChange={(e) => {
                    localStorage.setItem(
                      `comment-${refId}-${comment.id}`,
                      e.target.value,
                    );
                    setNewReply(e.target.value);
                  }}
                  placeholder="Write a comment"
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
                    fontSize={{
                      base: 'xx-small',
                      '2xl': 'sm',
                    }}
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
          <Collapse animateOpacity in={showReplies} style={{ width: '100%' }}>
            <VStack gap={3} w="full" pt={4}>
              {replies
                ?.toReversed()
                .map((reply) => (
                  <Comment
                    deleteComment={deleteReplyLvl1}
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
          </Collapse>
        </VStack>
        <Fade
          in={showOptions && comment.authorId === userInfo?.id}
          style={{ display: 'block' }}
        >
          <Menu>
            <MenuButton>
              <button style={{ padding: '0 0.5rem' }}>
                <svg
                  width="3"
                  height="12"
                  viewBox="0 0 3 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 3C2.325 3 3 2.325 3 1.5C3 0.675 2.325 0 1.5 0C0.675 0 0 0.675 0 1.5C0 2.325 0.675 3 1.5 3ZM1.5 4.5C0.675 4.5 0 5.175 0 6C0 6.825 0.675 7.5 1.5 7.5C2.325 7.5 3 6.825 3 6C3 5.175 2.325 4.5 1.5 4.5ZM1.5 9C0.675 9 0 9.675 0 10.5C0 11.325 0.675 12 1.5 12C2.325 12 3 11.325 3 10.5C3 9.675 2.325 9 1.5 9Z"
                    fill="#94A3B8"
                  />
                </svg>
              </button>
            </MenuButton>
            <MenuList minW="10rem" px={1} py={1}>
              <MenuItem
                color="brand.slate.500"
                fontSize={{
                  base: 'sm',
                  '2xl': 'md',
                }}
                fontWeight={500}
                onClick={deleteOnOpen}
                rounded="sm"
                tabIndex={-1}
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Fade>
      </HStack>
      <AlertDialog
        isOpen={deleteIsOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteOnClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Comment
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You {"can't"} undo this action afterwards.
              {deleteError && (
                <Alert mt={3} rounded="md" status="error">
                  <AlertIcon />
                  <VStack>
                    <AlertTitle>Failed to delete comment</AlertTitle>
                    <AlertDescription alignSelf="start">
                      Please try again later.
                    </AlertDescription>
                  </VStack>
                </Alert>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteOnClose} variant="ghost">
                Cancel
              </Button>
              <Button
                ml={3}
                disabled={deleteLoading}
                isLoading={deleteLoading}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
