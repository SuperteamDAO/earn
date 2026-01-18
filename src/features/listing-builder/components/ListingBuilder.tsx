import { usePrivy } from '@privy-io/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';

import { Login } from '@/features/auth/components/Login';
import { Header } from '@/features/navbar/components/Header';
import { useAutoSwitchSponsor } from '@/features/sponsor-dashboard/hooks/use-auto-switch-sponsor';
import { activeHackathonsQuery } from '@/features/sponsor-dashboard/queries/active-hackathons';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard/queries/listing';

import { AUTO_GENERATE_STORAGE_KEY } from '../constants';
import { ListingBuilderProvider } from './ListingBuilderProvider';

interface ListingBuilderLayout {
  route: 'new' | 'edit' | 'duplicate';
  slug?: string;
}

export function ListingBuilder({ route, slug }: ListingBuilderLayout) {
  const { user, isLoading: isUserLoading } = useUser();
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: hackathons, isLoading: isHackathonLoading } = useQuery({
    ...activeHackathonsQuery(),
    enabled: !!user,
  });

  const {
    data: listing,
    isLoading: isListingLoading,
    error: listingError,
    refetch: refetchListing,
  } = useQuery({
    ...sponsorDashboardListingQuery(slug || ''),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { isSwitching: isSwitchingSponsor } = useAutoSwitchSponsor({
    error: listingError,
    refetch: refetchListing,
    queryKey: ['sponsor-dashboard-listing', slug || ''],
  });

  useEffect(() => {
    // Handle 403 errors for non-GOD users (must run before error page check)
    if (listingError && !isSwitchingSponsor && user?.role !== 'GOD') {
      const error = listingError as any;
      if (error?.response?.status === 403) {
        toast.error('This listing does not belong to you');
        router.push('/earn/dashboard/listings');
        return;
      }
    }
  }, [listingError, router, user?.role, isSwitchingSponsor]);

  useEffect(() => {
    if (isListingLoading || isUserLoading || !ready) return;
    if (listing) {
      // Only redirect non-GOD users on sponsor mismatch
      if (
        listing.sponsorId !== user?.currentSponsorId &&
        user?.role !== 'GOD'
      ) {
        router.push('/earn/dashboard/listings');
        return;
      }
    }
  }, [
    listing,
    user?.currentSponsorId,
    user?.role,
    router,
    isListingLoading,
    isUserLoading,
    ready,
  ]);

  useEffect(() => {
    const handleRouteComplete = () => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-dashboard-listing', slug],
      });
    };

    router.events.on('routeChangeComplete', handleRouteComplete);

    return () => {
      router.events.off('routeChangeComplete', handleRouteComplete);
    };
  }, [router.events, queryClient, slug]);

  useEffect(() => {
    localStorage.removeItem(AUTO_GENERATE_STORAGE_KEY);
  }, []);

  if (ready && !authenticated) {
    return <Login isOpen={true} onClose={() => {}} />;
  }

  if (!ready) {
    return <LoadingSection />;
  }

  const showContent = user?.currentSponsor?.id || user?.role === 'GOD';
  if (!user || !authenticated || !showContent) {
    return <LoadingSection />;
  }

  if (isListingLoading || isHackathonLoading || isSwitchingSponsor) {
    return <LoadingSection />;
  }

  // Don't show error page if we're redirecting due to 403 error
  const is403Error =
    listingError &&
    (listingError as any)?.response?.status === 403 &&
    user?.role !== 'GOD';
  if (is403Error) {
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
