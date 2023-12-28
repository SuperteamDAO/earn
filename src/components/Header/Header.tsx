import { ChevronDownIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import type { LinkProps } from '@chakra-ui/react';
import {
  Box,
  Collapse,
  Flex,
  IconButton,
  Image,
  Link,
  Popover,
  PopoverTrigger,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

import { BountySnackbar } from './BountySnackbar';
import UserInfo from './UserInfo';

interface NavItem {
  label: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  { label: 'Bounties', href: '/bounties' },
  { label: 'Projects', href: '/projects' },
  {
    label: 'Browse Categories',
    children: [
      {
        label: 'Content',
        href: '/all/Content/',
      },
      {
        label: 'Design',
        href: '/all/Design/',
      },
      {
        label: 'Development',
        href: '/all/Development/',
      },
      // {
      //   label: 'HYPERDRIVE',
      //   href: '/all/Hyperdrive/',
      // },
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
                mt={0}
                pb={2}
                color={'gray.500'}
                fontSize="md"
                href={child.href}
              >
                {child.label === 'HYPERDRIVE' ? (
                  <Image
                    w={100}
                    alt="Hyperdrive Hackathon"
                    src="/assets/category_assets/icon/Hyperdrive.svg"
                  />
                ) : (
                  child.label
                )}
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
    <Link href={href} {...styles}>
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
                  label={
                    navItem.label === 'HYPERDRIVE' ? (
                      <Image
                        alt="Hyperdrive Hackathon"
                        src="/assets/category_assets/icon/Hyperdrive.svg"
                      />
                    ) : (
                      navItem.label
                    )
                  }
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

export default function WithSubnavigation() {
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();

  return (
    <Box pos="sticky" zIndex="sticky" top={0}>
      <BountySnackbar />
      <Flex
        px={{ base: 4, lg: 6 }}
        py={{ base: 2, lg: 0 }}
        color="brand.slate.500"
        bg="white"
        borderBottom="1px solid"
        borderBottomColor="blackAlpha.200"
      >
        <Flex justify={'space-between'} w="100%" maxW="7xl" mx="auto">
          <Flex
            flex={{ base: 1, lg: 'auto' }}
            display={{ base: 'flex', lg: 'none' }}
            ml={{ base: -2 }}
          >
            <IconButton
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
            <Link display={{ base: 'none', lg: 'flex' }} href="/">
              <Image
                h={5}
                mr={5}
                cursor="pointer"
                objectFit={'contain'}
                alt={'Superteam Earn'}
                onClick={() => {
                  router.push('/');
                }}
                src={'/assets/logo/new-logo.svg'}
              />
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
          <Flex direction="column" w="96%" mt={5} mx={'auto'}>
            <UserInfo isMobile={true} />
          </Flex>
          <MobileNav />
        </Collapse>
      </Box>
    </Box>
  );
}
