/* eslint-disable no-nested-ternary */
import { ChevronDownIcon, Search2Icon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import type { Wallet as SolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import Avatar from 'boring-avatars';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';

import { TalentStore } from '../../store/talent';
import { userStore } from '../../store/user';
import { createUser, findTalentPubkey } from '../../utils/functions';
import { truncatedPublicKey } from '../../utils/helpers';
import { ConnectWalletModal } from '../modals/connectWalletModal';

function NavHome() {
  const router = useRouter();
  const [search, setSearch] = useState<string>('');

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { setUserInfo, userInfo } = userStore();
  const { setTalentInfo, talentInfo } = TalentStore();

  const { connected, publicKey, wallet, select } = useWallet();
  const findTalent = async () => {
    const talent = await findTalentPubkey(publicKey?.toBase58() as string);
    if (!talent) {
      return null;
    }
    return setTalentInfo(talent.data);
  };
  useEffect(() => {
    const makeUser = async () => {
      if (publicKey && connected) {
        const res = await createUser(publicKey.toBase58() as string);
        setUserInfo(res.data);
        if (res.data?.talent) {
          await findTalent();
          return;
        }

        if (!res.data?.sponsor) {
          router.push('/new');
        }
      }
    };
    makeUser();
  }, [publicKey, connected]);
  const onConnectWallet = async (solanaWallet: SolanaWallet) => {
    try {
      // await connect();

      select(solanaWallet.adapter.name);
    } catch (e) {
      toast.error('Wallet not found');
    }
  };
  const onDisconnectWallet = async () => {
    if (wallet == null) {
      return;
    }
    await wallet.adapter.disconnect();
  };
  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      let path = `${router.asPath}?search=${search}`;
      if (router.asPath.includes('?')) {
        if (router.query.search) {
          path = `${router.asPath.split('?')[0]}?search=${search}`;
        } else {
          path = `${router.asPath}&search=${search}`;
        }
      }
      router.replace(path);
    }
  };

  useEffect(() => {
    if (!search) return;
    document.addEventListener('keydown', handleKeyDown);

    // eslint-disable-next-line consistent-return
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  return (
    <Box bg={'FFFFFF'}>
      {(isOpen || !connected) && (
        <ConnectWalletModal
          onConnectWallet={onConnectWallet}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
      <Flex
        align={'center'}
        h={'3rem'}
        mx={'auto'}
        px={'1.25rem'}
        bg={'FFFFFF'}
      >
        <Image
          h={'1.0437rem'}
          objectFit={'contain'}
          alt={'logo'}
          onClick={() => {
            router.push('/');
          }}
          src={'/assets/logo/logo.png'}
        />
        <Flex align={'center'} gap={2}>
          <Input
            w={'10.75rem'}
            h={'2rem'}
            ml={'3.125rem'}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search"
          />
          <Button
            color={'white'}
            bg={'#6366F1'}
            isDisabled={search.length === 0}
            onClick={() => {
              let path = `${router.asPath}?search=${search}`;
              if (router.asPath.includes('?')) {
                if (router.query.search) {
                  path = `${router.asPath.split('?')[0]}?search=${search}`;
                } else {
                  path = `${router.asPath}&search=${search}`;
                }
              }
              router.replace(path);
            }}
            size={'sm'}
          >
            <Search2Icon />
          </Button>
        </Flex>
        <Flex columnGap={'1.5625rem'} h={'full'} ml={'1.25rem'}>
          {['All Opportunties', 'Bounties', 'Jobs'].map((elm) => {
            return (
              <Center
                key={elm}
                h={'full'}
                fontSize={'0.75rem'}
                borderBottom={
                  router.asPath !== '/'
                    ? router.query.category
                      ? router.query.category === elm.toLowerCase()
                        ? '0.0625rem solid #6366F1'
                        : ''
                      : router.asPath === '/' ||
                        (router.asPath.startsWith('/?') &&
                          elm === 'All Opportunties')
                      ? '0.0625rem solid #6366F1'
                      : ''
                    : ''
                }
                cursor={'pointer'}
              >
                <Menu>
                  <MenuButton
                    as={Button}
                    px={'0.3125rem'}
                    fontSize={'0.75rem'}
                    bg={'transparent'}
                    rightIcon={<ChevronDownIcon />}
                  >
                    {elm}
                  </MenuButton>
                  <MenuList zIndex={'500'}>
                    {[
                      'All Opportunties',
                      'Design',
                      'Growth',
                      'Content',
                      'Frontend',
                      'Backend',
                      'Blockchain',
                    ].map((option) => {
                      return (
                        <MenuItem
                          key={option}
                          onClick={() => {
                            if (option !== 'All Opportunties') {
                              if (elm === 'All Opportunties') {
                                router.replace(`/all/${option.toLowerCase()}`);
                                return;
                              }
                              router.replace(
                                `/${elm.toLowerCase()}/${option.toLowerCase()}`
                              );
                            } else {
                              if (elm === 'All Opportunties') {
                                router.replace(`/`);
                                return;
                              }
                              router.replace(`/${elm.toLowerCase()}`);
                            }
                          }}
                        >
                          {option}
                        </MenuItem>
                      );
                    })}
                  </MenuList>
                </Menu>
              </Center>
            );
          })}
          <Center
            h={'min-content'}
            my={'auto'}
            px={'0.3rem'}
            py={'0.65rem'}
            fontSize={'0.75rem'}
            fontWeight={'600'}
            _hover={{
              bg: 'gray.100',
            }}
            cursor={'pointer'}
            onClick={() => {
              router.replace(`/grants`);
            }}
            rounded={'md'}
          >
            Grants
          </Center>
        </Flex>

        <Flex align={'center'} columnGap={'1.5625rem'} ml={'auto'}>
          {!connected ? (
            <>
              <Center
                h={'full'}
                fontSize={'0.75rem'}
                cursor={'pointer'}
                onClick={() => {
                  onOpen();
                }}
              >
                Login
              </Center>
              <Button
                h={'2rem'}
                color={'white'}
                fontSize={'0.75rem'}
                bg={'#6366F1'}
                onClick={() => {
                  router.push('/new');
                }}
                rounded={'md'}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <HStack gap={2}>
              {userInfo?.sponsor && (
                <Button
                  w="100%"
                  color="#6562FF"
                  fontSize="0.9rem"
                  fontWeight={600}
                  bg="transparent"
                  border="1px solid #6562FF"
                  onClick={() => {
                    router.push('/listings/create');
                  }}
                >
                  Create a Listing
                </Button>
              )}
              <Divider
                h={12}
                borderColor={'gray.300'}
                orientation={'vertical'}
              />

              <Menu>
                <MenuButton>
                  <HStack>
                    <Avatar
                      variant="marble"
                      colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                    />
                    <Flex align={'center'} justify={'space-between'} gap={5}>
                      <Text
                        color={'gray.600'}
                        fontFamily={'Inter'}
                        fontWeight={600}
                      >
                        {truncatedPublicKey(publicKey?.toString() as string, 7)}
                      </Text>
                      <MdOutlineKeyboardArrowDown />
                    </Flex>
                  </HStack>
                </MenuButton>
                <MenuList w={'15rem'}>
                  <MenuItem
                    isDisabled={!talentInfo?.username}
                    onClick={() => router.push(`/t/${talentInfo?.username}`)}
                  >
                    <Text color="gray.600" fontSize="0.9rem">
                      View Profile
                    </Text>
                  </MenuItem>
                  {userInfo?.sponsor && (
                    <MenuItem
                      onClick={() => {
                        router.push('/dashboard/team');
                      }}
                    >
                      <Text color="gray.600" fontSize="0.9rem">
                        Dashboard
                      </Text>
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      onDisconnectWallet();
                    }}
                  >
                    <Text color="gray.600" fontSize="0.9rem">
                      Disconnect
                    </Text>
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

export default NavHome;
