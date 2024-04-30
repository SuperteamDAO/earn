import { Box } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';

import { PowCard, SubmissionCard } from '@/features/feed';
import { type PoW } from '@/interface/pow';
import { type SubmissionWithUser } from '@/interface/submission';
import { type User } from '@/interface/user';
import { Home } from '@/layouts/Home';

type PowWithUser = PoW & {
  user?: User;
};

interface FeedData {
  Submission: SubmissionWithUser[];
  PoW: PowWithUser[];
}

export default function Feed() {
  const [data, setData] = useState<FeedData>();
  // const [isloading, setIsloading] = useState<boolean>(true);
  useEffect(() => {
    const fetch = async () => {
      try {
        // setIsloading(true);
        const res = await axios.get(`/api/feed/get`);

        if (res) {
          setData(res?.data);
          // setIsloading(false);
        }
      } catch (err) {
        console.log(err);
        // setIsloading(false);
      }
    };
    fetch();
  }, []);

  const filteredFeed = useMemo(() => {
    const submissions = data?.Submission ?? [];
    const pows = data?.PoW ?? [];
    const typedSubmissions = submissions.map((s) => ({
      ...s,
      type: 'submission',
    }));
    const typedPows = pows.map((p) => ({ ...p, type: 'pow' }));

    return [...typedSubmissions, ...typedPows].sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();

      return dateB - dateA;
    });
  }, [data]);

  return (
    <Home type="home">
      <Box>
        {filteredFeed.map((item, index) => {
          if (item.type === 'submission') {
            return (
              <SubmissionCard
                key={index}
                sub={item as SubmissionWithUser}
                type="activity"
              />
            );
          }
          if (item.type === 'pow') {
            return (
              <PowCard key={index} pow={item as PowWithUser} type="activity" />
            );
          }
          return null;
        })}
      </Box>
    </Home>
  );
}
