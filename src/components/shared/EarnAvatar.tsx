import { Image } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import React from 'react';

export const EarnAvatar = ({
  id,
  avatar,
  size = '32px',
  borderRadius = 'full',
  onClick,
}: {
  id: string;
  avatar?: string;
  size?: '24px' | '28px' | '32px' | '36px' | '40px' | '44px' | '52px' | '64px';
  borderRadius?: string;
  onClick?: () => void;
}) => {
  return (
    <div onClick={onClick}>
      {avatar ? (
        <Image
          boxSize={size}
          maxW={'max-content'}
          borderRadius={borderRadius}
          objectFit={'cover'}
          alt={id}
          src={avatar.replace(
            '/upload/',
            '/upload/c_scale,w_256,h_256,f_auto/',
          )}
        />
      ) : (
        <Avatar
          size={size}
          name={id}
          variant="marble"
          colors={[
            '#da4c65',
            '#5e25c2',
            '#d433ab',
            '#2e53af',
            '#ceea94',
            '#92a1c6',
            '#f0ab3d',
            '#c271b4',
          ]}
        />
      )}
    </div>
  );
};
