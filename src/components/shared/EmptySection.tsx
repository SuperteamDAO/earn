import { Flex, Text } from '@chakra-ui/react';
import { AiOutlineInfoCircle } from 'react-icons/ai';

export function EmptySection({
  title,
  message,
  showNotifSub = true,
}: {
  title?: string;
  message?: string;
  showNotifSub?: boolean;
}) {
  return (
    <Flex align={'center'} justify="center" w="full">
      <Flex align={'center'} justify="center" direction={'column'}>
        <AiOutlineInfoCircle fontSize={52} color="#94a3b8" />
        <Text mt={2} color="brand.slate.400" fontSize="lg" fontWeight={700}>
          {title || '没有发现'}
        </Text>
        {showNotifSub && (
          <Text mt={2} color="brand.slate.300">
            {message || '发错误，请重试!'}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
