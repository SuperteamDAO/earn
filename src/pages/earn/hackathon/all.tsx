import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

import { HackathonSection } from '@/features/hackathon/components/HackathonSection';

export default function AllListingsPage() {
  return (
    <Home
      type="listing"
      meta={
        <Meta
          title="Hackathon Tracks | Superteam Earn"
          description="Browse all Solana hackathon tracks on Superteam Earn. Find and submit to bounty tracks across development, design, and content from the latest Web3 hackathons."
          canonical="https://superteam.fun/earn/hackathon/all/"
        />
      }
    >
      <div className="w-full">
        <HackathonSection type="all" />
      </div>
    </Home>
  );
}
