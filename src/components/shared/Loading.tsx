import { Flex } from '@chakra-ui/react';

export function Loading() {
  return (
    <Flex align={'center'} justify="center">
      <div className="earn-loader">
        <div></div>
        <div></div>
      </div>
    </Flex>
  );
}
