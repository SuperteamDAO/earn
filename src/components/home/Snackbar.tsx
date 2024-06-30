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
    <Link as={NextLink} w="full" color="white" bgColor={'#6366F1'} href={href}>
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
