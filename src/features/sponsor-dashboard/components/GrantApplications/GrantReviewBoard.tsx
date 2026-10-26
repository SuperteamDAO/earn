'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  COINDCX_GRANT_ID,
  isAgenticEngineeringGrant,
} from '@/features/grants/utils/stGrant';

import type { SponsorGrantDetailsResponse } from '../../constants/sponsorGrantDetails';
import type { GrantTrancheWithApplication } from '../../queries/tranches';
import type { GrantApplicationWithUser } from '../../types';
import { ApplicationsTab } from '../ApplicationsTab';
import { TranchesTab } from '../TranchesTab';
import { ApplicationHeader } from './ApplicationHeader';
import { GrantReviewProvider, useGrantReview } from './GrantReviewContext';
import { PaymentsHistoryTab } from './PaymentsHistoryTab';

interface Props {
  slug: string;
  grant: SponsorGrantDetailsResponse;
  applications: GrantApplicationWithUser[];
  tranches: GrantTrancheWithApplication[];
  grantees: GrantApplicationWithUser[];
}

// The grant review page's body, as Earn's applications page laid it out.
export function GrantReviewBoard({
  slug,
  grant,
  applications,
  tranches,
  grantees,
}: Props) {
  return (
    <GrantReviewProvider
      slug={slug}
      grant={grant}
      applications={applications}
      tranches={tranches}
    >
      <Board slug={slug} grantees={grantees} />
    </GrantReviewProvider>
  );
}

function Board({
  slug,
  grantees,
}: {
  slug: string;
  grantees: GrantApplicationWithUser[];
}) {
  const { grant, applications } = useGrantReview();

  const hasSpecialTranches =
    (grant?.isNative && grant?.airtableId && grant?.id !== COINDCX_GRANT_ID) ||
    isAgenticEngineeringGrant(grant);

  return (
    <>
      <ApplicationHeader grant={grant} />
      <Tabs defaultValue="applications">
        <TabsList className="gap-2 font-medium text-slate-400 focus-visible:ring-0">
          <TabsTrigger value="applications">
            Applications
            <div className="text-xxs ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-slate-500">
              {applications?.length}
            </div>
          </TabsTrigger>
          {hasSpecialTranches && (
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
          <TranchesTab />
        </TabsContent>

        <TabsContent
          value="payments"
          className="px-0 focus:outline-hidden focus-visible:ring-0 focus-visible:ring-transparent"
        >
          <PaymentsHistoryTab
            grant={grant}
            grantId={grant?.id}
            grantees={grantees}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
