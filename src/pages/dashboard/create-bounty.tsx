import { CreateListing } from '@/components/listings/bounty/Bounty';
import { Sidebar } from '@/layouts/Sponsor';

function CreateBounty() {
  return (
    <Sidebar>
      <CreateListing type="open" />
    </Sidebar>
  );
}

export default CreateBounty;
