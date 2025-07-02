import { Home } from '@/layouts/Home';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { Listings } from '@/features/listings/components/Listings';

export default function AllListingsPage() {
  return (
    <Home type="listing">
      <HomepagePop />
      <div className="w-full">
        <Listings type="all" />
      </div>
    </Home>
  );
}
