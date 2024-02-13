import { useRouter } from 'next/router';

import { CreateListing } from '@/features/listing-builder';
import { Sidebar } from '@/layouts/Sponsor';

function CreateHackathon() {
  const router = useRouter();
  const slug = router.query.slug as string;
  return (
    <Sidebar>
      <CreateListing type="hackathon" hackathonSlug={slug} />
    </Sidebar>
  );
}

export default CreateHackathon;
