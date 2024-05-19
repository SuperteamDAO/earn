import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Circle,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { userStore } from '@/store/user';

import { EmailSettingsModal } from '../modals/EmailSettingsModal';
import { EarnAvatar } from './EarnAvatar';

export function UserMenu({}) {
  const router = useRouter();

  const { userInfo, logOut } = userStore();

  const { data: session } = useSession();

  const { isOpen, onClose, onOpen } = useDisclosure();

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const url = window.location.href;
      const hashIndex = url.indexOf('#');
      const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
      const [hashValue, queryString] = afterHash.split('?');
      const hashHasEmail = hashValue === 'emailPreferences';
      const queryParams = new URLSearchParams(queryString);
      if (
        (hashHasEmail && queryParams.get('loginState') === 'signedIn') ||
        hashHasEmail
      ) {
        onOpen();
      }
    };

    checkHashAndOpenModal();
  }, [isOpen, onOpen]);

  const handleClose = () => {
    onClose();
    router.push(router.asPath, undefined, { shallow: true });
  };

  const [showBlueCircle, setShowBlueCircle] = useState(() => {
    return !localStorage.getItem('emailPreferencesClicked');
  });

  const handleEmailPreferencesClick = () => {
    onOpen();
    setShowBlueCircle(false);
    localStorage.setItem('emailPreferencesClicked', 'true');
  };

  return (
    <>
      <EmailSettingsModal isOpen={isOpen} onClose={handleClose} />
      {userInfo && !userInfo.currentSponsorId && !userInfo.isTalentFilled && (
        <Button
          display={{ base: 'none', md: 'flex' }}
          fontSize="xs"
          onClick={() => {
            router.push('/new');
          }}
          size="sm"
          variant={'ghost'}
        >
          Complete your Profile
        </Button>
      )}
      <Menu>
        <MenuButton
          as={Button}
          px={{ base: 0.5, md: 2 }}
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
            <ChevronDownIcon
              color="brand.slate.400"
              boxSize={{ base: 4, md: 5 }}
            />
          }
        >
          <Flex align="center">
            <EarnAvatar id={userInfo?.id} avatar={userInfo?.photo} />
            {showBlueCircle && (
              <Circle
                display={{ base: 'flex', md: 'none' }}
                ml={2}
                bg="blue.400"
                size="8px"
              />
            )}

            <Flex
              align={'center'}
              display={{ base: 'none', md: 'flex' }}
              ml={2}
            >
              <Text color="brand.slate.600" fontSize="sm" fontWeight={500}>
                {userInfo?.firstName ?? 'New User'}
              </Text>
              {showBlueCircle && <Circle ml={2} bg="blue.400" size="8px" />}
            </Flex>
          </Flex>
        </MenuButton>
        <MenuList>
          {userInfo?.isTalentFilled && (
            <>
              <MenuItem
                as={NextLink}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={`/t/${userInfo?.username}`}
              >
                Profile
              </MenuItem>
              <MenuItem
                as={NextLink}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={`/t/${userInfo?.username}/edit`}
              >
                Edit Profile
              </MenuItem>
            </>
          )}
          {!!userInfo?.currentSponsorId && (
            <>
              <MenuItem
                as={NextLink}
                display={{ base: 'none', sm: 'block' }}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={'/dashboard/listings'}
              >
                Sponsor Dashboard
              </MenuItem>
            </>
          )}
          <MenuDivider />
          {session?.user?.role === 'GOD' && (
            <Box display={{ base: 'none', sm: 'block' }}>
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
            </Box>
          )}
          {(userInfo?.isTalentFilled || !!userInfo?.currentSponsorId) && (
            <MenuItem
              color="brand.slate.500"
              fontSize="sm"
              fontWeight={600}
              onClick={handleEmailPreferencesClick}
            >
              Email Preferences
              {showBlueCircle && <Circle ml={2} bg="blue.400" size="8px" />}
            </MenuItem>
          )}
          <MenuItem
            color="brand.slate.500"
            fontSize="sm"
            fontWeight={600}
            onClick={() =>
              window.open('mailto:hello@superteamearn.com', '_blank')
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
  );
}
