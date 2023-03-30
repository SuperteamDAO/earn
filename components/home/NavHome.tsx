import React, { useState } from 'react';
import { Input, Box, Image, Flex, Center, Button, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ChevronDownIcon } from '@chakra-ui/icons'

function NavHome() {
  const [selected, setselected] = useState('All Opportunties');
  const router = useRouter();
  const [search, setSearch] = useState<string>('');
  return (
    <Box bg={'FFFFFF'} >
      <Flex
        h={'3rem'}
        px={"1.25rem"}
        bg={'FFFFFF'}
        alignItems={'center'}
        mx={'auto'}
      >
        <Image
          h={'1.0437rem'}
          alt={'logo'}
          objectFit={'contain'}
          src={'/assets/logo/logo.png'}
        />
        <Flex align={'center'} gap={2}>
          <Input
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search"
            w={'10.75rem'}
            h={'2rem'}
            ml={'3.125rem'}
          />
          <Button
            onClick={() => {
              router.replace(
                router.asPath.includes('?')
                  ? router.query.search
                    ? router.asPath.split('?')[0] + '?search=' + search
                    : router.asPath + '&search=' + search
                  : router.asPath + '?search=' + search
              );
            }}
            bg={'#6366F1'}
            color={'white'}
            size={'sm'}
          >
            Search
          </Button>
        </Flex>
        <Flex h={'full'} columnGap={'1.5625rem'} ml={'1.25rem'}>

          {['All Opportunties', 'Bounties', 'Grants', 'Jobs'].map((elm) => {
            return (
              <Center
                cursor={'pointer'}
                fontSize={'0.75rem'}
                h={'full'}
                key={elm}

                borderBottom={selected == elm ? '0.0625rem solid #6366F1' : ''}
              >
                <Menu>
                  <MenuButton px={"0.3125rem"} fontSize={'0.75rem'} bg={"transparent"} as={Button} rightIcon={<ChevronDownIcon />}>
                    {elm}
                  </MenuButton>
                  <MenuList zIndex={"500"}>
                    {
                      ['All Opportunties',
                        'Design',
                        'Growth',
                        'Content',
                        'Frontend Development',
                        'Backend Development',
                        'Contract Development',].map((option) => {
                          return (
                            <MenuItem onClick={() => {
                              if (elm.toLocaleLowerCase() == 'all opportunties') {

                                if (option.toLocaleLowerCase() == 'all opportunties') {
                                  router.replace(router.asPath.split('?')[0]);
                                  setselected(elm);
                                  return;
                                }

                                router.replace(router.asPath.split('?')[0] + '?filter=' + option.toLocaleLowerCase());
                                setselected(elm);
                                return;
                              }
                              if (router.asPath.split('?')[1]) {
                                router.replace(
                                  router.asPath.split('?')[0] +
                                  '?type=' +
                                  elm.toLocaleLowerCase() + ((option != "All Opportunties") ? '&filter=' + option.toLocaleLowerCase() : '')
                                );
                                setselected(elm);
                                return;
                              }
                              router.replace(
                                router.asPath + '?type=' + elm.toLocaleLowerCase() + ((option != "All Opportunties") ? '&filter=' + option.toLocaleLowerCase() : '')
                              );
                              setselected(elm);
                            }} key={option}>{option}</MenuItem>
                          )
                        })
                    }

                  </MenuList>
                </Menu>
              </Center>
            );
          })}
        </Flex>

        <Flex ml={'auto'} columnGap={'1.5625rem'} alignItems={'center'}>
          <Center cursor={'pointer'} fontSize={'0.75rem'} h={'full'}>
            Submit A Bounty
          </Center>
          <Center cursor={'pointer'} fontSize={'0.75rem'} h={'full'}>
            Login
          </Center>
          <Button
            rounded={'md'}
            bg={'#6366F1'}
            color={'white'}
            fontSize={'0.75rem'}
            h={'2rem'}
          >
            Sign Up
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

export default NavHome;
