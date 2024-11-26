import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import {
  Box,
  Divider,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  useClipboard,
} from '@chakra-ui/react';
import React from 'react';
import { type IconType } from 'react-icons';
import { FaTelegram, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  username: string;
  id: string;
}

interface SocialPlatform {
  name: string;
  icon: IconType;
  share: (url: string, message: string) => void;
}

export const ShareProfile = ({ isOpen, onClose, username, id }: Props) => {
  const { hasCopied, onCopy } = useClipboard(`${getURL()}t/${username}`);

  const { user } = useUser();

  const shareMessage =
    id === user?.id
      ? '欢迎查看我在 Solar Earn 上的个人信息'
      : '欢迎在 Solar Earn 查看这个项目！';

  const socialPlatforms: SocialPlatform[] = [
    {
      name: 'Twitter',
      icon: FaXTwitter,
      share: (url, message) => {
        const encodedMessage = encodeURIComponent(message);
        const encodedUrl = encodeURIComponent(url);
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
          '_blank',
        );
      },
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      share: (url, message) => {
        const encodedMessage = encodeURIComponent(message);
        const encodedUrl = encodeURIComponent(url);
        window.open(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
          '_blank',
        );
      },
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      share: (url, message) => {
        const encodedMessage = encodeURIComponent(`${message} ${url}`);
        window.open(
          `https://api.whatsapp.com/send?text=${encodedMessage}`,
          '_blank',
        );
      },
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent h={'max'} py={5}>
        <Box px={6} py={3}>
          <Text color={'brand.slate.900'} fontSize="lg" fontWeight={500}>
            分享
          </Text>
          <Text mt={3} color={'brand.slate.500'} fontSize="lg" fontWeight={500}>
            社交媒体上展示您的作品
          </Text>
        </Box>
        <Divider mt={2} mb={4} borderColor={'brand.slate.200'} />
        <Box px={6}>
          <InputGroup>
            <Input
              overflow="hidden"
              color="brand.slate.500"
              fontSize="lg"
              fontWeight={500}
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              focusBorderColor="#CFD2D7"
              isReadOnly
              value={`${getURL()}t/${username}`}
            />
            <InputRightElement h="100%" mr="1rem">
              {hasCopied ? (
                <CheckIcon h="1.3rem" w="1.3rem" color="brand.slate.500" />
              ) : (
                <CopyIcon
                  onClick={onCopy}
                  cursor="pointer"
                  h="1.3rem"
                  w="1.3rem"
                  color="brand.slate.500"
                />
              )}
            </InputRightElement>
          </InputGroup>
          <Text
            mt={6}
            color={'brand.slate.400'}
            fontSize={'sm'}
            fontWeight={500}
          >
            分享给
          </Text>
          <Flex gap={4} mt={3} mb={4}>
            {socialPlatforms.map(({ name, icon, share }) => (
              <Icon
                key={name}
                as={icon}
                boxSize={6}
                color={'brand.slate.600'}
                cursor="pointer"
                onClick={() => share(`${getURL()}t/${username}`, shareMessage)}
              />
            ))}
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
};
