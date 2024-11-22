import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
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
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

import { EarnAvatar, EmailSettingsModal } from '@/features/talent';
import { useLogout, useUser } from '@/store/user';

export function UserMenu({ }) {
  const router = useRouter();
  const posthog = usePostHog();

  const { user } = useUser();
  const logout = useLogout();

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

  return (
    <>
      <EmailSettingsModal isOpen={isOpen} onClose={handleClose} />
      {user && !user.currentSponsorId && !user.isTalentFilled && (
        <Button
          className="ph-no-capture"
          display={{ base: 'none', md: 'flex' }}
          fontSize="xs"
          onClick={() => {
            posthog.capture('complete profile_nav bar');
            router.push('/new');
          }}
          size="sm"
          variant={'ghost'}
        >
          Please complete your profile before commenting on the listing.
        </Button>
      )}
      <Menu>
        <MenuButton
          className="ph-no-capture"
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
          id="user menu"
          onClick={() => {
            posthog.capture('clicked_user menu');
          }}
          rightIcon={
            <ChevronDownIcon
              color="brand.slate.400"
              boxSize={{ base: 4, md: 5 }}
            />
          }
        >
          <Flex align="center">
            <EarnAvatar id={user?.id} avatar={user?.photo} />

            <Flex
              align={'center'}
              display={{ base: 'none', md: 'flex' }}
              ml={2}
            >
              <Text color="brand.slate.600" fontSize="sm" fontWeight={500}>
                {user?.firstName ?? 'New User'}
              </Text>
            </Flex>
          </Flex>
        </MenuButton>
        <MenuList className="ph-no-capture">
          {user?.isTalentFilled && (
            <>
              <MenuItem
                className="ph-no-capture"
                as={NextLink}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={`/t/${user?.username}`}
                onClick={() => {
                  posthog.capture('profile_user menu');
                }}
              >
                我的
              </MenuItem>
              <MenuItem
                className="ph-no-capture"
                as={NextLink}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={`/t/${user?.username}/edit`}
                onClick={() => {
                  posthog.capture('edit profile_user menu');
                }}
              >
                编辑个人信息
              </MenuItem>
            </>
          )}
          {!!user?.currentSponsorId && (
            <>
              <MenuItem
                className="ph-no-capture"
                as={NextLink}
                display={{ base: 'none', sm: 'block' }}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={600}
                href={'/dashboard/listings'}
                onClick={() => {
                  posthog.capture('sponsor dashboard_user menu');
                }}
              >
                项目方仪表盘
              </MenuItem>
            </>
          )}
          {session?.user?.role === 'GOD' && (
            <Box display={{ base: 'none', sm: 'block' }}>
              <MenuGroup
                mb={0}
                ml={3}
                color="brand.slate.400"
                fontSize="xs"
                fontWeight={500}
                title="超级管理员模式"
              >
                <MenuItem
                  as={NextLink}
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={600}
                  href={'/new/sponsor'}
                >
                  创建项目方
                </MenuItem>
                {/* <MenuItem
                  as={NextLink}
                  color="brand.slate.500"
                  fontSize="sm"
                  fontWeight={600}
                  href={'/admin/sponsors'}
                >
                  {t('userMenu.bountyDashboard')}
                </MenuItem> */}
              </MenuGroup>
              <MenuDivider />
            </Box>
          )}
          {(user?.isTalentFilled || !!user?.currentSponsorId) && (
            <MenuItem
              className="ph-no-capture"
              color="brand.slate.500"
              fontSize="sm"
              fontWeight={600}
              onClick={() => {
                onOpen();
                posthog.capture('email preferences_user menu');
              }}
            >
              Email 设置
            </MenuItem>
          )}
          <MenuItem
            className="ph-no-capture"
            color="brand.slate.500"
            fontSize="sm"
            fontWeight={600}
            onClick={() => {
              window.open('mailto:vesper.yang.blockchain@gmail.com', '_blank');
              posthog.capture('get help_user menu');
            }}
          >
            获取帮助
          </MenuItem>
          <MenuItem
            className="ph-no-capture"
            color="red.500"
            fontSize="sm"
            fontWeight={600}
            onClick={() => {
              posthog.capture('logout_user menu');
              logout();
            }}
          >
            登出
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}
