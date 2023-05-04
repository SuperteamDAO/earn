import { Image } from '@chakra-ui/react';
import Avatar from 'boring-avatars';

import type { User } from '@/interface/user';

function UserAvatar({ user }: { user: User }) {
  if (user?.photo) {
    return (
      <Image
        boxSize="32px"
        borderRadius="full"
        alt={`${user?.firstName} ${user?.lastName}`}
        src={user?.photo}
      />
    );
  }
  return (
    <Avatar
      name={`${user?.firstName} ${user?.lastName}`}
      colors={['#92A1C6', '#F0AB3D', '#C271B4']}
      size={32}
      variant="marble"
    />
  );
}

export default UserAvatar;
