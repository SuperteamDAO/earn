import { Center, keyframes } from '@chakra-ui/react';
import React from 'react';

const createPulseKeyframes = (color: string) => keyframes`
  0% {
    transform: scale(0.75);
    box-shadow: 0 0 0 0 ${color};
  }
  
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 8px ${color}00;
  }
`;

export const PulseIcon = ({
  bg,
  w,
  h,
  text,
  isPulsing = false, // PASS HEX COLOR for pulse animation
}: {
  bg: string;
  text: string;
  w: number;
  h: number;
  isPulsing?: boolean;
}) => {
  const pulseKeyframes = createPulseKeyframes(bg);
  const pulseAnimation = `${pulseKeyframes} 1250ms infinite`;

  return (
    <Center pos="relative">
      <Center
        w={w - 1}
        h={h - 1}
        bg={bg}
        opacity={0.8}
        borderRadius="full"
        animation={isPulsing ? pulseAnimation : undefined}
      ></Center>
      <Center
        pos="absolute"
        top="50%"
        left="50%"
        p={1}
        bg={text}
        borderRadius="full"
        transform="translate(-50%, -50%)"
      />
    </Center>
  );
};
