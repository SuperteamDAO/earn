import { Box, Button, Divider, Flex, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { type TConductorInstance } from 'react-canvas-confetti/dist/types';

import { AuthWrapper } from '@/features/auth';
import { userStore } from '@/store/user';

import { EarnAvatar } from '../shared/EarnAvatar';

export const VibeCard = () => {
  const [vibeCount, setVibeCount] = useState(13);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [conductor, setConductor] = useState<TConductorInstance>();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const dummyUsers = [
    {
      id: '1',
      photo: '/assets/pfps/t1.png',
    },
    {
      id: '2',
      photo: '/assets/pfps/md2.png',
    },
    {
      id: '3',
      photo: '/assets/pfps/fff1.png',
    },
    {
      id: '55',
      photo: '',
    },
    {
      id: '5',
      photo: '/assets/pfps/md1.png',
    },
    {
      id: '6',
      photo: '/assets/pfps/t2.png',
    },
    {
      id: '7',
      photo: '',
    },
    {
      id: '8',
      photo: '',
    },
    {
      id: '9',
      photo: '',
    },
    {
      id: '10',
      photo: '',
    },
    {
      id: '11',
      photo: '',
    },
    {
      id: '12',
      photo: '',
    },
    {
      id: '13',
      photo: '',
    },
  ];

  const [users, setUsers] =
    useState<{ id: string; photo: string }[]>(dummyUsers);
  const { userInfo } = userStore();

  const fetchUserData = async (userIds: string[]) => {
    const maxPfps = 6;
    try {
      const latestUserIds = userIds.slice(-maxPfps);
      const responses = await Promise.all(
        latestUserIds.map((id) =>
          axios.post('/api/feed/viberPfp', { id }).then((res) => res.data),
        ),
      );
      const remainingSlots = Math.max(0, maxPfps - responses.length);
      setUsers([...dummyUsers.slice(0, remainingSlots), ...responses]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData(userIds);
  }, [userIds]);

  useEffect(() => {
    const newWs = new WebSocket('wss://earn-vibe-production.up.railway.app');
    newWs.onmessage = (event) => {
      const { vibeCount, userIds } = JSON.parse(event.data);
      setVibeCount(vibeCount + 13);
      setUserIds(userIds);
    };
    setWs(newWs);
    return () => {
      newWs.close();
    };
  }, []);

  const handleVibeClick = () => {
    if (ws && !!userInfo?.id) {
      ws.send(JSON.stringify({ userId: userInfo.id, action: 'vibe' }));
      shootConfetti();
    }
  };

  return (
    <Flex
      align={'center'}
      justify={'space-between'}
      p={4}
      bg="brand.slate.100"
      borderRadius={8}
    >
      <Flex direction={'column'}>
        <Text
          color="brand.slate.500"
          fontSize="sm"
          fontWeight={500}
          whiteSpace={'nowrap'}
        >
          <Text as="span" color="brand.slate.900">
            {vibeCount}{' '}
          </Text>
          people vibing rn
        </Text>
        <Flex align={'center'}>
          {users.map((user, i) => (
            <Box key={user.id} ml={i > 0 ? '-10px' : '0'}>
              <EarnAvatar
                key={user.id}
                id={user.id}
                avatar={user.photo}
                size="28px"
              />
            </Box>
          ))}
          <Text ml={1} color="brand.slate.400" fontSize={'xs'}>
            +{vibeCount - 6}
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
          click to vibeeeee
        </Button>
      </AuthWrapper>
      <Fireworks onInit={onInit} />
    </Flex>
  );
};
