import {
  Box,
  Button,
  Divider,
  Flex,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { type TConductorInstance } from 'react-canvas-confetti/dist/types';
import { useTranslation } from 'react-i18next';

import { AuthWrapper } from '@/features/auth';
import { EarnAvatar } from '@/features/talent';
import { useUser } from '@/store/user';

import { pfpsQuery } from '../queries/vibe-pfps';

const dummyUsers = [
  { id: '1', photo: '/assets/pfps/t1.webp' },
  { id: '2', photo: '/assets/pfps/md2.webp' },
  { id: '3', photo: '/assets/pfps/fff1.webp' },
  { id: '55', photo: '' },
  { id: '5', photo: '/assets/pfps/md1.webp' },
  { id: '6', photo: '/assets/pfps/t2.webp' },
  { id: '7', photo: '' },
  { id: '8', photo: '' },
  { id: '9', photo: '' },
  { id: '10', photo: '' },
  { id: '11', photo: '' },
  { id: '12', photo: '' },
  { id: '13', photo: '' },
];

export const VibeCard = () => {
  const { t } = useTranslation();
  const [vibeCount, setVibeCount] = useState(13);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [conductor, setConductor] = useState<TConductorInstance>();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMD = useBreakpointValue({ base: false, md: true });
  const { user } = useUser();

  const { data: fetchedUsers = [] } = useQuery(pfpsQuery(userIds));

  useEffect(() => {
    audioRef.current = new Audio('/assets/memes/chipichapa.mp3');
    audioRef.current.onended = () => setIsAudioPlaying(false);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const shootConfetti = () => {
    conductor?.shoot();
    if (!isAudioPlaying && audioRef.current) {
      audioRef.current
        .play()
        .catch((error) => console.error('Audio play failed:', error));
      setIsAudioPlaying(true);
    }
  };

  const onInit = ({ conductor }: { conductor: TConductorInstance }) => {
    setConductor(conductor);
  };

  useEffect(() => {
    const newWs = new WebSocket('wss://earn-vibe-production.up.railway.app');
    newWs.onmessage = (event) => {
      const { vibeCount: newVibeCount, userIds: newUserIds } = JSON.parse(
        event.data,
      );
      setVibeCount(newVibeCount + 13);
      setUserIds(newUserIds);
    };
    setWs(newWs);
    return () => {
      newWs.close();
    };
  }, []);

  const handleVibeClick = () => {
    if (ws && !!user?.id) {
      ws.send(JSON.stringify({ userId: user.id, action: 'vibe' }));
      shootConfetti();
    }
  };

  const displayUsers = [
    ...dummyUsers.slice(0, Math.max(0, 6 - fetchedUsers.length)),
    ...fetchedUsers,
  ].slice(0, 6);

  return (
    <Flex
      align={'center'}
      justify={'space-between'}
      w="full"
      p={4}
      bg="brand.slate.100"
      borderRadius={8}
    >
      <Flex direction={'column'} gap={{ base: 2, md: 1 }}>
        <Text
          color="brand.slate.500"
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
          whiteSpace={'nowrap'}
        >
          <Text as="span" color="brand.slate.900">
            {vibeCount}{' '}
          </Text>
          {t('VibeCard.peopleVibing')}
        </Text>
        <Flex align={'center'}>
          {displayUsers.map((user, i) => (
            <Box key={user.id} ml={i > 0 ? '-10px' : '0'}>
              <EarnAvatar
                id={user.id}
                avatar={user.photo}
                size={isMD ? '28px' : '24px'}
              />
            </Box>
          ))}
          <Text ml={1} color="brand.slate.400" fontSize={'xs'}>
            +{Math.max(0, vibeCount - 6)}
          </Text>
        </Flex>
      </Flex>
      <Divider mx={4} orientation="vertical" />
      <AuthWrapper>
        <Button
          maxW={40}
          px={10}
          color="brand.slate.500"
          fontSize="sm"
          fontWeight={500}
          bg="white"
          borderColor={'brand.slate.200'}
          onClick={handleVibeClick}
          variant={'outline'}
        >
          {t('VibeCard.clickToVibe')}
        </Button>
      </AuthWrapper>
      <Fireworks onInit={onInit} />
    </Flex>
  );
};
