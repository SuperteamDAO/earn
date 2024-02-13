import { CreateListing } from '@/features/listing-builder';
import { Sidebar } from '@/layouts/Sponsor';

function CreateBounty() {
  return (
    <Sidebar>
      <CreateListing type="bounty" />
    </Sidebar>
  );
}

export default CreateBounty;
