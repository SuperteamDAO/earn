import {
  Box,
  Button,
  Center,
  Container,
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

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

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
    <Box w={80}>
      <Center w={80} h={52} mb={5} bg={color}>
        <Image w={16} alt="" src={icon} />
      </Center>
      <Text mb={'4px'} fontSize={'md'} fontWeight={'600'}>
        {title}
      </Text>
      <Text mb={5} color={'brand.slate.500'} fontSize={'sm'}>
        Anim do enim excepteur. Laboris dolor ut laboris. Qui voluptate
        exercitation ad consectetur ipsum reprehenderit aute.{' '}
      </Text>
      <Flex align={'center'} justify={'space-between'}>
        <Text color={'brand.slate.500'} fontSize={'13px'} fontWeight={'600'}>
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
            color={'brand.slate.700'}
            bg={'transparent'}
            border={'1px solid'}
            borderColor={'brand.slate.700'}
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
      <Default
        meta={
          <Meta
            title="Superteam Earn"
            description="Every Solana opportunity in one place!"
          />
        }
      >
        <Flex
          pos={'relative'}
          justify={'center'}
          direction={'column'}
          w={'100%'}
          minH={'100vg'}
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
          <Flex align={'center'} direction={'column'} gap={4} py={5}>
            <Text
              mt={36}
              fontFamily={'Domine'}
              fontSize={[20, 20, 32, 32]}
              fontWeight={700}
            >
              Need funds to build out your idea?
            </Text>
            <Text
              fontSize={[20, 20, 32, 32]}
              fontWeight={'400'}
              textAlign={'center'}
            >
              Discover the complete list of Solana grants available to support
              your project.
            </Text>
            <Button px={32} color={'white'} bg={'brand.purple'}>
              Get A Grant
            </Button>
            <Text color={'brand.slate.400'} fontSize={'md'}>
              Equity-Free • No Bullshit • Fast AF
            </Text>
          </Flex>
          <Container maxW={'7xl'}>
            <Wrap justify={'center'} mx="auto" spacing={10}>
              {grants.data?.map((grant) => {
                return (
                  <>
                    <WrapItem>
                      <GrantEntry
                        title={grant.grants.title}
                        color={
                          colors[Math.floor(Math.random() * colors.length)] ||
                          ''
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
          </Container>
        </Flex>
      </Default>
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
