import {
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
import Avatar from 'boring-avatars';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Login } from '@/components/modals/Login/Login';
import { userStore } from '@/store/user';

interface UserInfoProps {
  isMobile?: boolean;
}

export function UserInfo({ isMobile }: UserInfoProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { setUserInfo, userInfo } = userStore();
  const [initialStep, setInitialStep] = useState<number>(1);
  const [isLessthan768] = useMediaQuery('(max-width: 768px)');

  const displayValue = isMobile
    ? { base: 'block', md: 'none' }
    : { base: 'none', md: 'block' };

  const { data: session } = useSession();

  useEffect(() => {
    console.log(session);
  }, []);

  return (
    <>
      {!!isOpen && (
        <Login
          isOpen={isOpen}
          onClose={onClose}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          initialStep={initialStep}
        />
      )}
      {session ? (
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
                {session?.user?.photo ? (
                  <Image
                    boxSize="32px"
                    borderRadius="full"
                    objectFit={'cover'}
                    alt={`${session?.user?.firstName} ${session?.user?.lastName}`}
                    src={session?.user?.photo}
                  />
                ) : (
                  <Avatar
                    name={`${session?.user?.firstName} ${session?.user?.lastName}`}
                    colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                    size={32}
                    variant="marble"
                  />
                )}
                <Flex display={displayValue} ml={2}>
                  {!session?.user?.firstName ? (
                    <Text color="brand.slate.800" fontSize="sm">
                      New User
                    </Text>
                  ) : (
                    <Text color="brand.slate.800" fontSize="sm">
                      {session?.user?.firstName}
                    </Text>
                  )}
                  <Text color="brand.slate.500" fontSize="xs">
                    {session.user?.email?.substring(0, 6)}
                    ...
                    {session.user?.email?.substring(
                      session.user.email.length - 6,
                      session.user?.email?.length
                    )}
                  </Text>
                </Flex>
              </Flex>
            </MenuButton>
            <MenuList>
              {userInfo?.isTalentFilled && (
                <MenuItem
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={600}
                  onClick={() => {
                    router.push(`/t/${session?.user?.username}`);
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
                    router.push(`/t/${session?.user?.username}/edit`);
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
                onClick={() => signOut()}
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
