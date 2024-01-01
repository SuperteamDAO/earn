import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
  useMediaQuery,
} from '@chakra-ui/react';
import type { Wallet as SolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Login } from '@/components/modals/Login/Login';
import { userStore } from '@/store/user';

interface UserInfoProps {
  isMobile?: boolean;
}

export function UserInfo({ isMobile }: UserInfoProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { connected, publicKey, wallet, wallets, select } = useWallet();
  const { setUserInfo, userInfo } = userStore();
  const [initialStep, setInitialStep] = useState<number>(1);
  const [isLessthan768] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const makeUser = async () => {
      if (publicKey && connected) {
        const publicKeyString = publicKey.toBase58() as string;
        const userDetails = await axios.post('/api/user/', {
          publicKey: publicKeyString,
        });
        if (!userDetails.data) {
          setUserInfo({ publicKey: publicKeyString });
        } else if (!userDetails.data.isVerified) {
          setUserInfo(userDetails.data);
        } else {
          setUserInfo(userDetails.data);
          onClose();
        }
      }
    };
    makeUser();
  }, [publicKey, connected]);

  const onConnectWallet = async (solanaWallet: SolanaWallet) => {
    try {
      select(solanaWallet.adapter.name);
    } catch (e) {
      console.log('Wallet not found');
    }
  };

  const onDisconnectWallet = async () => {
    if (wallet == null) {
      return;
    }
    await wallet.adapter.disconnect();
    setUserInfo({});
  };

  const displayValue = isMobile
    ? { base: 'block', md: 'none' }
    : { base: 'none', md: 'block' };

  return (
    <>
      {!!isOpen && (
        <Login
          wallets={wallets}
          onConnectWallet={onConnectWallet}
          isOpen={isOpen}
          onClose={onClose}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          initialStep={initialStep}
        />
      )}
      {connected ? (
        <>
          {userInfo && !userInfo.isVerified && (
            <Button
              display={displayValue}
              fontSize="xs"
              onClick={() => {
                setInitialStep(2);
                onOpen();
              }}
              size="sm"
              variant={{ base: 'solid', md: 'ghost' }}
            >
              Verify your Email
            </Button>
          )}
          {userInfo &&
            !userInfo.currentSponsorId &&
            !userInfo.isTalentFilled &&
            userInfo.isVerified && (
              <Button
                display={displayValue}
                fontSize="xs"
                onClick={() => {
                  router.push('/new');
                }}
                size="sm"
                variant={{ base: 'solid', md: 'ghost' }}
              >
                Complete your Profile
              </Button>
            )}
          <Menu>
            <MenuButton
              display={isMobile ? 'none' : 'flex'}
              minW={0}
              cursor={'pointer'}
              rounded={'full'}
            >
              <Flex align="center">
                {userInfo?.photo ? (
                  <Image
                    boxSize="32px"
                    borderRadius="full"
                    alt={`${userInfo?.firstName} ${userInfo?.lastName}`}
                    src={userInfo?.photo}
                  />
                ) : (
                  <Avatar
                    name={`${userInfo?.firstName} ${userInfo?.lastName}`}
                    colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                    size={32}
                    variant="marble"
                  />
                )}
                <Box display={displayValue} ml={2}>
                  {!userInfo?.firstName ? (
                    <Text color="brand.slate.800" fontSize="sm">
                      New User
                    </Text>
                  ) : (
                    <Text color="brand.slate.800" fontSize="sm">
                      {userInfo?.firstName}
                    </Text>
                  )}
                  <Text color="brand.slate.500" fontSize="xs">
                    {userInfo?.publicKey?.substring(0, 4)}
                    ....
                    {userInfo?.publicKey?.substring(
                      userInfo.publicKey.length - 4,
                      userInfo?.publicKey?.length
                    )}
                  </Text>
                </Box>
              </Flex>
            </MenuButton>
            <MenuList>
              {userInfo?.isTalentFilled && (
                <MenuItem
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={600}
                  onClick={() => {
                    router.push(`/t/${userInfo?.username}`);
                  }}
                >
                  Profile
                </MenuItem>
              )}
              {userInfo?.isTalentFilled && (
                <MenuItem
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={600}
                  onClick={() => {
                    router.push(`/t/${userInfo?.username}/edit`);
                  }}
                >
                  Edit Profile
                </MenuItem>
              )}
              {!isLessthan768 &&
                (userInfo?.role === 'GOD' || !!userInfo?.currentSponsorId) && (
                  <MenuItem
                    color="brand.slate.500"
                    fontSize="sm"
                    fontWeight={600}
                    onClick={() => {
                      router.push('/dashboard/bounties');
                    }}
                  >
                    Sponsor Dashboard
                  </MenuItem>
                )}
              {!isLessthan768 && userInfo?.role === 'GOD' && (
                <>
                  <MenuDivider />
                  <MenuGroup
                    ml={3}
                    color="brand.slate.700"
                    fontSize="xs"
                    fontWeight={700}
                    title="God Mode"
                  >
                    <MenuItem
                      color="brand.slate.500"
                      fontSize="sm"
                      fontWeight={600}
                      onClick={() => {
                        router.push('/new/sponsor');
                      }}
                    >
                      Create New Sponsor
                    </MenuItem>
                  </MenuGroup>
                </>
              )}
              <MenuDivider />
              <MenuItem
                color="red.500"
                fontSize="sm"
                fontWeight={600}
                onClick={() => {
                  onDisconnectWallet();
                }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </>
      ) : (
        <>
          <HStack flexDir={{ base: 'column', md: 'row' }} gap={2}>
            <HStack gap={0} w={{ base: '100%', md: 'auto' }}>
              <Button
                display={isMobile ? 'none' : { base: 'none', md: 'block' }}
                fontSize="xs"
                onClick={() => {
                  router.push('/sponsor');
                }}
                size="sm"
                variant={{ base: 'solid', md: 'ghost' }}
              >
                Create A Listing
              </Button>
              <Button
                display={displayValue}
                w={{ base: '100%', md: 'auto' }}
                fontSize="xs"
                onClick={() => {
                  onOpen();
                }}
                size="sm"
                variant={{ base: 'solid', md: 'ghost' }}
              >
                Login
              </Button>
            </HStack>
            <Button
              display={displayValue}
              w={{ base: '100%' }}
              px={4}
              fontSize="xs"
              onClick={() => {
                onOpen();
              }}
              size="sm"
              variant="solid"
            >
              Sign Up
            </Button>
          </HStack>
        </>
      )}
    </>
  );
}
