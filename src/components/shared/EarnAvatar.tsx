import { Image } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import React from 'react';

export const EarnAvatar = ({
  name,
  avatar,
  size = '32px',
  borderRadius = 'full',
}: {
  name: string;
  avatar?: string;
  size?: '24px' | '28px' | '32px' | '36px' | '40px' | '52px' | '64px';
  borderRadius?: string;
}) => {
  return (
    <>
      {avatar ? (
        <Image
          boxSize={size}
          borderRadius={borderRadius}
          objectFit={'cover'}
          alt={name}
          src={avatar.replace(
            '/upload/',
            '/upload/c_scale,w_256,h_256,f_auto/',
          )}
        />
      ) : (
        <Avatar
          size={size}
          name={name}
          variant="marble"
          colors={['#da4c65', '#5e25c2', '#d433ab', '#2e53af', '#ceea94']}
        />
      )}
    </>
  );
};
