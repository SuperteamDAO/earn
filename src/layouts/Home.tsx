import {
  Box,
  Center,
  Container,
  Flex,
  HStack,
  Image,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { type ReactNode, useEffect, useState } from 'react';

import { HomeBanner } from '@/components/home/Banner';
import { CategoryBanner } from '@/components/home/CategoryBanner';
import { HomeSideBar } from '@/components/home/SideBar';
import { Superteams } from '@/constants/Superteam';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface TotalType {
  count?: number;
  totalInUSD?: number;
  totalUsers?: number;
}
interface HomeProps {
  children: ReactNode;
  type: 'home' | 'category' | 'region' | 'niche' | 'feed';
}

export function Home({ children, type }: HomeProps) {
  const router = useRouter();

  const [isTotalLoading, setIsTotalLoading] = useState(true);

  const [recentEarners, setRecentEarners] = useState<User[]>([]);
  const [totals, setTotals] = useState<TotalType>({});

  const getTotalInfo = async () => {
    try {
      const totalsData = await axios.get('/api/sidebar/totals');
      setTotals(totalsData.data);
      const earnerData = await axios.get('/api/sidebar/recentEarners');
      setRecentEarners(earnerData.data);
      setIsTotalLoading(false);
    } catch (e) {
      setIsTotalLoading(false);
    }
  };

  useEffect(() => {
    getTotalInfo();
  }, []);

  const Skills = ['Development', 'Design', 'Content', 'Other'];

  const matchedTeam = Superteams.find(
    (e) => e.region?.toLowerCase() === String(router.query.slug).toLowerCase(),
  );

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Superteam Earn | Work to Earn in Crypto"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <Container maxW={'8xl'} mx="auto" px={{ base: 3, md: 4 }}>
        <HStack align="start" justify="space-between">
          <Flex
            w="full"
            py={4}
            borderRight={{
              base: 'none',
              lg: type === 'niche' ? 'none' : '1px solid',
            }}
            borderRightColor={{
              base: 'none',
              lg: 'blackAlpha.200',
            }}
          >
            <Box w="full" pr={{ base: 0, lg: 6 }}>
              {type === 'home' && <HomeBanner userCount={totals.totalUsers} />}
              {type === 'category' && (
                <CategoryBanner
                  type={
                    Skills.find(
                      (skill) =>
                        skill.toLocaleLowerCase() ===
                        router?.query?.slug?.toString().toLocaleLowerCase(),
                    ) as string
                  }
                />
              )}
              {type === 'region' && matchedTeam && (
                <Box>
                  <Flex
                    direction={{ md: 'row', base: 'column' }}
                    w={{ md: 'brand.120', base: '100%' }}
                    h={{ md: '7.375rem', base: 'fit-content' }}
                    mx={'auto'}
                    mb={8}
                    p={6}
                    bg={`url(${matchedTeam.bg})`}
                    bgSize={'cover'}
                    rounded={10}
                  >
                    <Center
                      w={14}
                      h={14}
                      mr={3}
                      bg={matchedTeam.color}
                      rounded={'md'}
                    >
                      <Image
                        borderRadius={'5px'}
                        alt="Category icon"
                        src={matchedTeam.icons}
                      />
                    </Center>
                    <Box w={{ md: '80%', base: '100%' }}>
                      <Text
                        mt={{ base: 4, md: '0' }}
                        fontFamily={'var(--font-serif)'}
                        fontWeight={'700'}
                      >
                        {matchedTeam.name}
                      </Text>
                      <Text color={'brand.slate.500'} fontSize={'small'}>
                        Welcome to Superteam {matchedTeam.displayValue} earnings
                        page — use these opportunities to earn in global
                        standards and gain membership in the most exclusive
                        Solana community of {matchedTeam.displayValue}!
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )}
              {children}
            </Box>
          </Flex>
          {type !== 'niche' && (
            <Flex
              display={{
                base: 'none',
                lg: 'flex',
              }}
            >
              <HomeSideBar
                type={type}
                isTotalLoading={isTotalLoading}
                total={totals?.totalInUSD ?? 0}
                listings={totals?.count ?? 0}
                earners={recentEarners ?? []}
              />
            </Flex>
          )}
        </HStack>
      </Container>
    </Default>
  );
}
