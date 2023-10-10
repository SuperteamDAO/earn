import { Avatar, AvatarGroup, Box, Button, Flex, Text } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

import { userStore } from '@/store/user';
import { Mixpanel } from '@/utils/mixpanel';

interface BannerProps {
  setTriggerLogin: (arg0: boolean) => void;
}

export default function HomeBanner({ setTriggerLogin }: BannerProps) {
  // const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

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
      .then((response) => setUsersCount(response.data.totalUsers));
  }, []);

  return (
    <>
      <Box
        w={'100%'}
        h={72}
        mb={8}
        mx={'auto'}
        p={10}
        bgImage="url('/assets/home/display/banner.png')"
        bgSize={'cover'}
        rounded={'md'}
      >
        <Text
          color="white"
          fontSize={'3xl'}
          fontWeight={'700'}
          lineHeight={'1.875rem'}
        >
          Unlock your crypto
          <br /> earning potential
        </Text>
        <Text mt={'4'} color={'white'} fontSize={'lg'}>
          Explore bounties, projects, and grant opportunities for
          <br />
          developers and non-technical talent alike
        </Text>
        <Flex align={'center'} mt={'1.5625rem'}>
          <Button
            px={'2.25rem'}
            py={'0.75rem'}
            color={'#3223A0'}
            fontSize={'0.875rem'}
            bg={'white'}
            onClick={() => {
              Mixpanel.track('sign_up_clicked');
              handleSubmit();
            }}
          >
            Sign Up
          </Button>
          <AvatarGroup ml={'2.875rem'} max={3} size="sm">
            <Avatar
              borderWidth={'0.8px'}
              name="Anoushk"
              src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683132586/People%20DPs/recA3Sa7t1loYvDHo.jpg"
            />
            <Avatar
              borderWidth={'0.8px'}
              name="Ujjwal"
              src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135404/People%20DPs/rec4XUFtbh6upVYpA.jpg"
            />
            <Avatar
              borderWidth={'0.8px'}
              name="Yash"
              src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135395/People%20DPs/recb4gDjdKoFDAyo7.png"
            />
          </AvatarGroup>
          {usersCount !== null && (
            <Text ml={'0.6875rem'} color="white" fontSize={'0.875rem'}>
              Join {usersCount.toLocaleString()}+ others
            </Text>
          )}
        </Flex>
      </Box>
    </>
  );
}
