import { Flex, Text } from '@chakra-ui/react';

import Loading from './Loading';

function LoadingSection() {
  return (
    <Flex align={'center'} justify="center" w="full" minH={'92vh'}>
      <Flex align={'center'} justify="center" direction={'column'}>
        <Loading />
        <Text mt={2} color="brand.slate.300">
          Loading...
        </Text>
      </Flex>
    </Flex>
  );
}

export default LoadingSection;
