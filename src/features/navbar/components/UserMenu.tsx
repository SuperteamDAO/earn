import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { EmailSettingsModal } from '@/components/modals/EmailSettingsModal';
import { userStore } from '@/store/user';

export function UserMenu({}) {
  const router = useRouter();

  const { userInfo, logOut } = userStore();

  const { data: session } = useSession();

  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <>
      <EmailSettingsModal isOpen={isOpen} onClose={onClose} />
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
            <Flex display={{ base: 'none', md: 'flex' }} ml={2}>
              <Text color="brand.slate.600" fontSize="sm" fontWeight={500}>
                {userInfo?.firstName ?? 'New User'}
              </Text>
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
              onClick={onOpen}
            >
              Email Preferences
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
