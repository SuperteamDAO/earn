import { Box, Flex } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { GrantsCard, grantsQuery } from '@/features/grants';
import {
  ListingSection,
  listingsQuery,
  ListingTabs,
} from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { dayjs } from '@/utils/dayjs';

type SlugKeys = 'design' | 'content' | 'development' | 'other';

function ListingCategoryPage({ slug }: { slug: string }) {
  const router = useRouter();
  const deadline = useMemo(
    () => dayjs().subtract(1, 'month').toISOString(),
    [],
  );

  const { data: listingsData, isLoading: isListingsLoading } = useQuery(
    listingsQuery({
      take: 100,
      filter: slug,
      deadline,
    }),
  );

  const { data: grants, isLoading: isGrantsLoading } = useQuery(
    grantsQuery({ order: 'asc', take: 10 }),
  );

  const titlesForSlugs: { [key in SlugKeys]: string } = {
    design: '设计 赏金和任务 | Solar Earn',
    content: '内容 赏金和任务 | Solar Earn',
    development: '开发 赏金和任务 | Solar Earn',
    other: '其他 赏金和任务 | Solar Earn',
  };

  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Solar Earn';
  const formattedSlug =
    slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  const metaDescription = `Find the latest ${slug.toLowerCase()} bounties and grants for freelancers and builders in the crypto space on Solar Earn.`;
  const canonicalURL = `/category/${slug}/`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
        og={`${router.basePath}/assets/og/categories/${slug}.png`}
      />
      <Box w={'100%'}>
        <ListingTabs
          bounties={listingsData ?? []}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.webp"
          title={`${formattedSlug} `}
          viewAllLink={`/category/${slug}/all`}
          showViewAll
          take={10}
        />
        <ListingSection
          type="grants"
          title={`${formattedSlug} 资助`}
          sub="为建设者提供资金支持"
          emoji="/assets/home/emojis/grants.webp"
          showViewAll
        >
          {isGrantsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isGrantsLoading && !grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="暂无资助可申请！"
                message="订阅通知以便接收关于新资助项目的通知。"
              />
            </Flex>
          )}
          {!isGrantsLoading &&
            grants?.map((grant) => <GrantsCard grant={grant} key={grant.id} />)}
        </ListingSection>
      </Box>
    </Home>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;

  if (slug && typeof slug === 'string' && slug !== slug.toLowerCase()) {
    return {
      redirect: {
        destination: `/category/${slug.toLowerCase()}`,
        permanent: false,
      },
    };
  }

  const normalizedSlug = typeof slug === 'string' ? slug.toLowerCase() : '';
  const validCategories = ['design', 'content', 'development', 'other'];

  if (!validCategories.includes(normalizedSlug)) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug },
  };
}

export default ListingCategoryPage;
