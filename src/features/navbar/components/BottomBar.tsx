import { Box, Button, Flex, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { LuHome, LuNewspaper, LuSearch, LuUser } from 'react-icons/lu';

import { AuthWrapper } from '@/features/auth';
import { userStore } from '@/store/user';

interface Props {
  onSearchOpen: () => void;
}

export function BottomBar({ onSearchOpen }: Props) {
  const { userInfo } = userStore();
  const router = useRouter();

  function setColor(href: string, routerPath: string) {
    if (routerPath === href) return 'brand.purple';
    else return 'brand.slate.400';
  }

  const iconStyle = { width: '1.5rem', height: '1.5rem' };

  return (
    <Flex
      justify="space-between"
      display={{ base: 'flex', md: 'none' }}
      w="full"
      px={4}
      py={2}
      bg="white"
      borderTopWidth={1}
      borderTopColor="brand.slate.200"
    >
      <Link as={NextLink} href="/">
        <Button
          color={setColor('/', router.asPath)}
          _hover={{ bg: 'none' }}
          variant="ghost"
        >
          <LuHome style={iconStyle} />
        </Button>
      </Link>
      <Button
        color={setColor('/search', router.pathname)}
        _hover={{ bg: 'none' }}
        onClick={() => onSearchOpen()}
        variant="ghost"
      >
        <LuSearch style={iconStyle} />
      </Button>
      <Link as={NextLink} href="/feed/">
        <Button
          pos="relative"
          color={setColor('/feed/', router.asPath)}
          _hover={{ bg: 'none' }}
          variant="ghost"
        >
          <LuNewspaper style={iconStyle} />
          <Box
            pos="absolute"
            top={1}
            right={3}
            w={2.5}
            h={2.5}
            bg="red"
            rounded="full"
          />
        </Button>
      </Link>
      <AuthWrapper>
        <Link
          as={NextLink}
          _hover={{ bg: 'none' }}
          pointerEvents={userInfo ? 'auto' : 'none'}
          href={`/t/${userInfo?.username}`}
        >
          <Button
            color={setColor(`/t/${userInfo?.username}/`, router.asPath)}
            variant="ghost"
          >
            <LuUser style={iconStyle} />
          </Button>
        </Link>
      </AuthWrapper>
    </Flex>
  );
}
