import { Divider, Flex, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';

import Medal from '@/public/assets/leaderboard/medal.webp';

import Progress from '../icons/progress.svg';
import Rank from '../icons/rank.svg';
import Semistar from '../icons/semistart.svg';

export function Introduction() {
  const { t } = useTranslation('common');

  return (
    <VStack
      align="start"
      gap={4}
      w="full"
      p={6}
      fontSize={'sm'}
      bg="#FAF5FF"
      rounded={12}
    >
      <VStack align="start">
        <Image
          alt={t('leaderboard.introduction.medalAlt')}
          src={Medal}
          height={26}
          width={26}
        />
        <Text fontWeight={600}>{t('leaderboard.introduction.title')}</Text>
        <Text color="brand.slate.600">
          {t('leaderboard.introduction.description')}
        </Text>
      </VStack>
      <Divider />
      <VStack align="start">
        <Flex gap={2}>
          <Image
            width={20}
            src={Progress}
            alt={t('leaderboard.introduction.progressIconAlt')}
          />
          <Text color="brand.slate.600">
            {t('leaderboard.introduction.trackProgress')}
          </Text>
        </Flex>
        <Flex gap={2}>
          <Image
            width={20}
            src={Rank}
            alt={t('leaderboard.introduction.rankIconAlt')}
            style={{ paddingRight: '0.4rem' }}
          />
          <Text color="brand.slate.600">
            {t('leaderboard.introduction.discoverProfiles')}
          </Text>
        </Flex>
        <Flex gap={2}>
          <Image
            width={20}
            src={Semistar}
            alt={t('leaderboard.introduction.semistarIconAlt')}
            style={{ paddingRight: '0.6rem' }}
          />
          <Text color="brand.slate.600">
            {t('leaderboard.introduction.improveSkills')}
          </Text>
        </Flex>
      </VStack>
    </VStack>
  );
}
