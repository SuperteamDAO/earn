import { Image } from '@chakra-ui/react';
import Avatar from 'boring-avatars';

import type { User } from '@/interface/user';

interface Props {
  user: User | undefined | null;
  size?: string;
}

export function UserAvatar({ user, size = '32px' }: Props) {
  if (user?.photo) {
    return (
      <Image
        boxSize={size}
        minW={size}
        minH={size}
        borderRadius="full"
        objectFit="cover"
        alt={`${user?.firstName} ${user?.lastName}`}
        src={user?.photo}
      />
    );
  }
  return (
    <Avatar
      name={`${user?.firstName} ${user?.lastName}`}
      colors={['#92A1C6', '#F0AB3D', '#C271B4']}
      size={size}
      variant="marble"
    />
  );
}
