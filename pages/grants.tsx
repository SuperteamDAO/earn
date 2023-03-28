import React from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Text,
  Image,
  VStack,
  Center,
  Checkbox,
  Wrap,
  WrapItem,
  Link,
} from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import { AllGrants } from '../utils/functions';

function Grants() {
  const grants = useQuery({
    queryFn: AllGrants,
    queryKey: ['all', 'grants'],
  });
  const colors = ['#D2FFF7', '#F1FFD2', '#D2DFFF', '#FFD8D2'];
  return (
    <Flex
      justifyContent={'center'}
      position={'relative'}
      minH={'100vg'}
      w={'100%'}
      flexDirection={'column'}
      pb={'100px'}
      bg={'#F5F5F5'}
    >
      <Image
        w={'100%'}
        top={'0'}
        left={'0'}
        right={'0'}
        position={'absolute'}
        alt=""
        src="/assets/home/bg_grad.svg"
      />
      <Flex
        flexDirection={'column'}
        alignItems={'center'}
        mt={'107px'}
        mb={'80px'}
      >
        <Text fontFamily={'Domine'} fontSize={'36px'} fontWeight={'700'}>
          Need funds to build out your idea?
        </Text>
        <Text
          mt={'10px'}
          textAlign={'center'}
          fontSize={'24px'}
          fontWeight={'400'}
          w={'633.05px'}
        >
          Discover the complete list of Solana grants available to support your
          project.
        </Text>
        <Button mt={'33px'} px={'106px'} color={'white'} bg={'#6366F1'}>
          Get A Grant
        </Button>
        <Text mt={'14px'} fontSize={'14px'} color={'#64748B'}>
          Equity-Free • No Bullshit • Fast AF
        </Text>
      </Flex>
      <Center>
        <Wrap spacingX={'27px'} spacingY={'33px'} w={'1145px'}>
          {grants.data?.map((grant) => {
            return (
              <>
                <WrapItem>
                  <GrantEntry
                    title={grant.grants.title}
                    color={colors[Math.floor(Math.random() * colors.length)]}
                    icon={
                      grant.sponsorInfo?.logo ??
                      '/assets/home/placeholder/ph5.png'
                    }
                  />
                </WrapItem>
              </>
            );
          })}
        </Wrap>
      </Center>
    </Flex>
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(['all', 'grants'], () => {});
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};
const GrantEntry = ({
  color,
  icon,
  title,
}: {
  color: string;
  icon: string;
  title: string;
}) => {
  return (
    <Box w={'363px'}>
      <Center w={'363px'} h={'181px'} bg={color} mb={'19px'}>
        <Image alt="" w={16} src={icon} />
      </Center>
      <Text fontSize={'16px'} fontWeight={'600'} mb={'4px'}>
        {title}
      </Text>
      <Text fontSize={'14px'} color={'#64748B'} mb={'10px'}>
        Anim do enim excepteur. Laboris dolor ut laboris. Qui voluptate
        exercitation ad consectetur ipsum reprehenderit aute.{' '}
      </Text>
      <Flex alignItems={'center'} justifyContent={'space-between'}>
        <Text fontWeight={'600'} fontSize={'13px'} color={'#64748B'}>
          Upto $10K
        </Text>
        <Link
          href={
            `https://earn-frontend-v2.vercel.app/listings/grants/` +
            title.split(' ').join('-')
          }
          isExternal
        >
          <Button
            py={'8px'}
            px={'24px'}
            color={'#94A3B8'}
            bg={'transparent'}
            border={'1px solid #94A3B8'}
          >
            Apply
          </Button>
        </Link>
      </Flex>
    </Box>
  );
};

export default Grants;
