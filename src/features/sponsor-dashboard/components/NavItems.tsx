import { Flex, type FlexProps, Icon, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';

interface NavItemProps extends FlexProps {
  icon: IconType;
  link?: string;
  children: ReactNode;
  isExpanded: boolean;
}

export const NavItem = ({
  icon,
  link,
  children,
  isExpanded,
  ...rest
}: NavItemProps) => {
  const router = useRouter();
  const currentPath = router.asPath.split('?')[0];
  const isExternalLink = link?.startsWith('https://');
  const resolvedLink = isExternalLink ? link : `/dashboard${link}`;
  const isActiveLink = resolvedLink
    ? currentPath?.startsWith(resolvedLink)
    : false;

  return (
    <Link
      as={NextLink}
      _focus={{ boxShadow: 'none' }}
      href={resolvedLink}
      isExternal={isExternalLink}
      style={{ textDecoration: 'none' }}
    >
      <NavItemContent
        icon={icon}
        isActiveLink={isActiveLink}
        isExpanded={isExpanded}
        {...rest}
      >
        {children}
      </NavItemContent>
    </Link>
  );
};

const NavItemContent = ({
  icon,
  isActiveLink,
  isExpanded,
  children,
  ...rest
}: any) => (
  <Flex
    align="center"
    mr={isExpanded ? '0' : '1rem'}
    px={6}
    py={3}
    color={isActiveLink ? '#3730A3' : 'brand.slate.500'}
    bg={isActiveLink ? '#EEF2FF' : 'transparent'}
    _hover={{
      bg: '#F5F8FF',
      color: 'brand.purple',
    }}
    cursor="pointer"
    role="group"
    {...rest}
  >
    {icon && (
      <Icon
        as={icon}
        mr={isExpanded ? '4' : '0'}
        fontSize={isExpanded ? '16' : '20'}
        _groupHover={{
          color: 'brand.purple',
        }}
        transition="all 0.3s ease-in-out"
      />
    )}
    <Text
      className="nav-item-text"
      pos={isExpanded ? 'static' : 'absolute'}
      ml={isExpanded ? 0 : '-9999px'}
      opacity={isExpanded ? 1 : 0}
      transition="opacity 0.2s ease-in-out"
    >
      {children}
    </Text>
  </Flex>
);
