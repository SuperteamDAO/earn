import { Link, type LinkProps, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

interface NavLinkProps extends LinkProps {
  href: string;
  label: string | JSX.Element;
  isActive: boolean;
}

export const NavLink = ({ href, label, isActive, ...props }: NavLinkProps) => {
  const styles = {
    color: isActive ? 'brand.slate.600' : 'brand.slate.500',
    fontWeight: 500,
    alignItems: 'center',
    display: 'flex',
    h: { base: '8', lg: 14 },
    py: 2,
    borderBottom: { base: 'none', lg: isActive ? '1px solid' : 'none' },
    borderBottomColor: isActive ? 'brand.purple' : 'transparent',
    _hover: {
      textDecoration: 'none',
      color: 'brand.slate.600',
    },
    fontSize: { base: 'lg', lg: 'sm' },
    ...props,
  };

  return (
    <Link as={NextLink} href={href} {...styles}>
      <Text>{label}</Text>
    </Link>
  );
};
