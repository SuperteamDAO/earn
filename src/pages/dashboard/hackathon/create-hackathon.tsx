import { CreateListing } from '@/features/listing-builder';
import { Sidebar } from '@/layouts/Sponsor';

function CreateHackathon() {
  return (
    <Sidebar>
      <CreateListing type="hackathon" />
    </Sidebar>
  );
}

export default CreateHackathon;
