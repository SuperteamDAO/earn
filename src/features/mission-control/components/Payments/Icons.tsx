import { Icon, type IconProps } from '@chakra-ui/react';

import { type ButtonSize } from '../../utils';

interface ActionIconProps extends IconProps {
  size?: ButtonSize;
}

export const ApproveIcon: React.FC<ActionIconProps> = ({
  size = 'normal',
  ...props
}) => {
  const dimensions = size === 'small' ? 14 : 17;

  return (
    <Icon
      w={`${dimensions}px`}
      h={`${dimensions}px`}
      viewBox="0 0 17 17"
      {...props}
    >
      <circle cx="8.21138" cy="8.3845" r="8.03193" fill="currentColor" />
      <path
        d="M4.67725 8.06325L7.24746 10.6335L11.7453 6.13559"
        stroke="white"
        strokeWidth="1.69618"
      />
    </Icon>
  );
};

export const RejectIcon: React.FC<ActionIconProps> = ({
  size = 'normal',
  ...props
}) => {
  const dimensions = size === 'small' ? 14 : 17;
  return (
    <Icon
      w={`${dimensions}px`}
      h={`${dimensions}px`}
      fill="none"
      viewBox="0 0 17 17"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="8.24824" cy="8.3845" r="8.03193" fill="#E11D48" />
      <path
        d="M5.38186 11.9674L4.66528 11.2508L7.53158 8.38451L4.66528 5.51821L5.38186 4.80164L8.24816 7.66793L11.1145 4.80164L11.831 5.51821L8.96473 8.38451L11.831 11.2508L11.1145 11.9674L8.24816 9.10108L5.38186 11.9674Z"
        fill="white"
      />
    </Icon>
  );
};
