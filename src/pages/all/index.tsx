import { Home } from '@/layouts/Home';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

export default function AllListingsPage() {
  return (
    <Home type="listing">
      <HomepagePop />
      <div className="w-full">
        <ListingsSection type="all" />
      </div>
    </Home>
  );
}
