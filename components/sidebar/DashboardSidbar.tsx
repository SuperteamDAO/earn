import { Box, Flex, Select, Text } from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { SponsorType } from '../../interface/sponsor';
import { SponsorStore } from '../../store/sponsor';
interface Props {
  sponsors: SponsorType[];
}
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
        <Flex
          cursor="pointer"
          bg={'rgba(98, 255, 217, 0.09)'}
          w="100%"
          height="2.5rem"
          transition="100ms"
          className="sidebar_link"
        >
          <Link href={''}>
            <Flex align="center" justify="space-evenly" w="100%">
              <Flex align="center" gap="1rem" mx="2rem" w="100%">
                <Flex
                  filter={
                    router.asPath != ''
                      ? 'grayscale(100%) brightness(150%)'
                      : ''
                  }
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
                      src={'/assets/icons/blue-person.svg'}
                      alt="Sidebar icon"
                      width="100%"
                      height="100%"
                      className="img"
                    />
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
                  Team Member
                </Text>
              </Flex>
            </Flex>
          </Link>
        </Flex>
      </Flex>
    </>
  );
};
