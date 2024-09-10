import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Scouts } from '@/interface/scouts';

const fetchScouts = async (bountyId: string) => {
  const response = await axios.get<Scouts[]>(`/api/listings/scout/${bountyId}`);
  return response.data;
};

export const scoutsQuery = ({ bountyId }: { bountyId: string }) =>
  queryOptions({
    queryKey: ['scouts', bountyId],
    queryFn: () => fetchScouts(bountyId as string),
    select: (data) =>
      data.map((scout) => ({
        id: scout.id,
        userId: scout.userId,
        skills: [...new Set(scout.skills)],
        dollarsEarned: scout.dollarsEarned,
        score: scout.score,
        recommended: scout.user.stRecommended ?? false,
        invited: scout.invited,
        pfp: scout.user.photo ?? null,
        name: (scout.user.firstName ?? '') + ' ' + (scout.user.lastName ?? ''),
        username: scout.user.username ?? null,
      })),
  });
