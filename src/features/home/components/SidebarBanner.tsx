import { Button, Flex, HStack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

import { RadarLogo } from '@/svg/radar-logo';

export const SidebarBanner = () => {
  const { t } = useTranslation();

  return (
    <Flex
      direction={'column'}
      gap={1}
      w={'full'}
      h={'max-content'}
      px={6}
      py={8}
      bgImage={"url('/assets/hackathon/radar/sidebar-bg.webp')"}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      rounded={'lg'}
    >
      <HStack>
        <RadarLogo
          styles={{
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '8px',
          }}
        />
      </HStack>
      <Text color={'white'} fontSize={'lg'} fontWeight={'600'} opacity={0.9}>
        {t('SidebarBanner.buildProject')}
      </Text>
      <Text
        mt={'0.5rem'}
        color={'orange.100'}
        fontSize={'1rem'}
        lineHeight={'1.1875rem'}
      >
        {t('SidebarBanner.submitTracks')}
      </Text>
      <Button
        as={NextLink}
        mt={'1.5rem'}
        py={'1.5rem'}
        color={'black'}
        fontSize="0.9rem"
        fontWeight={600}
        textAlign={'center'}
        bg="#fff"
        borderRadius={8}
        _hover={{ bg: 'orange.100' }}
        href="/hackathon/radar"
      >
        {t('SidebarBanner.viewTracks')}
      </Button>
    </Flex>
  );
};
