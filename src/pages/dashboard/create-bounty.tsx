import { CreateListing } from '@/components/listings/bounty/Bounty';
import { Sidebar } from '@/layouts/Sponsor';

function CreateBounty() {
  return (
    <Sidebar>
      <CreateListing type="bounty" />
    </Sidebar>
  );
}

export default CreateBounty;
