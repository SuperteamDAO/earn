import { type GetServerSideProps } from 'next';
import Head from 'next/head';

import { JsonLd } from '@/components/shared/JsonLd';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { generateBreadcrumbListSchema } from '@/utils/json-ld';

import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { ListingsSection } from '@/features/listings/components/ListingsSection';
import {
  generateCanonicalSlug,
  getCategoryNameFromTags,
  getOpportunityDescription,
  getOpportunityDisplayName,
  getRegionNameFromTags,
  getSkillNameFromTags,
  parseOpportunityTags,
  validateOpportunityTags,
} from '@/features/listings/utils/parse-opportunity-tags';

interface OpportunitiesPageProps {
  readonly parsedTags: {
    readonly region?: string;
    readonly skill?: string;
    readonly category?: string;
    readonly type?: 'bounties' | 'projects' | 'grants';
  };
}

const OpportunitiesPage = ({ parsedTags }: OpportunitiesPageProps) => {
  const displayName = getOpportunityDisplayName(parsedTags);
  const description = getOpportunityDescription(parsedTags);
  const canonicalSlug = generateCanonicalSlug(parsedTags);
  const canonical = `https://superteam.fun/earn/opportunities/${canonicalSlug}/`;
  const ogImage = `${ASSET_URL}/og/og.png`;

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: 'Opportunities' },
    { name: displayName },
  ]);

  const categoryName = getCategoryNameFromTags(parsedTags) || 'All';
  const skillName = getSkillNameFromTags(parsedTags);
  const regionName = getRegionNameFromTags(parsedTags);

  return (
    <Home
      type="opportunity"
      opportunityTags={parsedTags}
      meta={
        <>
          <Meta
            title={`${displayName} | Superteam Earn`}
            description={description}
            canonical={canonical}
            og={ogImage}
          />
          <Head>
            <meta property="og:type" content="website" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
              property="og:image:alt"
              content={`${displayName} on Superteam Earn`}
            />
            <meta name="twitter:card" content="summary_large_image" />
          </Head>
          <JsonLd data={[breadcrumbSchema]} />
        </>
      }
    >
      <div className="w-full">
        {parsedTags.type !== 'grants' && (
          <ListingsSection
            type="opportunity"
            region={regionName}
            skill={skillName}
            category={categoryName}
          />
        )}
        {(!parsedTags.type || parsedTags.type === 'grants') && (
          <GrantsSection
            type="opportunity"
            region={regionName}
            skill={skillName}
            category={categoryName}
            hideWhenEmpty
          />
        )}
      </div>
    </Home>
  );
};

export const getServerSideProps: GetServerSideProps<
  OpportunitiesPageProps
> = async (context) => {
  const { params } = context;

  const tags = params?.tags;

  const tagsArray =
    typeof tags === 'string' ? [tags] : Array.isArray(tags) ? tags : [];

  if (!validateOpportunityTags(tagsArray)) {
    return {
      notFound: true,
    };
  }

  const parsedTags = parseOpportunityTags(tagsArray);

  return {
    props: {
      parsedTags,
    },
  };
};

export default OpportunitiesPage;
