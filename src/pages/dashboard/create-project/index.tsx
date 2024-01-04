import { CreateListing } from '@/components/listings/bounty/Bounty';
import { Sidebar } from '@/layouts/Sidebar';

function CreateProject() {
  return (
    <Sidebar>
      <CreateListing type="permissioned" />
    </Sidebar>
  );
}

export default CreateProject;
