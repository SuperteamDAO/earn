import { type GetServerSideProps } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface HomePageProps {
  potentialSession: boolean;
}

export default function AllListingsPage({ potentialSession }: HomePageProps) {
  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="All Listings | Superteam Earn"
          description="Browse all bounties, projects, and opportunities on Superteam Earn. Find crypto jobs and gigs across Design, Development, Content, and more."
          canonical="https://earn.superteam.fun/all/"
          og={ASSET_URL + `/og/og.png`}
        />
      }
    >
      <HomepagePop />
      <div className="w-full">
        <ListingsSection type="all" potentialSession={potentialSession} />
      </div>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({
  req,
}) => {
  const cookies = req.headers.cookie || '';

  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);

  return { props: { potentialSession: cookieExists } };
};
