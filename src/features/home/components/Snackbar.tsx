import { Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const Snackbar = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  const disallowPages = [
    '/bounties',
    '/dashboard',
    '/listings',
    '/new',
    '/sponsor',
    '/templates',
    '/t',
  ];
  const router = useRouter();

  if (disallowPages.filter((d) => router.asPath.startsWith(d)).length > 0)
    return null;
  return (
    <Link
      as={NextLink}
      display={{ base: 'block', md: 'none' }}
      w="full"
      color="white"
      _hover={{ textDecor: 'none' }}
      _active={{ textDecor: 'none' }}
      bgColor={'#6366F1'}
      href={href}
      textDecor={'none'}
    >
      <Text
        p={2}
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight={500}
        textAlign="center"
      >
        {children}
      </Text>
    </Link>
  );
};
