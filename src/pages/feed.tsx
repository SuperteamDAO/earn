import { Box, Flex, Text } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { FiHome } from 'react-icons/fi';
import { GoTrophy } from 'react-icons/go';
import { PiStarFour } from 'react-icons/pi';

import { PowCard, SubmissionCard } from '@/features/feed';
import { type PoW } from '@/interface/pow';
import { type SubmissionWithUser } from '@/interface/submission';
import { type User } from '@/interface/user';
import { Home } from '@/layouts/Home';

type PowWithUser = PoW & {
  user?: User;
};

interface FeedData {
  Submission: SubmissionWithUser[];
  PoW: PowWithUser[];
}

export default function Feed() {
  const [data, setData] = useState<FeedData>();
  // const [isloading, setIsloading] = useState<boolean>(true);
  useEffect(() => {
    const fetch = async () => {
      try {
        // setIsloading(true);
        const res = await axios.get(`/api/feed/get`);

        if (res) {
          setData(res?.data);
          // setIsloading(false);
        }
      } catch (err) {
        console.log(err);
        // setIsloading(false);
      }
    };
    fetch();
  }, []);

  const filteredFeed = useMemo(() => {
    const submissions = data?.Submission ?? [];
    const pows = data?.PoW ?? [];
    const typedSubmissions = submissions.map((s) => ({
      ...s,
      type: 'submission',
    }));
    const typedPows = pows.map((p) => ({ ...p, type: 'pow' }));

    return [...typedSubmissions, ...typedPows].sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();

      return dateB - dateA;
    });
  }, [data]);

  const NavItem = ({
    name,
    icon: Icon,
    size,
  }: {
    name: string;
    icon: any;
    size: string;
  }) => {
    return (
      <Flex align="center">
        <Box w={7}>
          <Icon color="#64748b" size={size} />
        </Box>
        <Text mt={1.5} color="brand.slate.500" fontWeight={500}>
          {name}
        </Text>
      </Flex>
    );
  };

  return (
    <Home type="home">
      <Box
        mt={'-4'}
        mr={'-25px'}
        borderColor={'brand.slate.200'}
        borderRightWidth={'1px'}
      >
        <Flex>
          <Flex
            pos="sticky"
            top={14}
            direction={'column'}
            gap={3}
            display={{
              base: 'none',
              lg: 'flex',
            }}
            w={60}
            h={'100vh'}
            pt={5}
            pr={5}
            borderRightWidth={'1px'}
          >
            <NavItem name="Homepage" icon={FiHome} size={'21px'} />
            <NavItem name="Leaderboard" icon={PiStarFour} size={'23px'} />
            <NavItem name="Winners" icon={GoTrophy} size={'21px'} />
          </Flex>
          <Flex direction={'column'} w="100%">
            <Box px={5} py={5} borderBottomWidth={'1px'}>
              <Text color="brand.slate.900" fontSize="xl" fontWeight={600}>
                Activity Feed
              </Text>
              <Text color="brand.slate.600" fontSize="md">
                Find and discover the best work on Earn
              </Text>
            </Box>
            {filteredFeed.map((item, index) => {
              if (item.type === 'submission') {
                return (
                  <SubmissionCard
                    key={index}
                    sub={item as SubmissionWithUser}
                    type="activity"
                  />
                );
              }
              if (item.type === 'pow') {
                return (
                  <PowCard
                    key={index}
                    pow={item as PowWithUser}
                    type="activity"
                  />
                );
              }
              return null;
            })}
          </Flex>
        </Flex>
      </Box>
    </Home>
  );
}
