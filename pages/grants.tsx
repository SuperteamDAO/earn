import {
  Box,
  Button,
  Center,
  Flex,
  Image,
  Link,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import React from 'react';

import NavHome from '../components/home/NavHome';
import { AllGrants } from '../utils/functions';

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
      <Center w={'363px'} h={'181px'} mb={'19px'} bg={color}>
        <Image w={16} alt="" src={icon} />
      </Center>
      <Text mb={'4px'} fontSize={'16px'} fontWeight={'600'}>
        {title}
      </Text>
      <Text mb={'10px'} color={'#64748B'} fontSize={'14px'}>
        Anim do enim excepteur. Laboris dolor ut laboris. Qui voluptate
        exercitation ad consectetur ipsum reprehenderit aute.{' '}
      </Text>
      <Flex align={'center'} justify={'space-between'}>
        <Text color={'#64748B'} fontSize={'13px'} fontWeight={'600'}>
          Upto $10K
        </Text>
        <Link
          href={`https://earn-frontend-v2.vercel.app/listings/grants/${title
            .split(' ')
            .join('-')}`}
          isExternal
        >
          <Button
            px={'24px'}
            py={'8px'}
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

function Grants() {
  const grants = useQuery({
    queryFn: AllGrants,
    queryKey: ['all', 'grants'],
  });
  const colors = ['#D2FFF7', '#F1FFD2', '#D2DFFF', '#FFD8D2'];
  return (
    <>
      <NavHome />
      <Flex
        pos={'relative'}
        justify={'center'}
        direction={'column'}
        w={'100%'}
        minH={'100vg'}
        pb={'100px'}
        bg={'#F5F5F5'}
      >
        <Image
          pos={'absolute'}
          top={'0'}
          right={'0'}
          left={'0'}
          w={'100%'}
          alt=""
          src="/assets/home/bg_grad.svg"
        />
        <Flex align={'center'} direction={'column'} mt={'107px'} mb={'80px'}>
          <Text fontFamily={'Domine'} fontSize={'36px'} fontWeight={'700'}>
            Need funds to build out your idea?
          </Text>
          <Text
            w={'633.05px'}
            mt={'10px'}
            fontSize={'24px'}
            fontWeight={'400'}
            textAlign={'center'}
          >
            Discover the complete list of Solana grants available to support
            your project.
          </Text>
          <Button mt={'33px'} px={'106px'} color={'white'} bg={'#6366F1'}>
            Get A Grant
          </Button>
          <Text mt={'14px'} color={'#64748B'} fontSize={'14px'}>
            Equity-Free • No Bullshit • Fast AF
          </Text>
        </Flex>
        <Center>
          <Wrap w={'1145px'} spacingX={'27px'} spacingY={'33px'}>
            {grants.data?.map((grant) => {
              return (
                <>
                  <WrapItem>
                    <GrantEntry
                      title={grant.grants.title}
                      color={
                        colors[Math.floor(Math.random() * colors.length)] || ''
                      }
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
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (_context) => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(['all', 'grants'], () => {});
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default Grants;
