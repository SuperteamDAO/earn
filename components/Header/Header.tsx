import {
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  HamburgerIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Collapse,
  Flex,
  Icon,
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
import router from 'next/router';

import UserInfo from './UserInfo';

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Inspiration',
    children: [
      {
        label: 'Explore Design Work',
        subLabel: 'Trending Design to inspire you',
        href: '#',
      },
      {
        label: 'New & Noteworthy',
        subLabel: 'Up-and-coming Designers',
        href: '#',
      },
    ],
  },
  {
    label: 'Find Work',
    children: [
      {
        label: 'Job Board',
        subLabel: 'Find your dream design job',
        href: '#',
      },
      {
        label: 'Freelance Projects',
        subLabel: 'An exclusive list for contract work',
        href: '#',
      },
    ],
  },
  {
    label: 'Learn Design',
    href: '#',
  },
  {
    label: 'Hire Designers',
    href: '#',
  },
];

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Link
      display={'block'}
      p={2}
      _hover={{ bg: useColorModeValue('pink.50', 'gray.900') }}
      href={href}
      role={'group'}
      rounded={'md'}
    >
      <Stack align={'center'} direction={'row'}>
        <Box>
          <Text
            fontWeight={500}
            _groupHover={{ color: 'pink.400' }}
            transition={'all .3s ease'}
          >
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          align={'center'}
          justify={'flex-end'}
          flex={1}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          transform={'translateX(-10px)'}
          transition={'all .3s ease'}
        >
          <Icon as={ChevronRightIcon} w={5} h={5} color={'pink.400'} />
        </Flex>
      </Stack>
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
        <Text
          color={useColorModeValue('gray.600', 'gray.200')}
          fontWeight={600}
        >
          {label}
        </Text>
        {children && (
          <Icon
            as={ChevronDownIcon}
            w={6}
            h={6}
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
              <Link key={child.label} py={2} href={child.href}>
                {child.label}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

const MobileNav = () => {
  return (
    <Stack
      display={{ md: 'none' }}
      p={4}
      bg={useColorModeValue('white', 'gray.800')}
    >
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover placement={'bottom-start'} trigger={'hover'}>
            <PopoverTrigger>
              <Link
                p={2}
                color={linkColor}
                fontSize={'sm'}
                fontWeight={500}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
                href={navItem.href ?? '#'}
              >
                {navItem.label}
              </Link>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                minW={'sm'}
                p={4}
                bg={popoverContentBgColor}
                border={0}
                shadow={'xl'}
                rounded={'xl'}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

export default function WithSubnavigation() {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box>
      <Flex
        align={'center'}
        px={{ base: 6 }}
        py={{ base: 2 }}
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
        <Flex
          align="center"
          justify={{ base: 'center', md: 'start' }}
          flex={{ base: 1 }}
        >
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

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav />
          </Flex>
        </Flex>

        <Stack
          align="center"
          justify={'flex-end'}
          direction={'row'}
          flex={{ base: 1, md: 1 }}
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
