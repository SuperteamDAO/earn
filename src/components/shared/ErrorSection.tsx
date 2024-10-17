import { Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AiOutlineWarning } from 'react-icons/ai';

export function ErrorSection({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  const { t } = useTranslation('common');

  return (
    <Flex align={'center'} justify="center" w="full" minH={'92vh'}>
      <Flex align={'center'} justify="center" direction={'column'}>
        <AiOutlineWarning fontSize={96} color="brand.slate.500" />
        <Text mt={2} color="brand.slate.500" fontSize="lg" fontWeight={700}>
          {title || t('errorSection.defaultTitle')}
        </Text>
        <Text mt={2} color="brand.slate.500">
          {message || t('errorSection.defaultMessage')}
        </Text>
      </Flex>
    </Flex>
  );
}
