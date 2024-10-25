import { Box, Text, useMediaQuery } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const AnnouncementBar = () => {
  const [isSmallerThan800] = useMediaQuery('(max-width: 800px)');
  const { t } = useTranslation();

  if (isSmallerThan800) {
    return (
      <Box
        as={NextLink}
        display={'block'}
        w="full"
        color="white"
        bgColor={'brand.purple'}
        href="/your-target-url" // 如果需要链接，请在这里添加目标 URL
      >
        <Text
          p={3}
          fontSize={{ base: '11px', md: 'sm' }}
          fontWeight={500}
          textAlign="center"
        >
          {t('AnnouncementBar.hackathonPrizes')}
        </Text>
      </Box>
    );
  } else return null;
};
