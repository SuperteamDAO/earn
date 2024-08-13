import { CreateListing } from '@/features/listing-builder';
import { SponsorLayout } from '@/layouts/Sponsor';

function CreateProject() {
  return (
    <SponsorLayout>
      <CreateListing type="project" />
    </SponsorLayout>
  );
}

export default CreateProject;
