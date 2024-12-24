import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupList,
  AvatarImage,
} from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { type Superteam, Superteams } from '@/constants/Superteam';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { roundToNearestThousand } from '@/utils/number';

import { totalsQuery } from '@/features/home/queries/totals';
import { userCountQuery } from '@/features/home/queries/user-count';
import { liveOpportunitiesQuery } from '@/features/listings/queries/live-opportunities';

const dummyUsers = [
  { name: 'Kash Dhanda', pfp: ASSET_URL + '/pfps/t1.webp' },
  { name: 'Neil Shroff', pfp: ASSET_URL + '/pfps/md2.webp' },
  { name: 'Pratik Dholani', pfp: ASSET_URL + '/pfps/fff1.webp' },
];

export const TalentImageCard = () => {
  const [st, setST] = useState<Superteam>();
  const people = useMemo(
    () => [...(st?.people || []), ...dummyUsers].slice(0, 3),
    [st?.people],
  );

  const { data: liveOpportunities } = useQuery({
    ...liveOpportunitiesQuery,
  });

  const { data: totals } = useQuery({
    ...totalsQuery,
  });

  const { data: stat } = useQuery({
    ...userCountQuery,
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await axios.get('https://ipapi.co/json/');
        const locationData = response.data;

        if (locationData && locationData.country_code) {
          const superteam = Superteams.find(
            (ct) =>
              ct.code.toLowerCase() === locationData.country_code.toLowerCase(),
          );

          if (superteam) {
            setST(superteam);
          }
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      }
    };
    fetchLocation();
  }, []);

  return (
    <div className="relative h-full w-full">
      <ExternalImage
        alt="Talent Cover"
        src="onboarding/talent-cover"
        className="h-full w-full object-cover"
      />
      <div className="absolute left-2/4 top-2/4 w-[25rem] -translate-x-2/4 -translate-y-2/4">
        <Card className="rounded-xl">
          <CardContent className="grid grid-cols-3 items-center gap-x-4 gap-y-4 py-8">
            <div>
              <AvatarGroup className="-space-x-2">
                <AvatarGroupList>
                  {people.map((p) => (
                    <Avatar key={p.name} className="h-9 w-9">
                      <AvatarImage src={p.pfp} />
                      <AvatarFallback>
                        {p.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroupList>
              </AvatarGroup>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-500">
                <span className="capitalize">
                  {people[0]?.name}, {people[1]?.name.split(' ')[0]},{' '}
                  {people[2]?.name.split(' ')[0]}
                </span>{' '}
                &{' '}
                {stat?.totalUsers ? (
                  stat?.totalUsers?.toLocaleString('en-us')
                ) : (
                  <Skeleton className="h-4 w-12" />
                )}{' '}
                others have signed up
              </p>
            </div>
            <div className="flex items-center gap-1">
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="min-h-7 min-w-7"
              >
                <g clip-path="url(#clip0_36_12)">
                  <path
                    d="M17.1111 19.5556L17.1111 2.44445C17.1111 2.1203 16.9823 1.80942 16.7531 1.58021C16.5239 1.351 16.213 1.22223 15.8889 1.22223L6.11108 1.22223C5.78693 1.22223 5.47606 1.351 5.24684 1.58021C5.01763 1.80942 4.88886 2.1203 4.88886 2.44445L4.88886 19.5556C4.88886 19.8797 5.01763 20.1906 5.24684 20.4198C5.47605 20.649 5.78693 20.7778 6.11108 20.7778L15.8889 20.7778C16.213 20.7778 16.5239 20.649 16.7531 20.4198C16.9823 20.1906 17.1111 19.8797 17.1111 19.5556ZM6.11108 2.44445L9.07497 2.44445C9.01873 3.20839 8.68738 3.92602 8.14237 4.46429C7.59737 5.00256 6.87566 5.32494 6.11108 5.37167L6.11108 2.44445ZM12.925 2.44445L15.8889 2.44445L15.8889 5.37167C15.1243 5.32494 14.4026 5.00256 13.8576 4.46429C13.3126 3.92602 12.9812 3.20839 12.925 2.44445ZM6.63053 11C6.63053 8.87945 8.5922 7.15001 11 7.15001C13.4078 7.15001 15.3694 8.87945 15.3694 11C15.3694 13.1206 13.4078 14.85 11 14.85C8.59219 14.85 6.63053 13.1206 6.63053 11ZM6.11108 19.5556L6.11108 16.6528C6.87179 16.6988 7.59035 17.0177 8.13482 17.551C8.67928 18.0842 9.0131 18.796 9.07497 19.5556L6.11108 19.5556ZM12.925 19.5556C12.9868 18.796 13.3207 18.0842 13.8651 17.551C14.4096 17.0177 15.1282 16.6988 15.8889 16.6528L15.8889 19.5556L12.925 19.5556Z"
                    fill="#10B981"
                  />
                  <path
                    d="M8.11563 11C8.11563 12.35 9.40704 13.4444 11.0001 13.4444C12.5931 13.4444 13.8845 12.35 13.8845 11C13.8845 9.64996 12.5931 8.55554 11.0001 8.55554C9.40704 8.55554 8.11563 9.64996 8.11563 11Z"
                    fill="#10B981"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_36_12">
                    <rect
                      width="22"
                      height="22"
                      fill="white"
                      transform="translate(22) rotate(90)"
                    />
                  </clipPath>
                </defs>
              </svg>
              <p className="text-2xl font-semibold">
                $
                {formatNumberWithSuffix(
                  roundToNearestThousand(totals?.totalInUSD || 0),
                )}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-500">
                has been earned by freelancers like you on Superteam Earn
              </p>
            </div>
            <div className="flex items-center gap-3 pl-3">
              <span className="h-[0.625rem] w-[0.625rem] rounded-full bg-[#10B981]" />
              <p className="text-2xl font-semibold">
                $
                {formatNumberWithSuffix(
                  roundToNearestThousand(liveOpportunities?.totalUsdValue || 0),
                )}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-500">
                Worth of opportunities are live, waiting for you to participate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
