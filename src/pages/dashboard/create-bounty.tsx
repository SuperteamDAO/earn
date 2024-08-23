import { CreateListing } from '@/features/listing-builder';
import { SponsorLayout } from '@/layouts/Sponsor';

function CreateBounty() {
  return (
    <SponsorLayout>
      <CreateListing type="bounty" />
    </SponsorLayout>
  );
}

export default CreateBounty;
