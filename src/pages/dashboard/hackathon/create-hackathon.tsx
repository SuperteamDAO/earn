import { CreateListing } from '@/features/listing-builder';
import { SponsorLayout } from '@/layouts/Sponsor';

function CreateHackathon() {
  return (
    <SponsorLayout>
      <CreateListing type="hackathon" />
    </SponsorLayout>
  );
}

export default CreateHackathon;
