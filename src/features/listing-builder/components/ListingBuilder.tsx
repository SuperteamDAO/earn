import { usePrivy } from '@privy-io/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';

import { Login } from '@/features/auth/components/Login';
import { Header } from '@/features/navbar/components/Header';
import { activeHackathonsQuery } from '@/features/sponsor-dashboard/queries/active-hackathons';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard/queries/listing';

import { ListingBuilderProvider } from './ListingBuilderProvider';

interface ListingBuilderLayout {
  route: 'new' | 'edit' | 'duplicate';
  slug?: string;
}

export function ListingBuilder({ route, slug }: ListingBuilderLayout) {
  const { user } = useUser();
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: hackathons, isLoading: isHackathonLoading } = useQuery({
    ...activeHackathonsQuery(),
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
      queryClient.invalidateQueries({
        queryKey: ['sponsor-dashboard-listing', slug],
      });
    };

    router.events.on('routeChangeStart', handleRouteComplete);
    return () => router.events.off('routeChangeStart', handleRouteComplete);
  }, [router.events, queryClient, slug]);

  if (ready && !authenticated) {
    return <Login isOpen={true} onClose={() => {}} />;
  }

  if (!ready) {
    return <LoadingSection />;
  }

  const showContent =
    user?.currentSponsor?.id || user?.hackathonId || user?.role === 'GOD';
  if (!user || !authenticated || !showContent) {
    return <LoadingSection />;
  }

  if (isListingLoading || isHackathonLoading) {
    return <LoadingSection />;
  }

  if (route !== 'new' && (!slug || !listing)) {
    return (
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
    );
  }

  return (
    <ListingBuilderProvider
      listing={
        route === 'duplicate'
          ? {
              ...listing,
              title: listing?.title + ' (copy)',
              slug: '',
              isPublished: false,
              publishedAt: undefined,
              id: undefined,
              deadline: undefined,
              status: 'OPEN',
            }
          : listing
      }
      isEditing={!!listing?.publishedAt}
      hackathons={
        listing?.type === 'hackathon'
          ? ([
              listing?.Hackathon,
              ...(hackathons
                ? hackathons.filter((s) => s.slug !== listing?.Hackathon?.slug)
                : []),
            ] as any)
          : hackathons
      }
    />
  );
}
