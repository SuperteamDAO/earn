import { AddIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Image, Skeleton, Text } from '@chakra-ui/react';
import Link from 'next/link';

import { SponsorStore } from '../../store/sponsor';

function DashboardHeader() {
  const { currentSponsor } = SponsorStore();

  if (!currentSponsor) {
    return (
      <Skeleton
        w={'full'}
        h={'12rem'}
        px={'1.75rem'}
        py={'2.125rem'}
        borderRadius={'0.3125rem'}
      />
    );
  }

  return (
    <Flex columnGap={'1rem'} mb={'3.125rem'}>
      <Flex
        w={'full'}
        h={'12rem'}
        px={'1.75rem'}
        py={'2.125rem'}
        bg={'#334254'}
        borderRadius={'0.3125rem'}
      >
        <Box h={'1.875rem'} mt={'0.1rem'}>
          <Image
            w="6rem"
            h="6rem"
            objectFit={'cover'}
            alt=""
            src={currentSponsor.logo || '/assets/logo/port-placeholder.svg'}
          ></Image>
        </Box>
        <Box ml={'1.5rem'}>
          <Text color={'white '} fontSize={'1.125rem'} fontWeight={'600'}>
            {currentSponsor.name}
          </Text>
          <Text color={'#94A3B8'}>
            Here are all the listing made by your company
          </Text>
          <Link href="/listings/create">
            <Button
              h={'1.6731rem'}
              mt={'1.3125rem'}
              px={'0.5669rem'}
              bg={'#6562FF'}
              leftIcon={<AddIcon color={'white'} w={2} h={2} />}
            >
              <Text
                mr={'2.8125rem'}
                ml={'1.875rem'}
                color={'white'}
                fontSize={'0.5375rem'}
              >
                Create New Listing
              </Text>
            </Button>
          </Link>
        </Box>
      </Flex>
      <Box
        w={'16.5625rem'}
        px={'1rem'}
        bg={'#A3F52C'}
        borderRadius={'0.4375rem'}
      >
        <Box w={'5rem'} h={'4.0625rem'}>
          <Image
            w="100%"
            h="100%"
            objectFit={'contain'}
            alt=""
            src={'/assets/randompeople/threepeople.png'}
          ></Image>
        </Box>
        <Box>
          <Text fontWeight={'700'}>Find Talent</Text>
          <Text
            color={'rgba(65, 92, 24, 0.69)'}
            fontSize={'0.875rem'}
            lineHeight={'1.0625rem'}
          >
            Learn more about being a sponsor and accessing the best talent in
            Solana
          </Text>
        </Box>
        <Button
          w={'100%'}
          h={'2rem'}
          mt={'0.8125rem'}
          color={'grey'}
          fontSize={' 0.8125rem'}
          bg={'white'}
        >
          Explore Directory
        </Button>
      </Box>
    </Flex>
  );
}

export default DashboardHeader;
