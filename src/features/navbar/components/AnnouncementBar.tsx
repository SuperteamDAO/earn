import { Box, Link, Text, useMediaQuery } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const AnnouncementBar = () => {
  const [isSmallerThan800] = useMediaQuery('(max-width: 800px)');
  const { t } = useTranslation();

  const href = '/hackathon/radar';
  if (isSmallerThan800) {
    return (
      <Box
        as={NextLink}
        display={'block'}
        w="full"
        color="white"
        bgColor={'brand.purple'}
        href={href}
      >
        <Text
          p={3}
          fontSize={{ base: '11px', md: 'sm' }}
          fontWeight={500}
          textAlign="center"
        >
          <Link as={NextLink} textDecoration={'underline'} href={href}>
            {t('AnnouncementBar.clickHere')}
          </Link>{' '}
          {t('AnnouncementBar.hackathonPrizes')}
        </Text>
      </Box>
    );
  } else return null;
};
