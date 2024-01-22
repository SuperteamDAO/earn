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
import type { User } from '@prisma/client';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import type { Metadata } from 'unfurl.js/dist/types';

import { TalentBio } from '@/components/TalentBio';
import type { Bounty } from '@/interface/bounty';
import type { SubmissionWithUser } from '@/interface/submission';
import { getURLSanitized } from '@/utils/submissions/getURLSanitized';

import { Comments } from '../comments';

interface Props {
  bounty: Bounty;
  submission?: SubmissionWithUser;
  user: User;
  link: string;
}
export const SubmissionPage = ({ bounty, submission, user, link }: Props) => {
  const router = useRouter();
  const [image, setImage] = useState<string>('/assets/bg/og.svg');
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchImage = async () => {
      if (link) {
        try {
          const { data } = (await axios.post('/api/og', {
            url: link,
          })) as { data: Metadata };
          setImage(data.open_graph.images![0]?.url ?? '/assets/bg/og.svg');
        } catch (error) {
          console.log(error);
          setImage('/assets/bg/og.svg');
        }
      }
    };
    fetchImage();
  }, []);
  return (
    <VStack
      align={['center', 'center', 'start', 'start']}
      justify={['center', 'center', 'space-between', 'space-between']}
      flexDir={['column', 'column', 'row', 'row']}
      gap={4}
      w="full"
      maxW={'7xl'}
      mx={'auto'}
    >
      <VStack gap={3} w={'full'} mt={3}>
        {bounty?.isWinnersAnnounced && submission?.isWinner && (
          <Box
            w="full"
            mt={4}
            px={4}
            py={2}
            color={'#D26F12'}
            textAlign={'center'}
            bg={'#FFE6B6'}
            rounded="md"
          >
            <Text fontWeight={700} textTransform={'uppercase'}>
              🏆 WINNER: {submission?.winnerPosition} 🏆
            </Text>
          </Box>
        )}
        <VStack
          w={'full'}
          h={{ base: 'auto', md: '40rem' }}
          bg={'white'}
          rounded={'md'}
        >
          <Flex justify={'space-between'} w={'full'} mt={5} px={8}>
            <Text color={'black'} fontSize={'22px'} fontWeight={600}>
              {user?.firstName}&apos;s Submission
            </Text>
          </Flex>
          <Image
            w={'full'}
            h={'30rem'}
            p={7}
            objectFit={'cover'}
            alt={'submission'}
            rounded={'2rem'}
            src={image}
          />
          <HStack w="full" px={7}>
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
            <VStack w={'30rem'} mt={12}>
              <TalentBio successPage={false} user={user} />
            </VStack>
          )}
        </VStack>

        <Comments
          refId={(router.query.subid as string) ?? ''}
          refType="BOUNTY"
        />
      </VStack>
      {!isMobile && (
        <VStack w={['100%', '100%', '36rem', '36rem']}>
          <TalentBio successPage={false} user={user} />
        </VStack>
      )}
    </VStack>
  );
};
