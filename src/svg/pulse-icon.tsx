import { Center } from '@chakra-ui/react';

export const PulseIcon = ({
  bg,
  w,
  h,
  text,
}: {
  bg: string;
  text: string;
  w: number;
  h: number;
}) => {
  return (
    <Center w={w - 1} h={h - 1} bg={bg} opacity={0.8} borderRadius="full">
      <Center p={1} bg={text} borderRadius="full" />
    </Center>
  );
};
