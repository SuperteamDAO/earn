import { CreateListing } from '@/features/listing-builder';
import { Sidebar } from '@/layouts/Sponsor';

function CreateProject() {
  return (
    <Sidebar>
      <CreateListing type="project" />
    </Sidebar>
  );
}

export default CreateProject;
