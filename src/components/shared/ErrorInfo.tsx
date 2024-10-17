import { Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AiOutlineWarning } from 'react-icons/ai';

export function ErrorInfo({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  const { t } = useTranslation('common');

  return (
    <Flex align={'center'} justify="center" direction="column">
      <AiOutlineWarning fontSize={52} color="brand.slate.500" />
      <Text color="brand.slate.500" fontWeight={700}>
        {title || t('errorInfo.defaultTitle')}
      </Text>
      <Text color="brand.slate.500" fontSize="sm">
        {message || t('errorInfo.defaultMessage')}
      </Text>
    </Flex>
  );
}
