import { ChevronDownIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import {
  Box,
  Collapse,
  Flex,
  IconButton,
  Image,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

import Search from './Search';
import UserInfo from './UserInfo';

interface NavItem {
  label: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'All Opportunties',
    children: [
      {
        label: 'All Opportunties',
        href: '/',
      },
      {
        label: 'Design',
        href: '/all/design',
      },
      {
        label: 'Growth',
        href: '/all/growth',
      },
      {
        label: 'Content',
        href: '/all/content',
      },
      {
        label: 'Frontend',
        href: '/all/frontend',
      },
      {
        label: 'Backend',
        href: '/all/backend',
      },
      {
        label: 'Blockchain',
        href: '/all/blockchain',
      },
    ],
  },
  {
    label: 'Bounties',
    children: [
      {
        label: 'All Bounties',
        href: '/bounties',
      },
      {
        label: 'Design',
        href: '/bounties/design',
      },
      {
        label: 'Growth',
        href: '/bounties/growth',
      },
      {
        label: 'Content',
        href: '/bounties/content',
      },
      {
        label: 'Frontend',
        href: '/bounties/frontend',
      },
      {
        label: 'Backend',
        href: '/bounties/backend',
      },
      {
        label: 'Blockchain',
        href: '/bounties/blockchain',
      },
    ],
  },
  {
    label: 'Jobs',
    children: [
      {
        label: 'All Jobs',
        href: '/jobs',
      },
      {
        label: 'Design',
        href: '/jobs/design',
      },
      {
        label: 'Growth',
        href: '/jobs/growth',
      },
      {
        label: 'Content',
        href: '/jobs/content',
      },
      {
        label: 'Frontend',
        href: '/jobs/frontend',
      },
      {
        label: 'Backend',
        href: '/jobs/backend',
      },
      {
        label: 'Blockchain',
        href: '/jobs/blockchain',
      },
    ],
  },
  {
    label: 'Grants',
    href: '/grants',
  },
];

const DesktopSubNav = ({ label, href }: NavItem) => {
  return (
    <Link
      display={'block'}
      mt={0}
      px={4}
      py={2}
      _hover={{ bg: 'brand.slate.100' }}
      href={href}
      role={'group'}
    >
      <Text
        color="slate.gray.500"
        fontSize="sm"
        _groupHover={{ color: 'brand.purple' }}
        transition={'all .3s ease'}
      >
        {label}
      </Text>
    </Link>
  );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Stack onClick={children && onToggle} spacing={4}>
      <Flex
        as={Link}
        align={'center'}
        justify={'space-between'}
        py={2}
        _hover={{
          textDecoration: 'none',
        }}
        href={href ?? '#'}
      >
        <Text color={'brand.slate.500'} fontSize="sm" fontWeight={400}>
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
          mt={2}
          pl={4}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          borderLeft={1}
        >
          {children &&
            children.map((child) => (
              <Link
                key={child.label}
                mt={0}
                py={1}
                color={'brand.slate.800'}
                fontSize="sm"
                href={child.href}
              >
                {child.label}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

const MobileNav = () => (
  <Stack
    display={{ md: 'none' }}
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

const DesktopNav = ({ pathname }: { pathname: string }) => {
  const navItems = NAV_ITEMS.map((navItem) => ({
    ...navItem,
    allPaths: navItem.children
      ? navItem.children.map((child) => child.href)
      : [],
  }));

  return (
    <Stack direction={'row'} h="full" spacing={8}>
      {navItems.map((navItem) => {
        const isCurrent =
          navItem.href === pathname || navItem.allPaths.includes(pathname);
        return (
          <Box key={navItem.label}>
            <Popover placement={'bottom-start'} trigger={'hover'}>
              <PopoverTrigger>
                <Link
                  alignItems="center"
                  display="flex"
                  h="full"
                  py={2}
                  color={isCurrent ? 'brand.slate.800' : 'brand.slate.500'}
                  fontSize={'sm'}
                  fontWeight={isCurrent ? 500 : 400}
                  borderBottom="1px solid"
                  borderBottomColor={isCurrent ? 'brand.purple' : 'transparent'}
                  _hover={{
                    textDecoration: 'none',
                    color: 'brand.slate.800',
                  }}
                  href={navItem.href ?? '#'}
                >
                  {navItem.label}{' '}
                  {navItem.children && <ChevronDownIcon ml={1} />}
                </Link>
              </PopoverTrigger>

              {navItem.children && (
                <PopoverContent
                  w={'full'}
                  minW={48}
                  bg={'white'}
                  border={'1px solid'}
                  borderColor={'blackAlpha.200'}
                  shadow={'xl'}
                  roundedBottom={'md'}
                  roundedTop={'none'}
                >
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </PopoverContent>
              )}
            </Popover>
          </Box>
        );
      })}
    </Stack>
  );
};

export default function WithSubnavigation() {
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();

  return (
    <Box pos="sticky" top={0}>
      <Flex
        align={'stretch'}
        px={{ base: 4, md: 6 }}
        py={{ base: 2, md: 0 }}
        color="brand.slate.500"
        bg="white"
        borderBottom="1px solid"
        borderBottomColor="blackAlpha.200"
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          display={{ base: 'flex', md: 'none' }}
          ml={{ base: -2 }}
        >
          <IconButton
            aria-label={'Toggle Navigation'}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            onClick={onToggle}
            variant={'ghost'}
          />
        </Flex>
        <Flex align="center" justify={{ base: 'center', md: 'start' }}>
          <Image
            h={5}
            cursor="pointer"
            objectFit={'contain'}
            alt={'Superteam Earn'}
            onClick={() => {
              router.push('/');
            }}
            src={'/assets/logo/new-logo.svg'}
          />
          <Flex
            align="center"
            display={{ base: 'none', md: 'flex' }}
            h="full"
            ml={10}
          >
            <Search />
          </Flex>

          <Flex
            align="center"
            display={{ base: 'none', md: 'flex' }}
            h="full"
            ml={10}
          >
            <DesktopNav pathname={router?.pathname} />
          </Flex>
        </Flex>

        <Stack
          align="center"
          justify={'flex-end'}
          direction={'row'}
          flex={{ base: 1, md: 1 }}
          py={{ base: 0, md: 2 }}
          spacing={4}
        >
          <UserInfo />
        </Stack>
      </Flex>

      <Collapse animateOpacity in={isOpen}>
        <MobileNav />
      </Collapse>
    </Box>
  );
}
