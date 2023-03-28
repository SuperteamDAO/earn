import React, { useState } from 'react';
import { Input, Box, Image, Flex, Center, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';

function NavHome() {
  const [selected, setselected] = useState('All Opportunties');
  const router = useRouter();
  return (
    <Box bg={'FFFFFF'}>
      <Flex
        h={'48px'}
        w={'1400px'}
        bg={'FFFFFF'}
        alignItems={'center'}
        mx={'auto'}
      >
        <Image
          h={'16.7px'}
          alt={'logo'}
          objectFit={'contain'}
          src={'/assets/logo/logo.png'}
        />
        <Input w={'172px'} h={'32px'} ml={'50px'} />

        <Flex h={'full'} columnGap={'25px'} ml={'20px'}>
          {['All Opportunties', 'Bounties', 'Grants', 'Jobs'].map((elm) => {
            return (
              <Center
                cursor={'pointer'}
                fontSize={'12px'}
                h={'full'}
                key={elm}
                onClick={() => {
                  if (elm.toLocaleLowerCase() == 'all opportunties') {
                    router.replace(router.asPath.split('?')[0]);
                    setselected(elm);
                    return;
                  }
                  if (router.asPath.split('?')[1]) {
                    router.replace(
                      router.asPath.split('?')[0] +
                        '?type=' +
                        elm.toLocaleLowerCase()
                    );
                    setselected(elm);
                    return;
                  }
                  router.replace(
                    router.asPath + '?type=' + elm.toLocaleLowerCase()
                  );
                  setselected(elm);
                }}
                borderBottom={selected == elm ? '1px solid #6366F1' : ''}
              >
                {elm}
              </Center>
            );
          })}
        </Flex>

        <Flex ml={'auto'} columnGap={'25px'} alignItems={'center'}>
          <Center cursor={'pointer'} fontSize={'12px'} h={'full'}>
            Submit A Bounty
          </Center>
          <Center cursor={'pointer'} fontSize={'12px'} h={'full'}>
            Login
          </Center>
          <Button
            rounded={'md'}
            bg={'#6366F1'}
            color={'white'}
            fontSize={'12px'}
            h={'32px'}
          >
            Sign Up
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

export default NavHome;
