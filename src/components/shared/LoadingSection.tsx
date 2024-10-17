import { Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import { Loading } from './Loading';

export function LoadingSection() {
  const { t } = useTranslation('common');

  return (
    <Flex align={'center'} justify="center" w="full" minH={'92vh'}>
      <Flex align={'center'} justify="center" direction={'column'}>
        <Loading />
        <Text mt={2} color="brand.slate.300">
          {t('loadingSection.loading')}
        </Text>
      </Flex>
    </Flex>
  );
}
