import { Box, Flex, Text, Button, Image } from '@chakra-ui/react';
import { AddIcon, CopyIcon } from '@chakra-ui/icons';

import Link from 'next/link';

import { SponsorStore } from '../../store/sponsor';
import { Skeleton, SkeletonCircle, SkeletonText } from '@chakra-ui/react';

function DashboardHeader() {
  let { currentSponsor } = SponsorStore();

  if (!currentSponsor) {
    return (
      <Skeleton
        h={'12rem'}
        w={'full'}
        borderRadius={'0.3125rem'}
        px={'1.75rem'}
        py={'2.125rem'}
      />
    );
  }

  return (
    <Flex mb={'3.125rem'} columnGap={'1rem'}>
      <Flex
        px={'1.75rem'}
        py={'2.125rem'}
        bg={'#334254'}
        h={'12rem'}
        w={'full'}
        borderRadius={'0.3125rem'}
      >
        <Box height={'1.875rem'} mt={'0.1rem'}>
          <Image
            width="6rem"
            objectFit={'cover'}
            alt=""
            height="6rem"
            src={currentSponsor.logo || '/assets/logo/port-placeholder.svg'}
          ></Image>
        </Box>
        <Box ml={'1.5rem'}>
          <Text fontSize={'1.125rem'} fontWeight={'600'} color={'white '}>
            {currentSponsor.name}
          </Text>
          <Text color={'#94A3B8'}>
            Here are all the listing made by your company
          </Text>
          <Link href="/listings/create">
            <Button
              mt={'1.3125rem'}
              bg={'#6562FF'}
              h={'1.6731rem'}
              px={'0.5669rem'}
              leftIcon={<AddIcon color={'white'} w={2} h={2} />}
            >
              <Text
                color={'white'}
                ml={'1.875rem'}
                mr={'2.8125rem'}
                fontSize={'0.5375rem'}
              >
                Create New Listing
              </Text>
            </Button>
          </Link>
        </Box>
      </Flex>
      <Box
        bg={'#A3F52C'}
        w={'16.5625rem'}
        borderRadius={'0.4375rem'}
        px={'1rem'}
      >
        <Box w={'5rem'} h={'4.0625rem'}>
          <Image
            objectFit={'contain'}
            width="100%"
            alt=""
            height="100%"
            src={'/assets/randompeople/threepeople.png'}
          ></Image>
        </Box>
        <Box>
          <Text fontWeight={'700'}>Find Talent</Text>
          <Text
            lineHeight={'1.0625rem'}
            color={'rgba(65, 92, 24, 0.69)'}
            fontSize={'0.875rem'}
          >
            Learn more about being a sponsor and accessing the best talent in
            Solana
          </Text>
        </Box>
        <Button
          bg={'white'}
          mt={'0.8125rem'}
          h={'2rem'}
          w={'100%'}
          fontSize={' 0.8125rem'}
          color={'grey'}
        >
          Explore Directory
        </Button>
      </Box>
    </Flex>
  );
}

export default DashboardHeader;
