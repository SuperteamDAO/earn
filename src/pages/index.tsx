import { Regions } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import { FeatureModal } from '@/components/modals/FeatureModal';
import { CombinedRegions } from '@/constants/Superteam';
import { Home } from '@/layouts/Home';
import { prisma } from '@/prisma';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { homepageGrantsQuery } from '@/features/home/queries/grants';
import { ListingSection } from '@/features/listings/components/ListingSection';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { getParentRegions } from '@/features/listings/utils/region';

interface Props {
  isAuth: boolean;
  userGrantsRegion: string[] | null;
}

const InstallPWAModal = dynamic(
  () =>
    import('@/components/modals/InstallPWAModal').then(
      (mod) => mod.InstallPWAModal,
    ),
  { ssr: false },
);

const GrantsCard = dynamic(
  () =>
    import('@/features/grants/components/GrantsCard').then(
      (mod) => mod.GrantsCard,
    ),
  { ssr: false },
);

const EmptySection = dynamic(
  () =>
    import('@/components/shared/EmptySection').then((mod) => mod.EmptySection),
  { ssr: false },
);

export default function HomePage({ isAuth, userGrantsRegion }: Props) {
  const { data: grants } = useQuery(
    homepageGrantsQuery({
      userRegion: userGrantsRegion,
    }),
  );

  return (
    <Home type="landing" isAuth={isAuth}>
      <InstallPWAModal />
      <HomepagePop />
      {isAuth && <FeatureModal />}
      <div className="w-full">
        <ListingTabs type="home" />
        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          showEmoji
          showViewAll
        >
          {!grants?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection title="No grants available!" />
            </div>
          )}
          {grants &&
            grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
      </div>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let userGrantsRegion: string[] | null | undefined = null;
  let isAuth = false;

  const privyDid = await getPrivyToken(context.req);

  if (privyDid) {
    const user = await prisma.user.findUnique({
      where: { privyDid },
    });

    if (user) {
      isAuth = true;
      const matchedGrantsRegion = CombinedRegions.find((region) =>
        region.country.includes(user.location!),
      );
      if (matchedGrantsRegion?.region) {
        userGrantsRegion = [
          matchedGrantsRegion.region,
          Regions.GLOBAL,
          ...(matchedGrantsRegion.country || []),
          ...(getParentRegions(matchedGrantsRegion) || []),
        ];
      } else {
        userGrantsRegion = [Regions.GLOBAL];
      }
    }
  }

  return {
    props: {
      isAuth,
      userGrantsRegion,
    },
  };
};
