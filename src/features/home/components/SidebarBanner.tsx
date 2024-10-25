import { Button, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

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
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      rounded={'lg'}
    >
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
      >
        {t('SidebarBanner.viewTracks')}
      </Button>
    </Flex>
  );
};
