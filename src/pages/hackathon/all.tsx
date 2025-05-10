import { Home } from '@/layouts/Home';

import { HackathonSection } from '@/features/hackathon/components/HackathonSection';

export default function AllListingsPage() {
  return (
    <Home type="listing">
      <div className="w-full">
        <HackathonSection type="all" />
      </div>
    </Home>
  );
}
