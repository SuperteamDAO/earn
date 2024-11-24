import { Flex, Text } from '@chakra-ui/react';
import { AiOutlineWarning } from 'react-icons/ai';

export function ErrorInfo({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Flex align={'center'} justify="center" direction="column">
      <AiOutlineWarning fontSize={52} color="brand.slate.500" />
      <Text color="brand.slate.500" fontWeight={700}>
        {title || '发生错误'}
      </Text>
      <Text color="brand.slate.500" fontSize="sm">
        {message || '发生错误，请重试'}
      </Text>
    </Flex>
  );
}
