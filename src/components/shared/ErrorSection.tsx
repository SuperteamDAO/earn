import { Flex, Text } from '@chakra-ui/react';
import { AiOutlineWarning } from 'react-icons/ai';

export function ErrorSection({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Flex align={'center'} justify="center" w="full" minH={'92vh'}>
      <Flex align={'center'} justify="center" direction={'column'}>
        <AiOutlineWarning fontSize={96} color="brand.slate.500" />
        <Text mt={2} color="brand.slate.500" fontSize="lg" fontWeight={700}>
          {title || '发生错误'}
        </Text>
        <Text mt={2} color="brand.slate.500">
          {message || '发生错误，请重试'}
        </Text>
      </Flex>
    </Flex>
  );
}
