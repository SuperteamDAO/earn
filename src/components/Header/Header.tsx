import { ChevronDownIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
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
  {
    label: 'All Opportunities',
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
      {
        label: 'HYPERDRIVE',
        href: '/all/Hyperdrive/',
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
    display={{ md: 'none' }}
    p={4}
    bg={'white'}
    borderBottom={'1px solid'}
    borderBottomColor={'blackAlpha.200'}
  >
    {NAV_ITEMS.map((navItem) => (
      <MobileNavItem key={navItem.label} {...navItem} />
    ))}
    {/* <UserInfo /> */}
  </Stack>
);

const DesktopNav = () => {
  const router = useRouter();

  return (
    <Stack direction={'row'} h="full" spacing={8}>
      {NAV_ITEMS[0]?.children?.map((navItem) => {
        const isCurrent = `${navItem.href}` === router.asPath;
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
                  {navItem.label === 'HYPERDRIVE' ? (
                    <Image
                      alt="Hyperdrive Hackathon"
                      src="/assets/category_assets/icon/Hyperdrive.svg"
                    />
                  ) : (
                    navItem.label
                  )}
                </Link>
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
        px={{ base: 4, md: 6 }}
        py={{ base: 2, md: 0 }}
        color="brand.slate.500"
        bg="white"
        borderBottom="1px solid"
        borderBottomColor="blackAlpha.200"
      >
        <Flex justify={'space-between'} w="100%" maxW="7xl" mx="auto">
          <Flex
            flex={{ base: 1, md: 'auto' }}
            display={{ base: 'flex', md: 'none' }}
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
            justify={{ base: 'center', md: 'start' }}
            gap={4}
          >
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
            <Text>Bounties</Text>
            <Text>Projects</Text>
          </Flex>
          <Flex
            align="center"
            justify={'center'}
            flexGrow={1}
            display={{ base: 'none', md: 'flex' }}
            h="full"
            ml={10}
          >
            <DesktopNav />
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
