import { Container, Flex, Image, Text, Wrap, WrapItem } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Loading } from '@/components/shared/Loading';
import { type Grant, GrantEntry } from '@/features/grants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

function Grants() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const getGrants = async () => {
    setIsLoading(true);
    try {
      const grantsData = await axios.get('/api/grants');
      setGrants(grantsData.data);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    getGrants();
  }, []);

  return (
    <>
      <Default
        meta={
          <Meta
            title="Superteam Earn | Grants"
            description="Discover Solana Grants for Development, Art, Content, and more to fund your ideas"
            canonical="https://earn.superteam.fun/grants/"
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
            {!isLoading && error && <ErrorInfo />}
            {!isLoading && !error && (
              <Wrap justify={'center'} mx="auto" spacing={10}>
                {grants?.map((grant) => {
                  return (
                    <WrapItem key={grant?.id}>
                      <GrantEntry
                        title={grant?.title}
                        shortDescription={grant?.shortDescription}
                        slug={grant.slug}
                        rewardAmount={grant?.rewardAmount}
                        token={grant?.token}
                        link={grant?.link}
                        logo={grant?.logo}
                      />
                    </WrapItem>
                  );
                })}
              </Wrap>
            )}
          </Container>
        </Flex>
      </Default>
    </>
  );
}

export default Grants;
