import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

interface ProSharePageProps {
  talent: {
    firstName: string | null;
    lastName: string | null;
    username: string;
    photo: string | null;
  } | null;
}

export default function ProSharePage({
  talent: initialTalent,
}: ProSharePageProps) {
  const [talent] = useState<typeof initialTalent>(initialTalent);
  const router = useRouter();

  useEffect(() => {
    if (talent?.username) {
      router.push(`${getURL()}earn/t/${talent.username}/`);
    }
  }, []);

  const ogImagePath = `${getURL()}api/dynamic-og/pro-x/`;
  const ogImage = new URL(ogImagePath);
  ogImage.searchParams.set(
    'name',
    `${talent?.firstName || ''} ${talent?.lastName || ''}`.trim(),
  );
  ogImage.searchParams.set('username', talent?.username || '');
  if (talent?.photo) {
    ogImage.searchParams.set('photo', talent.photo);
  }

  const title =
    talent?.firstName && talent?.lastName
      ? `${talent.firstName} ${talent.lastName} | Superteam Earn Pro`
      : 'Superteam Earn Pro';

  const description = `Check out ${talent?.firstName || talent?.username || 'this'}'s Pro profile on Superteam Earn`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${getURL()}earn/t/${talent?.username}/`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage.toString()} />
      <meta property="og:type" content="profile" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage.toString()} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content={`${talent?.firstName || talent?.username || 'User'}'s Pro profile`}
      />
      <meta charSet="UTF-8" key="charset" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
        key="viewport"
      />
    </Head>
  );
}

export const getServerSideProps: GetServerSideProps<ProSharePageProps> = async (
  context,
) => {
  const { slug } = context.query;

  try {
    context.res.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=600',
    );

    const username = Array.isArray(slug) ? slug[0] : (slug as string);

    const talent = await prisma.user.findUnique({
      where: { username },
      select: {
        firstName: true,
        lastName: true,
        username: true,
        photo: true,
      },
    });

    if (!talent || !talent.username) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        talent: {
          firstName: talent.firstName,
          lastName: talent.lastName,
          username: talent.username,
          photo: talent.photo,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return {
      notFound: true,
    };
  }
};
