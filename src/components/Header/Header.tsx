import { ChevronDownIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import {
  Box,
  Collapse,
  Divider,
  Flex,
  IconButton,
  Image,
  Link,
  type LinkProps,
  Popover,
  PopoverTrigger,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { RenaissanceSecondaryLogo } from '@/svg/renaissance-secondary';

import { AnnouncementBar } from './AnnouncementBar';
import { BountySnackbar } from './BountySnackbar';
import { UserInfo } from './UserInfo';

interface NavItem {
  label: string;
  children?: Array<NavItem>;
  href?: string;
}

function renderLabel(navItem: NavItem) {
  switch (navItem.label) {
    case 'Renaissance':
      return (
        <Box>
          <RenaissanceSecondaryLogo
            styles={{ width: '116px', height: 'auto' }}
          />
        </Box>
      );
    default:
      return navItem.label;
  }
}

const NAV_ITEMS: Array<NavItem> = [
  { label: 'Bounties', href: '/bounties' },
  { label: 'Projects', href: '/projects' },
  {
    label: 'Browse Categories',
    children: [
      {
        label: 'Content',
        href: '/category/content/',
      },
      {
        label: 'Design',
        href: '/category/design/',
      },
      {
        label: 'Development',
        href: '/category/development/',
      },
      {
        label: 'Renaissance',
        href: '/renaissance/',
      },
    ],
  },
];

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Stack onClick={children && onToggle} spacing={4}>
      <Flex
        as={Link}
        align={'center'}
        justify={'space-between'}
        pt={4}
        _hover={{
          textDecoration: 'none',
        }}
        href={href ?? '#'}
      >
        <Text color={'brand.slate.500'} fontSize="md" fontWeight={400}>
          {label}
        </Text>
        {children && (
          <ChevronDownIcon
            w={6}
            h={6}
            color={'brand.slate.500'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            transition={'all .25s ease-in-out'}
          />
        )}
      </Flex>

      <Collapse animateOpacity in={isOpen} style={{ marginTop: '0!important' }}>
        <Stack
          align={'start'}
          pl={4}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          borderLeft={1}
        >
          {children &&
            children.map((child) => (
              <Link
                key={child.label}
                as={NextLink}
                mt={0}
                pb={2}
                color={'gray.500'}
                fontSize="md"
                href={child.href}
              >
                {renderLabel(child)}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

const MobileNav = () => (
  <Stack
    display={{ lg: 'none' }}
    p={4}
    bg={'white'}
    borderBottom={'1px solid'}
    borderBottomColor={'blackAlpha.200'}
  >
    {NAV_ITEMS.map((navItem) => (
      <MobileNavItem key={navItem.label} {...navItem} />
    ))}
  </Stack>
);

interface NavLinkProps extends LinkProps {
  href: string;
  label: string | JSX.Element;
  isActive: boolean;
  isCategory?: boolean;
}

const NavLink = ({
  href,
  label,
  isActive,
  isCategory = false,
  ...props
}: NavLinkProps) => {
  const styles = {
    color: isActive ? 'brand.slate.600' : 'brand.slate.500',
    fontWeight: isCategory ? 400 : 500,
    borderBottomColor: isActive ? 'brand.purple' : 'transparent',
    alignItems: 'center',
    display: 'flex',
    h: 'full',
    py: 2,
    fontSize: 'sm',
    borderBottom: isActive ? '1px solid' : 'none',
    _hover: {
      textDecoration: 'none',
      color: 'brand.slate.600',
    },
    ...props,
  };

  return (
    <Link as={NextLink} href={href} {...styles}>
      {typeof label === 'string' ? <Text fontSize="sm">{label}</Text> : label}
    </Link>
  );
};

const DesktopNav = () => {
  const router = useRouter();

  return (
    <Stack direction={'row'} h="full" spacing={7}>
      {NAV_ITEMS[2]?.children?.map((navItem) => {
        const isCurrent = `${navItem.href}` === router.asPath;
        return (
          <Box key={navItem.label}>
            <Popover placement={'bottom-start'} trigger={'hover'}>
              <PopoverTrigger>
                <NavLink
                  href={navItem.href ?? '#'}
                  label={renderLabel(navItem)}
                  isActive={isCurrent}
                  isCategory={true}
                />
              </PopoverTrigger>
            </Popover>
          </Box>
        );
      })}
    </Stack>
  );
};

export const Header = () => {
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();

  const isDashboardRoute = router.pathname.startsWith('/dashboard');
  const maxWValue = isDashboardRoute ? '' : '7xl';
  const isRootRoute = router.pathname === '/';

  return (
    <Box pos="sticky" zIndex="sticky" top={0}>
      <BountySnackbar />
      {isRootRoute && <AnnouncementBar />}
      <Flex
        px={{ base: '2', lg: 6 }}
        py={{ base: 2, lg: 0 }}
        color="brand.slate.500"
        bg="white"
        borderBottom="1px solid"
        borderBottomColor="blackAlpha.200"
      >
        <Flex justify={'space-between'} w="100%" maxW={maxWValue} mx="auto">
          <Flex
            flex={{ base: 1, lg: 'auto' }}
            display={{ base: 'flex', lg: 'none' }}
            ml={{ base: -2 }}
          >
            <IconButton
              _hover={{ bg: 'transparent' }}
              aria-label={'Toggle Navigation'}
              icon={
                isOpen ? (
                  <CloseIcon w={3} h={3} />
                ) : (
                  <HamburgerIcon w={5} h={5} />
                )
              }
              onClick={onToggle}
              variant={'ghost'}
            />
          </Flex>
          <Flex
            align="center"
            justify={{ base: 'center', lg: 'start' }}
            gap={6}
          >
            <Link
              as={NextLink}
              alignItems={'center'}
              gap={3}
              display={{ base: 'none', lg: 'flex' }}
              mr={5}
              _hover={{ textDecoration: 'none' }}
              href="/"
            >
              <Image
                h={5}
                cursor="pointer"
                objectFit={'contain'}
                alt={'Superteam Earn'}
                onClick={() => {
                  router.push('/');
                }}
                src={'/assets/logo/logo.svg'}
              />

              {isDashboardRoute && (
                <>
                  <Divider
                    w={'3px'}
                    h={'24px'}
                    borderColor={'brand.slate.400'}
                    orientation="vertical"
                  />
                  <Text fontSize="sm" letterSpacing={'1.5px'}>
                    SPONSORS
                  </Text>
                </>
              )}
            </Link>

            <NavLink
              display={{ base: 'none', lg: 'flex' }}
              href="/bounties"
              label="Bounties"
              isActive={router.asPath === '/bounties/'}
            />

            <NavLink
              display={{ base: 'none', lg: 'flex' }}
              href="/projects"
              label="Projects"
              isActive={router.asPath === '/projects/'}
            />
          </Flex>
          <Flex
            align="center"
            justify={'center'}
            flexGrow={1}
            display={{ base: 'none', lg: 'flex' }}
            h="full"
            ml={10}
          >
            <DesktopNav />
          </Flex>
          <Link as={NextLink} display={{ base: 'flex', lg: 'none' }} href="/">
            <Image
              h={5}
              my="auto"
              alt={'Superteam Earn'}
              src="/assets/logo/logo.svg"
            />
          </Link>

          <Stack
            align="center"
            justify={'flex-end'}
            direction={'row'}
            flex={{ base: 1, lg: 1 }}
            py={{ base: 0, lg: 2 }}
            spacing={4}
          >
            <UserInfo />
          </Stack>
        </Flex>
      </Flex>
      <Box bg="white">
        <Collapse animateOpacity in={isOpen}>
          <Flex direction="column" w="96%" mx={'auto'}>
            <UserInfo isMobile={true} />
          </Flex>
          <MobileNav />
        </Collapse>
      </Box>
    </Box>
  );
};
