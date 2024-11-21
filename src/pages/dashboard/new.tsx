import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { ListingBuilder } from '@/features/listing-builder';
import { activeHackathonQuery } from '@/features/sponsor-dashboard';
import { useUser } from '@/store/user';

function NewListing() {
  const user = useUser();
  const { data: hackathon, isLoading } = useQuery({
    ...activeHackathonQuery(),
    enabled: !!user.user,
  });
  useMemo(() => {
    console.log('hackathon', hackathon);
  }, [hackathon]);
  return isLoading ? (
    <LoadingSection />
  ) : (
    <ListingBuilder hackathon={hackathon} />
  );
}

export default NewListing;
