import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Link,
  Text,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { TalentBio } from '@/features/talent';
import type { SubmissionWithUser } from '@/interface/submission';
import { type User as IUser } from '@/interface/user';
import { ogImageQuery } from '@/queries/og-image';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { nthLabelGenerator } from '@/utils/rank';

import { type Listing } from '../../types';

interface Props {
  bounty: Listing;
  submission?: SubmissionWithUser;
  user: IUser;
  link: string;
}
export const SubmissionPage = ({ bounty, submission, user, link }: Props) => {
  const { data: ogData } = useQuery(ogImageQuery(link));
  const router = useRouter();
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (router.asPath.endsWith('#details') && isMobile) {
      const element = document.getElementById('submission-details');
      if (element) {
        const offset = 50;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  }, [router.asPath, isMobile]);

  return (
    <VStack
      align={['center', 'center', 'start', 'start']}
      justify={['center', 'center', 'space-between', 'space-between']}
      flexDir={['column', 'column', 'row', 'row']}
      gap={{ base: 4, md: 10 }}
      w="full"
      id="submission-details"
    >
      <VStack gap={3} w={'full'} mt={3}>
        {bounty?.isWinnersAnnounced && submission?.isWinner && (
          <Box
            w="full"
            mt={4}
            py={2}
            color={'#D26F12'}
            textAlign={'center'}
            bg={'#FFE6B6'}
            rounded="md"
          >
            <Text fontWeight={700} textTransform={'uppercase'}>
              🏆 WINNER: {nthLabelGenerator(submission?.winnerPosition ?? 0)} 🏆
            </Text>
          </Box>
        )}
        <VStack
          w={'full'}
          h={{ base: 'auto', md: '40rem' }}
          bg={'white'}
          rounded={'md'}
        >
          <Flex justify={'space-between'} w={'full'} mt={5}>
            <Text color={'black'} fontSize={'22px'} fontWeight={600}>
              {user?.firstName}&apos;s Submission
            </Text>
          </Flex>
          <Image
            w={'full'}
            h={'30rem'}
            py={7}
            objectFit={'cover'}
            alt={'submission'}
            rounded={'2rem'}
            src={ogData?.images?.[0]?.url || '/assets/bg/og.svg'}
          />
          <HStack w="full">
            <Button
              as={Link}
              w="full"
              mb={6}
              _hover={{
                textDecoration: 'none',
              }}
              href={getURLSanitized(link)}
              isExternal
              variant="solid"
            >
              Visit Link
            </Button>
          </HStack>
          {isMobile && (
            <VStack mt={12}>
              <TalentBio w={'100%'} successPage={false} talentUser={user} />
            </VStack>
          )}
        </VStack>
      </VStack>
      {!isMobile && (
        <VStack w={['100%', '100%', '36rem', '36rem']}>
          <TalentBio p={0} w={'100%'} successPage={false} talentUser={user} />
        </VStack>
      )}
    </VStack>
  );
};
