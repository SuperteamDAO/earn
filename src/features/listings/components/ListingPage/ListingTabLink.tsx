import { Link } from '@chakra-ui/react';
import NextLink from 'next/link';

export const ListingTabLink = ({
  href,
  text,
  isActive,
  onClick,
}: {
  href: string;
  text: string;
  isActive: boolean;
  onClick?: () => void;
}) => {
  return (
    <Link
      className="ph-no-capture"
      as={NextLink}
      alignItems="center"
      justifyContent="center"
      display="flex"
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
    >
      {text}
    </Link>
  );
};
