import { Flex, type FlexProps, Icon, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';

interface NavItemProps extends FlexProps {
  icon: IconType;
  link?: string;
  children: ReactNode;
}

export const NavItem = ({ icon, link, children, ...rest }: NavItemProps) => {
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
      <NavItemContent icon={icon} isActiveLink={isActiveLink} {...rest}>
        {children}
      </NavItemContent>
    </Link>
  );
};

const NavItemContent = ({ icon, isActiveLink, children, ...rest }: any) => (
  <Flex
    align="center"
    px={6}
    py={3}
    color={isActiveLink ? 'brand.purple' : 'brand.slate.500'}
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
        mr="4"
        fontSize="16"
        _groupHover={{
          color: 'brand.purple',
        }}
      />
    )}
    {children}
  </Flex>
);
