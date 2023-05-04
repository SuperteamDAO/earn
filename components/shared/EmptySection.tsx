import { Flex, Text } from '@chakra-ui/react';
import { AiOutlineInfoCircle } from 'react-icons/ai';

function ErrorSection({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Flex align={'center'} justify="center" w="full" mt={8}>
      <Flex align={'center'} justify="center" direction={'column'}>
        <AiOutlineInfoCircle fontSize={60} color="brand.slate.500" />
        <Text mt={2} color="brand.slate.500" fontSize="lg" fontWeight={700}>
          {title || 'Sorry! Nothing found'}
        </Text>
        <Text mt={2} color="brand.slate.500">
          {message || 'Something went wrong! Please try again!'}
        </Text>
      </Flex>
    </Flex>
  );
}

export default ErrorSection;
