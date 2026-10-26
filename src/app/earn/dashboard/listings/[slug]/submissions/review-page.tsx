import 'server-only';

import { SolanaWalletProvider } from '@/context/SolanaWallet';
import { getSession } from '@/lib/session';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

import { BountySubmissions } from '@/features/sponsor-dashboard/components/Submissions/BountySubmissions';
import { HackathonSubmissions } from '@/features/sponsor-dashboard/components/Submissions/HackathonSubmissions';
import { ReviewProvider } from '@/features/sponsor-dashboard/components/Submissions/review-state';
import {
  NotYourListing,
  SwitchSponsor,
} from '@/features/sponsor-dashboard/components/Submissions/ReviewAccess';

// A listing's submissions for review, loaded on the server; the frame
// (SponsorLayout) has already seen to signing in and the sponsor.
export async function ReviewPage({
  slug,
  hackathon,
}: {
  slug: string;
  hackathon: boolean;
}) {
  const session = await getSession();
  if (!session) return null;
  const page = await runtime.runPromise(
    Review.Review.use((review) => review.page(session.userId, slug, hackathon)),
  );
  switch (page._tag) {
    case 'Switch':
      return <SwitchSponsor sponsorId={page.sponsorId} />;
    case 'Refused':
      return <NotYourListing />;
    default:
      return (
        <SolanaWalletProvider>
          <ReviewProvider
            key={page.listing.id}
            listing={page.listing}
            submissions={page.submissions}
          >
            {hackathon ? <HackathonSubmissions /> : <BountySubmissions />}
          </ReviewProvider>
        </SolanaWalletProvider>
      );
  }
}
