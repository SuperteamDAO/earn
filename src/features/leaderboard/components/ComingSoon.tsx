import { Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';

export function ComingSoon() {
  const { t } = useTranslation('common');

  return (
    <VStack align="start" p={6} fontSize={'sm'} bg="#F0F9FF" rounded={12}>
      <Text fontWeight={600}>{t('leaderboard.comingSoon.title')}</Text>
      <Text color="brand.slate.500">
        {t('leaderboard.comingSoon.description')}
      </Text>
    </VStack>
  );
}
