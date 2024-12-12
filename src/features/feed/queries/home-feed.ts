import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface HomeFeed {
  createdAt: string;
  isWinner: boolean;
  listing: {
    type: string;
    isWinnersAnnounced: boolean;
  };
  user: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

const fetchHomeFeed = async (): Promise<HomeFeed[]> => {
  const { data } = await axios.get('/api/feed/home');
  return data;
};

export const homeFeedQuery = queryOptions({
  queryKey: ['home-feed'],
  queryFn: fetchHomeFeed,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
