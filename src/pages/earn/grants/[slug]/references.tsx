import type { GetServerSideProps } from 'next';

import { GrantPageLayout } from '@/layouts/Grants';

import { getGrantBySlug } from '@/features/grants/queries/get-grant-by-slug';
import { type GrantWithApplicationCount } from '@/features/grants/types';
import { ReferenceCard } from '@/features/listings/components/ListingPage/ReferenceCard';

interface GrantsDetailsProps {
  grant: GrantWithApplicationCount | null;
}

function Grants({ grant }: GrantsDetailsProps) {
  return (
    <GrantPageLayout grant={grant}>
      <div>
        <div className="mt-2 mb-10 flex max-w-7xl flex-col gap-4 rounded-lg bg-white md:flex-row md:items-start md:justify-between">
          <div className="w-full">
            <p className="mt-2 mb-6 text-xl font-semibold text-gray-500">
              References
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {grant?.references?.map((reference, i) => (
                <ReferenceCard
                  link={reference.link}
                  key={i}
                  title={reference.title}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </GrantPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const rawSlug = context.params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const grantData = await getGrantBySlug(slug);

    if (!grantData) {
      return {
        notFound: true,
      };
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        grant: grantData,
      },
    };
  } catch (e) {
    console.error(e);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        grant: null,
      },
    };
  }
};
export default Grants;
