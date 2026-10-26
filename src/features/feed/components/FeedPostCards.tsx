'use client';

import { useMounted } from '../hooks/use-mounted';
import type { FeedDataProps } from '../types';
import { FeedCardContainerSkeleton } from './FeedCardContainer';
import { GrantCard } from './grantCard';
import { PowCard } from './powCard';
import { SubmissionCard } from './submissionCard';

// A post's cards, after Earn's skeleton (they render on the client, as
// Earn's did).
export function FeedPostCards({ data }: { data: FeedDataProps[] }) {
  const mounted = useMounted();
  if (!mounted) return <FeedCardContainerSkeleton />;
  return (
    <>
      {data.map((item, index) => {
        switch (item.type) {
          case 'submission':
            return <SubmissionCard key={index} sub={item} type="activity" />;
          case 'pow':
            return <PowCard key={index} pow={item} type="activity" />;
          case 'grant-application':
            return <GrantCard type="activity" grant={item} key={index} />;
          default:
            return null;
        }
      })}
    </>
  );
}
