import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { OgImageViewer } from '@/components/shared/ogImageViewer';
import { type FeedPostType, useGetFeed } from '@/features/feed';
import { timeAgoShort } from '@/utils/timeAgo';

interface ActivityCardProps {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
  link: string;
  listingType: 'bounty' | 'hackathon' | 'project';
  isWinner: boolean;
  isWinnersAnnounced: boolean;
  type: FeedPostType;
  ogImage: string;
}

const ActivityCard = ({
  id,
  firstName,
  lastName,
  username,
  createdAt,
  link,
  listingType,
  isWinner,
  isWinnersAnnounced,
  type,
  ogImage,
}: ActivityCardProps) => {
  const getActionText = () => {
    const defaultActionText = {
      bounty: '刚刚提交了任务',
      hackathon: '刚刚参加了黑客马拉松',
      project: '刚刚申请了一个项目',
    };

    const winnerActionText = {
      bounty: '刚刚赢得了赏金',
      hackathon: '刚刚赢得了黑客马拉松',
      project: '刚被选中参加一个项目',
    };

    if (type === 'pow') {
      return '刚刚添加了一个 个人项目';
    } else if (isWinner && isWinnersAnnounced) {
      return winnerActionText[listingType] || '刚刚大功告成';
    } else {
      return defaultActionText[listingType] || '刚刚出手';
    }
  };

  const actionText = getActionText();

  return (
    <Flex
      as={NextLink}
      href={!!id ? `/feed/?type=${type}&id=${id}` : '/feed/?filter=new'}
    >
      <OgImageViewer
        h={12}
        w={20}
        objectFit={'cover'}
        externalUrl={link}
        imageUrl={ogImage}
      />
      <Box ml={3}>
        <Flex align={'center'}>
          <Text
            overflow={'hidden'}
            maxW={32}
            mr={1.5}
            color={'brand.slate.800'}
            fontSize={'0.9rem'}
            fontWeight={600}
            whiteSpace={'nowrap'}
            textOverflow={'ellipsis'}
          >
            {firstName} {lastName}
          </Text>
          <Text
            overflow={'hidden'}
            maxW={'5.7rem'}
            color={'brand.slate.400'}
            fontSize={'sm'}
            fontWeight={500}
            whiteSpace={'nowrap'}
            textOverflow={'ellipsis'}
          >
            @{username}
          </Text>
          <Text mx={1} color="brand.slate.400" fontSize={'xs'}>
            •
          </Text>
          <Text color={'brand.slate.400'} fontSize={'xs'}>
            {timeAgoShort(createdAt)}
          </Text>
        </Flex>
        <Text color={'brand.slate.600'} fontSize={'sm'} fontWeight={500}>
          {actionText}
        </Text>
      </Box>
    </Flex>
  );
};

export const RecentActivity = () => {
  const posthog = usePostHog();

  const { data } = useGetFeed({ take: 5 });

  const activity = data?.pages[0] ?? [];

  return (
    <Box>
      <Flex align="center" justify={'space-between'}>
        <Text color={'gray.400'} fontSize={'sm'} fontWeight={500}>
          最近活动
        </Text>
        <Text
          className="ph-no-capture"
          as={NextLink}
          color="brand.purple"
          fontSize="xs"
          fontWeight={600}
          href="/feed"
          onClick={() => {
            posthog.capture('recent winners_view all_homepage');
          }}
        >
          查看全部
          <ArrowForwardIcon ml={1} />
        </Text>
      </Flex>
      <Flex direction={'column'} rowGap={'1rem'} w={'full'} mt={4}>
        {activity.map((act, i) => {
          return (
            <ActivityCard
              key={i}
              id={act.id}
              link={act.link}
              firstName={act.firstName}
              lastName={act.lastName}
              username={act.username}
              createdAt={act.createdAt}
              listingType={act.listingType}
              isWinner={act.isWinner}
              isWinnersAnnounced={act.isWinnersAnnounced}
              type={act.type}
              ogImage={act.ogImage}
            />
          );
        })}
      </Flex>
    </Box>
  );
};
