import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

import { userStore } from '@/store/user';
import { Mixpanel } from '@/utils/mixpanel';

interface BannerProps {
  setTriggerLogin: (arg0: boolean) => void;
}

export default function HomeBanner({ setTriggerLogin }: BannerProps) {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  const [usersCount, setUsersCount] = useState<number | null>(null);
  const { userInfo } = userStore();

  const handleSubmit = () => {
    if (!userInfo?.id) {
      setTriggerLogin(true);
    }
  };

  useEffect(() => {
    axios
      .get('/api/user/count')
      .then((response) => setUsersCount(response.data.totalUsers))
      .catch((error) => console.error('Error:', error));
  }, []);

  return (
    <>
      {!isLessThan768px ? (
        <Box
          w={'100%'}
          h={72}
          mb={8}
          mx={'auto'}
          p={10}
          bgImage="url('/assets/home/display/money_banner.png')"
          bgSize={'cover'}
          rounded={'md'}
        >
          <Text
            color={'brand.slate.800'}
            fontFamily={'Domine'}
            fontSize={'1.625rem'}
            fontWeight={'700'}
            lineHeight={'1.875rem'}
          >
            Start Earning Crypto
            <br /> by Contributing to Solana
          </Text>
          <Text w={'60%'} mt={'0.4375rem'} color={'brand.slate.500'}>
            Explore bounties, grants, and jobs with high growth startups in the
            Solana ecosystem.
          </Text>
          <Flex align={'center'} mt={'1.5625rem'}>
            <Button
              px={'2.25rem'}
              py={'0.75rem'}
              color={'white'}
              fontSize={'0.875rem'}
              bg={'#6366F1'}
              onClick={() => {
                Mixpanel.track('sign_up_clicked');
                handleSubmit();
              }}
            >
              Sign Up
            </Button>
            <AvatarGroup ml={'2.875rem'} max={3} size="sm">
              <Avatar
                name="Anoushk"
                src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683132586/People%20DPs/recA3Sa7t1loYvDHo.jpg"
              />
              <Avatar
                name="Ujjwal"
                src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135404/People%20DPs/rec4XUFtbh6upVYpA.jpg"
              />
              <Avatar
                name="Yash"
                src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135395/People%20DPs/recb4gDjdKoFDAyo7.png"
              />
            </AvatarGroup>
            {usersCount !== null && (
              <Text ml={'0.6875rem'} fontSize={'0.875rem'}>
                Join {usersCount.toLocaleString()}+ others
              </Text>
            )}
          </Flex>
        </Box>
      ) : (
        <Flex
          justify={'end'}
          direction={'column'}
          w={'95%'}
          h={'96'}
          mx={'auto'}
          pt={3}
          pb={6}
          px={10}
          bgImage="url('/assets/home/display/mob_money_banner.png')"
          bgSize={'cover'}
          rounded={'md'}
        >
          <Text
            color={'brand.slate.500'}
            fontFamily={'Domine'}
            fontSize={'xl'}
            fontWeight={'700'}
            textAlign={'center'}
          >
            Unlock Your Earning <br />
            Potential on Solana
          </Text>
          <Text
            w={'100%'}
            mt={'0.4375rem'}
            color={'brand.slate.800'}
            fontSize={'sm'}
            textAlign={'center'}
          >
            Explore bounties, grants, and job opportunities for developers and
            non-technical talent alike
          </Text>
          <Button
            mt={'1rem'}
            px={'2.25rem'}
            py={'0.75rem'}
            color={'white'}
            fontSize={'0.875rem'}
            bg={'#6366F1'}
            onClick={() => {
              Mixpanel.track('sign_up_clicked');
              handleSubmit();
            }}
            size="sm"
          >
            Sign Up
          </Button>
          <Flex align={'center'} justify={'center'} mt={2}>
            <AvatarGroup max={3} size="xs">
              <Avatar
                name="Anoushk"
                src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683132586/People%20DPs/recA3Sa7t1loYvDHo.jpg"
              />
              <Avatar
                name="Ujjwal"
                src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135404/People%20DPs/rec4XUFtbh6upVYpA.jpg"
              />
              <Avatar
                name="Yash"
                src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135395/People%20DPs/recb4gDjdKoFDAyo7.png"
              />
            </AvatarGroup>
            {usersCount !== null && (
              <Text ml={'0.2rem'} fontSize={'0.8rem'}>
                Join {usersCount.toLocaleString()}+ others
              </Text>
            )}
          </Flex>
        </Flex>
      )}
    </>
  );
}
