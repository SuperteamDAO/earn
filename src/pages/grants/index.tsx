import { Container, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Loading } from '@/components/shared/Loading';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { GrantsPop } from '@/features/conversion-popups';
import { GrantEntry, grantsQuery } from '@/features/grants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

function Grants() {
  const {
    data: grants,
    isLoading,
    isError,
  } = useQuery(grantsQuery({ order: 'desc' }));

  return (
    <Default
      meta={
        <Meta
          title="Grants | Superteam Earn"
          description="Discover Solana Grants for Development, Art, Content, and more to fund your ideas"
          canonical="https://earn.superteam.fun/grants/"
          og={ASSET_URL + `/og/grants.png`}
        />
      }
    >
      <GrantsPop />
      <VStack
        pos={'relative'}
        justify={'center'}
        direction={'column'}
        w={'100%'}
        minH={'100vh'}
        bg={'#F5F5F5'}
      >
        <ExternalImage
          className="absolute left-0 right-0 top-0 h-full w-full"
          alt=""
          src={'/home/bg_grad.svg'}
        />
        <VStack my={16} textAlign="center" spacing={4}>
          <Text
            px={2}
            fontSize={{ base: '4xl', md: '5xl' }}
            fontWeight={700}
            lineHeight="1.2"
          >
            Need funds to build out your idea?
          </Text>
          <Text
            maxW="2xl"
            mx={2}
            color="gray.600"
            fontSize={{ base: 'lg', md: 'xl' }}
          >
            Discover the complete list of crypto grants available to support
            your project. Fast, equity-free funding without the hassle.
          </Text>
          <Text
            mt={3}
            color={'brand.slate.400'}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            Equity-Free • No Bullshit • Fast AF
          </Text>
        </VStack>
        <Container maxW={'7xl'} mb={12}>
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
      </VStack>
    </Default>
  );
}

export default Grants;
