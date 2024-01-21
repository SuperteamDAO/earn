import { CreateListing } from '@/components/listings/bounty/Bounty';
import { Sidebar } from '@/layouts/Sponsor';

function CreateProject() {
  return (
    <Sidebar>
      <CreateListing type="permissioned" />
    </Sidebar>
  );
}

export default CreateProject;
