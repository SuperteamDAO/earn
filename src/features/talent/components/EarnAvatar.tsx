import Avatar from 'boring-avatars';
import React, { useState } from 'react';

import { cn } from '@/utils';

const sizeMap = {
  '24px': 'h-6 w-6',
  '28px': 'h-7 w-7',
  '32px': 'h-8 w-8',
  '36px': 'h-9 w-9',
  '40px': 'h-10 w-10',
  '44px': 'h-11 w-11',
  '52px': 'h-[52px] w-[52px]',
  '64px': 'h-16 w-16',
} as const;

export const EarnAvatar = ({
  id,
  avatar,
  size = '32px',
  borderRadius = 'rounded-full',
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
    <div className="h-min" onClick={onClick}>
      {!hasError && avatar ? (
        <img
          src={avatar.replace('/upload/', '/upload/c_scale,f_auto/')}
          alt={id || 'avatar'}
          className={cn('flex-grow object-cover', sizeMap[size], borderRadius)}
          onError={handleImageError}
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
