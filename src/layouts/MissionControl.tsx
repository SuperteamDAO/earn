import { Box, Flex, type FlexProps, Icon, Text } from '@chakra-ui/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { type ReactNode, useCallback } from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import {
  SelectSuperteam,
  type SuperteamOption,
  type TSXTYPE,
  TsxTypeIcon,
} from '@/features/mission-control';

import { Default } from './Default';
import { Meta } from './Meta';

interface NavItemProps extends FlexProps {
  type: TSXTYPE;
  children: ReactNode;
}

const NavItemContent = ({ type, isActiveLink, children, ...rest }: any) => (
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
    {type && (
      <Icon
        as={TsxTypeIcon}
        mr="4"
        fontSize="16"
        _groupHover={{
          color: 'brand.purple',
        }}
        type={type}
      />
    )}
    {children}
  </Flex>
);
const TypeNavItem = ({ type, children, ...rest }: NavItemProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentType = searchParams.get('type');
  const isActiveLink = currentType === type || (!currentType && type === 'all');
  const router = useRouter();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  return (
    <NavItemContent
      type={type}
      isActiveLink={isActiveLink}
      {...rest}
      onClick={() => {
        if (type) {
          router.push(pathname + '?' + createQueryString('type', type));
        }
      }}
    >
      {children}
    </NavItemContent>
  );
};

interface LinkItemProps {
  name: string;
  type: TSXTYPE;
}
const NavTypes: Array<LinkItemProps> = [
  {
    name: 'All Requests',
    type: 'all',
  },
  {
    name: 'Grants',
    type: 'grants',
  },
  {
    name: 'ST Earn',
    type: 'st-earn',
  },
  {
    name: 'Miscellaneous',
    type: 'miscellaneous',
  },
];

interface Props {
  children: ReactNode;
  selectedSuperteam: SuperteamOption;
  superteamList: SuperteamOption[];
}
export const MissionControl = ({
  children,
  selectedSuperteam,
  superteamList,
}: Props) => {
  const { data: session } = useSession();

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Superteam Earn | Work to Earn in Crypto"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      {/* <Header /> */}

      <Flex display={{ base: 'flex', md: 'none' }} minH="80vh" px={3}>
        <Text
          align={'center'}
          pt={20}
          color={'brand.slate.500'}
          fontSize={'xl'}
          fontWeight={500}
        >
          The Sponsor Dashboard on Earn is not optimized for mobile yet. Please
          use a desktop to check out the Sponsor Dashboard
        </Text>
      </Flex>
      <Flex justify="start" display={{ base: 'none', md: 'flex' }} minH="100vh">
        <Box
          display={{ base: 'none', md: 'block' }}
          w={{ base: 0, md: 80 }}
          minH="100vh"
          pt={10}
          bg="white"
          borderRight={'1px solid'}
          borderRightColor={'blackAlpha.200'}
        >
          {/* {session?.user?.role === 'GOD' && ( */}
          {/*   <Box px={6} pb={6}> */}
          {/*     {isHackathonRoute ? <SelectHackathon /> : <SelectSponsor />} */}
          {/*   </Box> */}
          {/* )} */}

          {session?.user?.misconRole === 'ZEUS' && (
            <Box px={6} pb={6}>
              <SelectSuperteam
                selected={selectedSuperteam}
                list={superteamList}
              />
            </Box>
          )}
          {session?.user?.misconRole && session.user.misconRole !== 'ZEUS' && (
            <Flex
              align="center"
              mx={2}
              mb={4}
              p={2}
              borderWidth={1}
              rounded="md"
            >
              <EarnAvatar
                id={selectedSuperteam?.superteam?.name}
                avatar={selectedSuperteam?.superteam?.logo}
                borderRadius="4"
              />
              <Box display={{ base: 'none', md: 'block' }} ml={2}>
                <Text color="brand.slate.800" fontSize="sm">
                  {selectedSuperteam?.superteam?.name}
                </Text>
              </Box>
            </Flex>
          )}
          {NavTypes.map((link) => (
            <TypeNavItem
              className="ph-no-capture"
              key={link.name}
              type={link.type}
            >
              {link.name}
            </TypeNavItem>
          ))}
        </Box>
        <Box w="full" px={6} py={10} bg="white">
          {children}
        </Box>
      </Flex>
    </Default>
  );
};
