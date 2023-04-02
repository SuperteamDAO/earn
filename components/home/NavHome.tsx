import React, { useEffect, useState } from 'react';
import {
  Input,
  Box,
  Image,
  Flex,
  Center,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Text,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ChevronDownIcon, Search2Icon } from '@chakra-ui/icons';
import { ConnectWalletModal } from '../modals/connectWalletModal';
import {
  useWallet,
  Wallet as SolanaWallet,
} from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { userStore } from '../../store/user';
import { TalentStore } from '../../store/talent';
import { SponsorStore } from '../../store/sponsor';
import { createUser, findTalentPubkey } from '../../utils/functions';
import { truncatedPublicKey } from '../../utils/helpers';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';
import Avatar from 'boring-avatars';

function NavHome() {
  const [selected, setselected] = useState('All Opportunties');
  const router = useRouter();
  const [search, setSearch] = useState<string>('');

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { setUserInfo, userInfo } = userStore();
  const { setTalentInfo, talentInfo } = TalentStore();
  const { currentSponsor, setCurrentSponsor } = SponsorStore();

  const { connected, publicKey, wallet, connect, select, wallets } =
    useWallet();
  useEffect(() => {
    const makeUser = async () => {
      console.log(publicKey, connected);

      if (publicKey && connected) {
        const res = await createUser(publicKey.toBase58() as string);
        setUserInfo(res.data);
        if (res.data?.talent) {
          await findTalent();
        }
      }
    };
    makeUser();
  }, [publicKey, connected]);
  const findTalent = async () => {
    const talent = await findTalentPubkey(publicKey?.toBase58() as string);
    if (!talent) {
      return;
    }
    return setTalentInfo(talent.data);
  };
  const onConnectWallet = async (wallet: SolanaWallet) => {
    try {
      // await connect();

      select(wallet.adapter.name);
    } catch (e) {
      console.log(e, '--');

      toast.error('Wallet not found');
    }
  };
  const onDisconnectWallet = async () => {
    if (wallet == null) {
      return;
    }
    await wallet.adapter.disconnect();
  };

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
        h={'3rem'}
        px={'1.25rem'}
        bg={'FFFFFF'}
        alignItems={'center'}
        mx={'auto'}
      >
        <Image
          onClick={() => {
            router.push('/');
          }}
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
            isDisabled={search.length == 0}
            size={'sm'}
          >
            <Search2Icon />
          </Button>
        </Flex>
        <Flex h={'full'} columnGap={'1.5625rem'} ml={'1.25rem'}>
          {['All Opportunties', 'Bounties', 'Grants', 'Jobs'].map((elm) => {
            console.log(router.query.category);

            return (
              <Center
                cursor={'pointer'}
                fontSize={'0.75rem'}
                h={'full'}
                key={elm}
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
              >
                <Menu>
                  <MenuButton
                    px={'0.3125rem'}
                    fontSize={'0.75rem'}
                    bg={'transparent'}
                    as={Button}
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
                          onClick={() => {
                            if (option != 'All Opportunties') {
                              if (elm === 'All Opportunties') {
                                router.replace(`/all/${option.toLowerCase()}`);
                                setselected(option);
                                return;
                              }
                              router.replace(
                                `/${elm.toLowerCase()}/${option.toLowerCase()}`
                              );
                              setselected(elm);
                            } else {
                              if (elm === 'All Opportunties') {
                                router.replace(`/`);
                                setselected(elm);
                                return;
                              }
                              router.replace(`/${elm.toLowerCase()}`);
                              setselected(elm);
                            }
                          }}
                          key={option}
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
        </Flex>

        <Flex ml={'auto'} columnGap={'1.5625rem'} alignItems={'center'}>
          {!connected ? (
            <>
              <Center
                onClick={() => {
                  onOpen();
                }}
                cursor={'pointer'}
                fontSize={'0.75rem'}
                h={'full'}
              >
                Login
              </Center>
              <Button
                rounded={'md'}
                bg={'#6366F1'}
                color={'white'}
                fontSize={'0.75rem'}
                h={'2rem'}
                onClick={() => {
                  router.push('/new');
                }}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <HStack gap={2}>
              {userInfo?.sponsor && (
                <Button
                  w="100%"
                  fontSize="0.9rem"
                  fontWeight={600}
                  color="#6562FF"
                  border="1px solid #6562FF"
                  bg="transparent"
                  onClick={() => {
                    router.push('/listings/create');
                  }}
                >
                  Create a Listing
                </Button>
              )}
              <Divider
                borderColor={'gray.300'}
                h={12}
                orientation={'vertical'}
              />

              <Menu>
                <MenuButton>
                  <HStack>
                    <Avatar
                      variant="marble"
                      colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                    />
                    <Flex gap={5} justify={'space-between'} align={'center'}>
                      <Text
                        color={'gray.600'}
                        fontWeight={600}
                        fontFamily={'Inter'}
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
                    <Text fontSize="0.9rem" color="gray.600">
                      View Profile
                    </Text>
                  </MenuItem>
                  {userInfo?.sponsor && (
                    <MenuItem
                      onClick={() => {
                        router.push('/dashboard/team');
                      }}
                    >
                      <Text fontSize="0.9rem" color="gray.600">
                        Dashboard
                      </Text>
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      onDisconnectWallet();
                    }}
                  >
                    <Text fontSize="0.9rem" color="gray.600">
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
