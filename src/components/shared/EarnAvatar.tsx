import { Image, SkeletonCircle } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import React, { useEffect, useState } from 'react';

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
  onClick?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(!!avatar);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!avatar) {
      setIsLoading(false);
    }
  }, [avatar]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div onClick={onClick}>
      {isLoading && <SkeletonCircle size={size} />}
      {!hasError && avatar ? (
        <Image
          boxSize={size}
          maxW={'max-content'}
          borderRadius={borderRadius}
          objectFit={'cover'}
          alt={id}
          onError={handleImageError}
          onLoad={handleImageLoad}
          src={avatar.replace(
            '/upload/',
            '/upload/c_scale,w_256,h_256,f_auto/',
          )}
          style={{ display: isLoading ? 'none' : 'block' }}
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
