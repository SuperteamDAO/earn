import { Flex } from '@chakra-ui/react';

function Loading() {
  return (
    <Flex align={'center'} justify="center">
      <div className="earn-loader">
        <div></div>
        <div></div>
      </div>
    </Flex>
  );
}

export default Loading;
