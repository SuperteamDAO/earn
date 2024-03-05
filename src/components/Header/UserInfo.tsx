import { ChevronDownIcon } from '@chakra-ui/icons';
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
  SkeletonCircle,
  SkeletonText,
  Text,
  useDisclosure,
  useMediaQuery,
} from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { Login } from '@/components/modals/Login/Login';
import { userStore } from '@/store/user';

interface UserInfoProps {
  isMobile?: boolean;
}

export function UserInfo({ isMobile }: UserInfoProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { userInfo, logOut } = userStore();
  const [isLessthan768] = useMediaQuery('(max-width: 768px)');

  const displayValue = isMobile
    ? { base: 'block', md: 'none' }
    : { base: 'none', md: 'block' };

  const { data: session, status } = useSession();

  if (status === 'loading' && !session) {
    return (
      <Flex align={'center'} gap={2}>
        <SkeletonCircle size="10" />
        <SkeletonText display={displayValue} w={'80px'} noOfLines={1} />
      </Flex>
    );
  }

  return (
    <>
      {!!isOpen && <Login isOpen={isOpen} onClose={onClose} />}
      {session ? (
        <>
          {userInfo &&
            !userInfo.currentSponsorId &&
            !userInfo.isTalentFilled && (
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
              as={Button}
              display={isMobile ? 'none' : 'flex'}
              minW={0}
              px={2}
              bg={'brand.slate.50'}
              borderWidth={'1px'}
              borderColor={'white'}
              _hover={{ bg: 'brand.slate.100' }}
              _active={{
                bg: 'brand.slate.200',
                borderColor: 'brand.slate.300',
              }}
              cursor={'pointer'}
              rightIcon={
                <ChevronDownIcon color="brand.slate.400" boxSize={5} />
              }
            >
              <Flex align="center">
                {userInfo?.photo ? (
                  <Image
                    boxSize="32px"
                    borderRadius="full"
                    objectFit={'cover'}
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
                <Flex display={displayValue} ml={2}>
                  {!userInfo?.firstName ? (
                    <Text color="brand.slate.800" fontSize="sm">
                      New User
                    </Text>
                  ) : (
                    <Text
                      color="brand.slate.600"
                      fontSize="sm"
                      fontWeight={500}
                    >
                      {userInfo?.firstName}
                    </Text>
                  )}
                </Flex>
              </Flex>
            </MenuButton>
            <MenuList>
              {userInfo?.isTalentFilled && (
                <MenuItem
                  as={NextLink}
                  fontSize="sm"
                  fontWeight={600}
                  href={`/t/${userInfo?.username}`}
                >
                  Profile
                </MenuItem>
              )}
              {userInfo?.isTalentFilled && (
                <MenuItem
                  as={NextLink}
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={600}
                  href={`/t/${userInfo?.username}/edit`}
                >
                  Edit Profile
                </MenuItem>
              )}
              {!isLessthan768 && !!userInfo?.currentSponsorId && (
                <>
                  <MenuItem
                    as={NextLink}
                    color="brand.slate.500"
                    fontSize="sm"
                    fontWeight={600}
                    href={'/dashboard/listings'}
                  >
                    Sponsor Dashboard
                  </MenuItem>
                  <MenuDivider />
                </>
              )}
              {!isLessthan768 && session?.user?.role === 'GOD' && (
                <>
                  <MenuGroup
                    mb={0}
                    ml={3}
                    color="brand.slate.400"
                    fontSize="xs"
                    fontWeight={500}
                    title="God Mode"
                  >
                    <MenuItem
                      as={NextLink}
                      color="brand.slate.500"
                      fontSize="sm"
                      fontWeight={600}
                      href={'/new/sponsor'}
                    >
                      Create New Sponsor
                    </MenuItem>
                  </MenuGroup>
                  <MenuDivider />
                </>
              )}
              <MenuItem
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                onClick={() =>
                  window.open('https://discord.com/invite/Mq3ReaekgG', '_blank')
                }
              >
                Get Help
              </MenuItem>
              <MenuItem
                color="red.500"
                fontSize="sm"
                fontWeight={600}
                onClick={() => logOut()}
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
              my={1}
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
