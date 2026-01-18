import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

import { applicationsAtom } from '@/features/sponsor-dashboard/atoms';
import { ApplicationsTab } from '@/features/sponsor-dashboard/components/ApplicationsTab';
import { ApplicationHeader } from '@/features/sponsor-dashboard/components/GrantApplications/ApplicationHeader';
import { PaymentsHistoryTab } from '@/features/sponsor-dashboard/components/GrantApplications/PaymentsHistoryTab';
import { TranchesTab } from '@/features/sponsor-dashboard/components/TranchesTab';
import { useAutoSwitchSponsor } from '@/features/sponsor-dashboard/hooks/use-auto-switch-sponsor';
import { sponsorGrantQuery } from '@/features/sponsor-dashboard/queries/grant';

interface Props {
  slug: string;
}

function GrantApplications({ slug }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('applications');

  const {
    data: grant,
    isLoading: isGrantLoading,
    error: grantError,
    refetch: refetchGrant,
  } = useQuery(sponsorGrantQuery(slug, user?.currentSponsorId));

  const { isSwitching: isSwitchingSponsor } = useAutoSwitchSponsor({
    error: grantError,
    refetch: refetchGrant,
    queryKey: ['grant', slug],
  });

  const applications = useAtomValue(applicationsAtom);

  const isST =
    grant?.isNative &&
    grant?.airtableId &&
    grant?.id !== 'c72940f7-81ae-4c03-9bfe-9979d4371267';

  useEffect(() => {
    // Handle 403 errors for non-GOD users
    if (grantError && !isSwitchingSponsor && user?.role !== 'GOD') {
      const error = grantError as any;
      if (error?.response?.status === 403) {
        toast.error('This grant does not belong to you');
        router.push('/earn/dashboard/listings');
      }
    }
  }, [grantError, router, user?.role, isSwitchingSponsor]);

  useEffect(() => {
    if (
      grant &&
      grant.sponsorId !== user?.currentSponsorId &&
      user?.role !== 'GOD'
    ) {
      router.push('/earn/dashboard/listings');
    }
  }, [grant, user?.currentSponsorId, user?.role, router]);

  return (
    <SponsorLayout isCollapsible>
      {isGrantLoading || isSwitchingSponsor ? (
        <LoadingSection />
      ) : (
        <>
          <ApplicationHeader
            grant={grant}
            applications={applications}
            showAiReview={activeTab === 'applications'}
          />
          <Tabs
            defaultValue="applications"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="gap-2 font-medium text-slate-400 focus-visible:ring-0">
              <TabsTrigger value="applications">
                Applications
                <div className="text-xxs ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-slate-500">
                  {applications?.length}
                </div>
              </TabsTrigger>
              {isST && (
                <TabsTrigger value="tranches">Tranche Requests</TabsTrigger>
              )}
              <TabsTrigger value="payments">Payments History</TabsTrigger>
            </TabsList>
            <div className="h-0.5 w-full bg-slate-200" />
            <TabsContent value="applications" className="w-full px-0">
              <ApplicationsTab slug={slug} />
            </TabsContent>

            <TabsContent
              value="tranches"
              className="px-0 focus:outline-hidden focus-visible:ring-0 focus-visible:ring-transparent"
            >
              <TranchesTab slug={slug} />
            </TabsContent>

            <TabsContent
              value="payments"
              className="px-0 focus:outline-hidden focus-visible:ring-0 focus-visible:ring-transparent"
            >
              <PaymentsHistoryTab grant={grant} grantId={grant?.id} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default GrantApplications;
