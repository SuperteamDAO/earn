import { Box, Flex, Icon, Select, Text } from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { type } from 'os';
import React from 'react';
import { SponsorType } from '../../interface/sponsor';
import { SponsorStore } from '../../store/sponsor';
interface Props {
  sponsors: SponsorType[];
}

type NavOption =
  {
    title: string,
    href: string,
    icon: string
  }


const navOptions: NavOption[] = [
  { title: "Team Member", href: "/dashboard/team", icon: "/assets/icons/nav/blue-person.svg" },
  { title: "My Listings", href: "/dashboard/listings", icon: "/assets/icons/nav/fire.svg" },
  { title: "My Drafts", href: "/dashboard/drafts", icon: "/assets/icons/nav/frontend.svg" }
]

export const DashboardSidbar = ({ sponsors }: Props) => {
  const router = useRouter();

  const { setCurrentSponsor } = SponsorStore();
  return (
    <>
      <Flex
        position={'fixed'}
        left={0}
        bg="white"
        fontFamily="Inter"
        h="100%"
        w={'17rem'}
        mt={10}
        flexDirection={'column'}
        gap={4}
        pt={5}
        borderRight={{
          lg: '1px solid #F1F5F9',
        }}
      >
        <Box px={5}>
          <Select
            onChange={(e) => {
              setCurrentSponsor(sponsors[Number(e.currentTarget.value)]);
            }}
          >
            {sponsors?.map((sponsor, index) => {
              return (
                <option key={sponsor.id} value={index}>
                  {sponsor.name}
                </option>
              );
            })}
          </Select>
        </Box>
        {
          navOptions.map((ele, idx) => {
            return (
              <NavItem title={ele.title} href={ele.href} icon={ele.icon} key={"o" + idx} />
            )
          })
        }

      </Flex>
    </>
  );

  function NavItem({ title, href, icon }: NavOption) {
    return <Flex
      cursor="pointer"
      bg={router.asPath == href ? 'rgba(98, 255, 217, 0.09)' : ''}
      w="100%"
      height="2.5rem"
      transition="100ms"
      className="sidebar_link"
      _hover={{
        bg: 'rgba(98, 255, 217, 0.09)'
      }}
    >
      <Link href={href}>
        <Flex align="center" justify="space-evenly" w="100%">
          <Flex align="center" gap="1rem" mx="2rem" w="100%">
            <Flex
              filter={router.asPath != href
                ? 'grayscale(100%) brightness(150%)'
                : ''}
            >
              <Box
                w={{
                  sm: '10px',
                  xl: '25px',
                }}
                h={{
                  sm: '10px',
                  xl: '25px',
                }}
              >
                <Image
                  src={icon}
                  alt="Sidebar icon"
                  width="100%"
                  height="100%"
                  className="img" />
              </Box>
            </Flex>
            <Text
              fontSize={{
                sm: '1.4rem',
                md: '1rem',
              }}
              color={'gray.700'}
              fontWeight={500}
            >
              {title}
            </Text>
          </Flex>
        </Flex>
      </Link>
    </Flex >;
  }
};
