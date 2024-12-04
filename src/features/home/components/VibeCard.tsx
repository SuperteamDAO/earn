import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { type TConductorInstance } from 'react-canvas-confetti/dist/types';

import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { AuthWrapper } from '@/features/auth';
import { EarnAvatar } from '@/features/talent';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

import { pfpsQuery } from '../queries/vibe-pfps';

const dummyUsers = [
  { id: '1', photo: ASSET_URL + '/pfps/t1.webp' },
  { id: '2', photo: ASSET_URL + '/pfps/md2.webp' },
  { id: '3', photo: ASSET_URL + '/pfps/fff1.webp' },
  { id: '55', photo: '' },
  { id: '5', photo: ASSET_URL + '/pfps/md1.webp' },
  { id: '6', photo: ASSET_URL + '/pfps/t2.webp' },
  { id: '7', photo: '' },
  { id: '8', photo: '' },
  { id: '9', photo: '' },
  { id: '10', photo: '' },
  { id: '11', photo: '' },
  { id: '12', photo: '' },
  { id: '13', photo: '' },
];

export const VibeCard = () => {
  const [vibeCount, setVibeCount] = useState(13);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [conductor, setConductor] = useState<TConductorInstance>();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { user } = useUser();

  const { data: fetchedUsers = [] } = useQuery(pfpsQuery(userIds));

  useEffect(() => {
    audioRef.current = new Audio('/assets/chipichapa.mp3');
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
    <div className="flex w-full items-center justify-between rounded-lg bg-slate-100 p-4">
      <div className="flex flex-col gap-2 md:gap-1">
        <p className="whitespace-nowrap text-xs font-medium text-slate-500 md:text-sm">
          <span className="text-slate-900">{vibeCount} </span>
          people vibing rn
        </p>
        <div className="flex items-center">
          {displayUsers.map((user, i) => (
            <div className={cn(i > 0 ? '-ml-10px' : '')} key={user.id}>
              <EarnAvatar id={user.id} avatar={user.photo} size={'24px'} />
            </div>
          ))}
          <p className="ml-1 text-xs text-slate-400">
            +{Math.max(0, vibeCount - 6)}
          </p>
        </div>
      </div>
      <div className="mx-4 h-full w-[1px] bg-slate-200" />
      <AuthWrapper>
        <Button
          variant="outline"
          className="max-w-40 border-slate-200 bg-white px-10 text-sm font-medium text-slate-500 hover:bg-brand-purple hover:text-white"
          onClick={handleVibeClick}
        >
          click to vibeeeee
        </Button>
      </AuthWrapper>
      <Fireworks onInit={onInit} />
    </div>
  );
};
