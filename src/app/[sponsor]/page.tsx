import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import { generatePageMetadata } from '@/layouts/metadata';
import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

interface PageProps {
  readonly params: Promise<{ sponsor: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { sponsor: sponsorSlug } = await params;

  const sponsorExclusiveInfo = exclusiveSponsorData[sponsorSlug];
  if (!sponsorExclusiveInfo) {
    return {};
  }

  const sponsorInfo = await prisma.sponsors.findUnique({
    where: {
      name: sponsorExclusiveInfo.title,
    },
  });

  if (!sponsorInfo) {
    return {};
  }

  const title = sponsorExclusiveInfo.title;
  const ogImage = new URL(`${getURL()}api/dynamic-og/sponsor/`);
  ogImage.searchParams.set('logo', sponsorInfo.logo || '');
  ogImage.searchParams.set('title', title);
  ogImage.searchParams.set('slug', sponsorInfo.slug);

  return generatePageMetadata({
    title: `${title} Opportunities | Superteam Earn`,
    description: `Check out all of ${title}'s latest earning opportunities on a single page.`,
    og: ogImage.toString(),
  });
}

export default async function SponsorRedirectPage({ params }: PageProps) {
  const { sponsor: sponsorSlug } = await params;

  const sponsorExclusiveInfo = exclusiveSponsorData[sponsorSlug];
  if (!sponsorExclusiveInfo) {
    notFound();
  }

  const sponsorInfo = await prisma.sponsors.findUnique({
    where: {
      name: sponsorExclusiveInfo.title,
    },
  });

  if (!sponsorInfo) {
    notFound();
  }

  redirect(`/s/${sponsorInfo.slug}`);
}
