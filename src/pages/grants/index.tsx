import { Container, Flex, Image, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Loading } from '@/components/shared/Loading';
import { GrantEntry, useGetGrants } from '@/features/grants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

function Grants() {
  const router = useRouter();
  const { data: grants, isLoading, isError } = useGetGrants();

  return (
    <Default
      meta={
        <Meta
          title="Grants | Superteam Earn"
          description="Discover Solana Grants for Development, Art, Content, and more to fund your ideas"
          canonical="https://earn.superteam.fun/grants/"
          og={`${router.basePath}/assets/og/grants.png`}
        />
      }
    >
      <Flex
        pos={'relative'}
        justify={'center'}
        direction={'column'}
        w={'100%'}
        minH={'100vh'}
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
        <Flex align={'center'} direction={'column'} my={12} px={3}>
          <Text
            align={'center'}
            fontFamily={'var(--font-serif)'}
            fontSize={{ base: '2xl', md: '4xl' }}
            fontWeight={700}
          >
            Need funds to build out your idea?
          </Text>
          <Text
            color="brand.slate.500"
            fontSize={{ base: '16', md: '20' }}
            fontWeight={'400'}
            textAlign={'center'}
          >
            Discover the complete list of crypto grants available to support
            your project.
          </Text>
          <Text
            mt={3}
            color={'brand.slate.400'}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            Equity-Free • No Bullshit • Fast AF
          </Text>
        </Flex>
        <Container maxW={'8xl'} mb={12}>
          {isLoading && <Loading />}
          {isError && <ErrorInfo />}
          {!isLoading && !isError && (
            <Wrap justify={'center'} mx="auto" spacing={10}>
              {grants?.map((grant) => (
                <WrapItem key={grant?.id}>
                  <GrantEntry
                    title={grant?.title}
                    slug={grant.slug}
                    minReward={grant?.minReward}
                    maxReward={grant?.maxReward}
                    token={grant?.token}
                    logo={grant?.logo}
                  />
                </WrapItem>
              ))}
            </Wrap>
          )}
        </Container>
      </Flex>
    </Default>
  );
}

export default Grants;
