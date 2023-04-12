/* eslint-disable no-nested-ternary */
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Image,
  Input,
  InputGroup,
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
import { useEffect, useState } from 'react';
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
  const categoryMap = [
    {
      name: 'All Opportunties',
      route: 'all',
    },
    {
      name: 'Bounties',
      route: 'bounties',
    },
    {
      name: 'Jobs',
      route: 'jobs',
    },
  ];

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
        gap={5}
        h={'3rem'}
        mx={'auto'}
        px={'1.25rem'}
        bg="white"
        borderBottom={'1px solid'}
        borderBottomColor={'blackAlpha.200'}
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
        <HStack align={'center'} gap={2}>
          <InputGroup size={'sm'}>
            <Input
              fontSize={'sm'}
              borderRadius={4}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search"
            />
          </InputGroup>
        </HStack>
        <Flex columnGap={'1.5625rem'} h={'full'} ml={'1.25rem'}>
          {categoryMap.map((elm) => {
            return (
              <Center
                key={elm.name}
                h={'full'}
                fontSize={'0.75rem'}
                borderBottom={'1px solid'}
                borderBottomColor={
                  router?.query?.category === elm?.route
                    ? 'brand.purple'
                    : !router?.query?.category &&
                      elm?.route === 'all' &&
                      router?.pathname !== '/grants'
                    ? 'brand.purple'
                    : 'transparent'
                }
                _hover={{
                  borderBottom: '1px solid',
                  borderBottomColor: 'brand.purple',
                }}
                cursor={'pointer'}
              >
                <Menu>
                  <MenuButton
                    as={Button}
                    px={'0.3125rem'}
                    color={
                      router?.query?.category === elm?.route
                        ? 'black'
                        : !router?.query?.category &&
                          elm?.route === 'all' &&
                          router.pathname !== '/grants'
                        ? 'black'
                        : 'gray.500'
                    }
                    fontSize={'0.75rem'}
                    bg={'transparent'}
                    _hover={{
                      bg: 'transparent',
                    }}
                    rightIcon={<ChevronDownIcon />}
                  >
                    {elm.name}
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
                              if (elm.name === 'All Opportunties') {
                                router.replace(`/all/${option.toLowerCase()}`);
                                return;
                              }
                              router.replace(
                                `/${elm.name.toLowerCase()}/${option.toLowerCase()}`
                              );
                            } else {
                              if (elm.name === 'All Opportunties') {
                                router.replace(`/`);
                                return;
                              }
                              router.replace(`/${elm.name.toLowerCase()}`);
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
            h={'full'}
            my={'auto'}
            px={'0.3rem'}
            py={'0.65rem'}
            color={router?.pathname === '/grants' ? 'black' : 'gray.500'}
            fontSize={'xs'}
            fontWeight={'600'}
            _hover={{
              bg: 'transparent',
              borderBottom: '1px solid',
              borderBottomColor: 'brand.purple',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
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

        <Flex align={'center'} columnGap={10} ml={'auto'}>
          {!connected ? (
            <>
              <Center
                h={'full'}
                fontSize={'xs'}
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
                fontSize={'xs'}
                bg={'brand.purple'}
                _hover={{
                  bg: 'brand.purple',
                }}
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
                  color="brand.purple"
                  fontSize="0.9rem"
                  fontWeight={600}
                  bg="transparent"
                  border="1px solid brand.purple"
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
