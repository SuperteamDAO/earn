import { Box, Image } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import React, { useState } from 'react';

export const EarnAvatar = ({
  id,
  avatar,
  size = '32px',
  borderRadius = 'full',
  onClick,
}: {
  id: string | undefined;
  avatar?: string;
  size?: '24px' | '28px' | '32px' | '36px' | '40px' | '44px' | '52px' | '64px';
  borderRadius?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement> | undefined;
}) => {
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    setHasError(true);
  };

  return (
    <Box h="min-content" onClick={onClick}>
      {!hasError && avatar ? (
        <Image
          flexGrow={1}
          boxSize={size}
          borderRadius={borderRadius}
          objectFit={'cover'}
          alt={id}
          onError={handleImageError}
          src={avatar.replace('/upload/', '/upload/c_scale,f_auto/')}
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
    </Box>
  );
};
