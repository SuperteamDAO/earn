import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

import { applicationsAtom } from '@/features/sponsor-dashboard/atoms';
import { ApplicationsTab } from '@/features/sponsor-dashboard/components/ApplicationsTab';
import { ApplicationHeader } from '@/features/sponsor-dashboard/components/GrantApplications/ApplicationHeader';
import { PaymentsHistoryTab } from '@/features/sponsor-dashboard/components/GrantApplications/PaymentsHistoryTab';
import { TranchesTab } from '@/features/sponsor-dashboard/components/TranchesTab';
import { sponsorGrantQuery } from '@/features/sponsor-dashboard/queries/grant';

interface Props {
  slug: string;
}

function GrantApplications({ slug }: Props) {
  const { user } = useUser();
  const router = useRouter();

  const { data: grant, isLoading: isGrantLoading } = useQuery(
    sponsorGrantQuery(slug, user?.currentSponsorId),
  );

  const applications = useAtomValue(applicationsAtom);

  useEffect(() => {
    if (grant && grant.sponsorId !== user?.currentSponsorId) {
      router.push('/dashboard/listings');
    }
  }, [grant, user?.currentSponsorId, router]);

  return (
    <SponsorLayout isCollapsible>
      {isGrantLoading ? (
        <LoadingSection />
      ) : (
        <>
          <ApplicationHeader grant={grant} applications={applications} />
          <Tabs defaultValue="applications">
            <TabsList className="gap-2 font-medium text-slate-400">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="tranches">Tranche Requests</TabsTrigger>
              <TabsTrigger value="payments">Payments History</TabsTrigger>
            </TabsList>
            <div className="h-0.5 w-full bg-slate-200" />
            <TabsContent value="applications" className="w-full px-0">
              <ApplicationsTab slug={slug} />
            </TabsContent>

            <TabsContent
              value="tranches"
              className="px-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
            >
              <TranchesTab />
            </TabsContent>

            <TabsContent
              value="payments"
              className="px-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
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
