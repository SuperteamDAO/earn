import { Badge, type BadgeProps } from '@chakra-ui/react';
import React from 'react';

import { type STATUS } from '../../utils';

interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: STATUS;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  ...props
}) => {
  const getStyles = (status: STATUS): { bg: string; color: string } => {
    switch (status) {
      case 'all':
      case 'undecided':
        return { bg: '#FAFAFA', color: '#525252' };
      case 'accepted':
        return { bg: '#FFFBEB', color: '#F59E0B' };
      case 'rejected':
        return { bg: '#FEF2F2', color: '#EF4444' };
      case 'paid':
        return { bg: '#ECFDF5', color: '#059669' };
      default:
        return { bg: '#FAFAFA', color: '#525252' };
    }
  };

  const { bg, color } = getStyles(status);

  return (
    <Badge
      px={3}
      py={1}
      color={color}
      fontWeight={500}
      textTransform="capitalize"
      bg={bg}
      borderRadius="full"
      {...props}
    >
      {status}
    </Badge>
  );
};
