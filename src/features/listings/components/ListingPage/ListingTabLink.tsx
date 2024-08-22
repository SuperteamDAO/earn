import { type ChakraProps, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

export const ListingTabLink = ({
  href,
  text,
  isActive,
  onClick,
  w,
  styles,
  subText,
}: {
  href: string;
  text: string;
  isActive: boolean;
  subText?: string;
  onClick?: () => void;
  w?: ChakraProps['w'];
  styles?: ChakraProps;
}) => {
  return (
    <Link
      className="ph-no-capture"
      as={NextLink}
      alignItems="center"
      display="flex"
      w={w}
      h={'full'}
      color="brand.slate.500"
      fontSize={{ base: 'xs', md: 'sm' }}
      fontWeight={500}
      textDecoration="none"
      borderBottom="2px solid"
      borderBottomColor={isActive ? 'brand.purple' : 'transparent'}
      _hover={{
        textDecoration: 'none',
        borderBottom: '2px solid',
        borderBottomColor: 'brand.purple',
      }}
      href={href}
      onClick={onClick}
      {...styles}
      gap={2}
    >
      {text}
      {subText && (
        <Text color="brand.slate.400" fontSize={{ base: 'x-small', md: 'xs' }}>
          {subText}
        </Text>
      )}
    </Link>
  );
};
