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

const avatars = [
  {
    name: 'Anoushk',
    src: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1683132586/People%20DPs/recA3Sa7t1loYvDHo.jpg',
  },
  {
    name: 'Ujjwal',
    src: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135404/People%20DPs/rec4XUFtbh6upVYpA.jpg',
  },
  {
    name: 'Yash',
    src: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135395/People%20DPs/recb4gDjdKoFDAyo7.png',
  },
];

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
      .then((response) => setUsersCount(response.data.totalUsers));
  }, []);

  return (
    <>
      <Box
        w={'100%'}
        h={isLessThan768px ? '96' : 'auto'}
        maxH={'500px'}
        mb={8}
        mx={'auto'}
        p={{ base: '6', md: '10' }}
        bgImage={
          isLessThan768px
            ? "url('/assets/home/display/banner-mobile.png')"
            : "url('/assets/home/display/banner.png')"
        }
        bgSize={'cover'}
        bgPosition={'center'}
        rounded={'md'}
      >
        <Text
          color="white"
          fontSize={'28px'}
          fontWeight={'700'}
          lineHeight={'2.2rem'}
        >
          Unlock your crypto
          <br /> earning potential
        </Text>
        <Text
          maxW={{ base: '100%', md: '460px' }}
          mt={isLessThan768px ? '2' : '4'}
          color={'white'}
          fontSize={{ base: 'sm', md: 'lg' }}
        >
          Explore bounties, projects, and grant opportunities for developers and
          non-technical talent alike
        </Text>
        <Flex
          align={'center'}
          direction={isLessThan768px ? 'column' : 'row'}
          gap={isLessThan768px ? '3' : '4'}
          mt={isLessThan768px ? '24' : '4'}
        >
          <Button
            w={isLessThan768px ? '100%' : 'auto'}
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
          <Flex align="center">
            <AvatarGroup max={3} size="sm">
              {avatars.map((avatar, index) => (
                <Avatar
                  key={index}
                  borderWidth={'1px'}
                  borderColor={'#49139c'}
                  name={avatar.name}
                  src={avatar.src}
                />
              ))}
            </AvatarGroup>
            {usersCount !== null && (
              <Text ml={'0.6875rem'} color="white" fontSize={'0.875rem'}>
                Join {usersCount.toLocaleString()}+ others
              </Text>
            )}
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
