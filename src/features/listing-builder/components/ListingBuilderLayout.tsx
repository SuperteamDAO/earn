import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Login } from '@/features/auth';
import { Header } from '@/features/navbar';
import {
  activeHackathonQuery,
  sponsorDashboardListingQuery,
} from '@/features/sponsor-dashboard';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';

import { ListingBuilder } from './ListingBuilder';

interface ListingBuilderLayout {
  route: 'new' | 'edit' | 'duplicate';
  slug?: string;
}

export function ListingBuilderLayout({ route, slug }: ListingBuilderLayout) {
  const { user } = useUser();
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: hackathon, isLoading: isHackathonLoading } = useQuery({
    ...activeHackathonQuery(),
    enabled: !!user,
  });

  const { data: listing, isLoading: isListingLoading } = useQuery({
    ...sponsorDashboardListingQuery(slug || ''),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (listing) {
      if (listing.sponsorId !== user?.currentSponsorId) {
        router.push('/dashboard/listings');
        return;
      }
    }
  }, [listing, user?.currentSponsorId, router]);

  useEffect(() => {
    const handleRouteComplete = () => {
      if (slug)
        queryClient.invalidateQueries({
          queryKey: ['sponsor-dashboard-listing', slug],
        });
    };

    router.events.on('routeChangeComplete', handleRouteComplete);
    return () => router.events.off('routeChangeComplete', handleRouteComplete);
  }, [router.events, queryClient, slug]);

  if (!session && status === 'unauthenticated') {
    return <Login hideCloseIcon isOpen={true} onClose={() => {}} />;
  }

  if (!session && status === 'loading') {
    return <LoadingSection />;
  }
  const showContent =
    user?.currentSponsor?.id ||
    user?.hackathonId ||
    session?.user?.role === 'GOD';
  if (!user || !session || !showContent) {
    return <LoadingSection />;
  }
  if (isListingLoading || isHackathonLoading) {
    return <LoadingSection />;
  }

  if (route !== 'new' && (!slug || !listing)) {
    return (
      <>
        <Default
          meta={
            <Meta
              title="Superteam Earn | Work to Earn in Crypto"
              description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
              canonical="https://earn.superteam.fun"
            />
          }
        >
          <Header />
          <ErrorSection message="Sorry! The bounty you are looking for is not available." />
        </Default>
      </>
    );
  }

  return (
    <>
      <ListingBuilder
        listing={
          route === 'duplicate'
            ? {
                ...listing,
                title: listing?.title + ' (copy)',
                slug: '',
                isPublished: false,
                publishedAt: undefined,
                id: undefined,
              }
            : listing
        }
        isEditing={!!listing?.publishedAt}
        hackathon={
          listing?.type === 'hackathon'
            ? (listing?.Hackathon as any)
            : hackathon
        }
      />
    </>
  );
}
