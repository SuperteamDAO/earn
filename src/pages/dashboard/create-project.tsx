import { CreateListing } from '@/components/listings/bounty/Bounty';
import { Sidebar } from '@/layouts/Sponsor';

function CreateProject() {
  return (
    <Sidebar>
      <CreateListing type="project" />
    </Sidebar>
  );
}

export default CreateProject;
