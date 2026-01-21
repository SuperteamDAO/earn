import type { SponsorType } from '@/interface/sponsor';
import { AppConfig } from '@/utils/AppConfig';
import { getURL } from '@/utils/validUrl';

import { type Grant } from '@/features/grants/types';
import { type Listing } from '@/features/listings/types';

// Base schema.org types
interface BaseSchema {
  readonly '@context': string;
  readonly '@type': string;
}

interface OrganizationSchema extends BaseSchema {
  readonly '@type': 'Organization';
  readonly name: string;
  readonly url?: string;
  readonly logo?: string | ImageObjectSchema;
  readonly description?: string;
  readonly sameAs?: readonly string[];
  readonly email?: string;
  readonly foundingDate?: string;
  readonly address?: string;
}

interface WebSiteSchema extends BaseSchema {
  readonly '@type': 'WebSite';
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  readonly potentialAction?: SearchActionSchema;
}

interface SearchActionSchema {
  readonly '@type': 'SearchAction';
  readonly target: string;
  readonly 'query-input': string;
}

interface ImageObjectSchema {
  readonly '@type': 'ImageObject';
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
}

interface JobPostingSchema extends BaseSchema {
  readonly '@type': 'JobPosting';
  readonly title: string;
  readonly description: string;
  readonly hiringOrganization: OrganizationSchema;
  readonly employmentType?: string;
  readonly baseSalary?: MonetaryAmountSchema;
  readonly datePosted: string;
  readonly validThrough?: string;
  readonly jobLocation?: JobLocationSchema;
  readonly applicationContact?: string;
  readonly directApply?: boolean;
  readonly url?: string;
  readonly skills?: string;
  readonly responsibilities?: string;
  readonly identifier?: {
    readonly '@type': 'PropertyValue';
    readonly name: string;
    readonly value: string;
  };
}

interface MonetaryAmountSchema {
  readonly '@type': 'MonetaryAmount';
  readonly currency: string;
  readonly value?: {
    readonly '@type': 'QuantitativeValue';
    readonly value?: number;
    readonly minValue?: number;
    readonly maxValue?: number;
    readonly unitText?: string;
  };
}

interface JobLocationSchema {
  readonly '@type': 'Place';
  readonly address?: {
    readonly '@type': 'PostalAddress';
    readonly addressCountry?: string;
  };
  readonly applicantLocationRequirements?: {
    readonly '@type': 'Country';
    readonly name: string;
  };
}

interface MonetaryGrantSchema extends BaseSchema {
  readonly '@type': 'MonetaryGrant';
  readonly name: string;
  readonly description: string;
  readonly funder: OrganizationSchema;
  readonly amount?: MonetaryAmountSchema;
  readonly identifier?: string;
  readonly applicationDeadline?: string;
  readonly url?: string;
  readonly image?: string | ImageObjectSchema;
}

interface BreadcrumbListSchema extends BaseSchema {
  readonly '@type': 'BreadcrumbList';
  readonly itemListElement: readonly BreadcrumbItemSchema[];
}

interface CollectionPageSchema extends BaseSchema {
  readonly '@type': 'CollectionPage';
  readonly name: string;
  readonly description?: string;
  readonly url: string;
  readonly about?: {
    readonly '@type': 'Thing';
    readonly name: string;
  };
  readonly mainEntity?: {
    readonly '@type': 'ItemList';
    readonly name: string;
  };
}

interface BreadcrumbItemSchema {
  readonly '@type': 'ListItem';
  readonly position: number;
  readonly name: string;
  readonly item?: string;
}

interface PlaceSchema {
  readonly '@type': 'Place';
  readonly name: string;
}

interface PersonSchema extends BaseSchema {
  readonly '@type': 'Person';
  readonly name: string;
  readonly url?: string;
  readonly image?: string | ImageObjectSchema;
  readonly jobTitle?: string;
  readonly worksFor?: OrganizationSchema;
  readonly sameAs?: readonly string[];
  readonly homeLocation?: PlaceSchema;
  readonly knowsAbout?: readonly string[];
  readonly identifier?: {
    readonly '@type': 'PropertyValue';
    readonly name: string;
    readonly value: string;
  };
}

/**
 * Generate Organization schema for Superteam Earn
 */
export function generateOrganizationSchema(): OrganizationSchema {
  const baseUrl = getURL();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: AppConfig.site_name,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}assets/square-logo-color.svg`,
    },
    description: AppConfig.description,
    sameAs: ['https://twitter.com/SuperteamEarn'],
  };
}

/**
 * Generate WebSite schema with SearchAction
 */
export function generateWebSiteSchema(): WebSiteSchema {
  const baseUrl = getURL();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: AppConfig.site_name,
    url: baseUrl,
    description: AppConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}search?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Organization schema for a sponsor
 */
export function generateSponsorOrganizationSchema(
  sponsor: Pick<
    SponsorType,
    'name' | 'slug' | 'logo' | 'url' | 'twitter' | 'bio'
  >,
): OrganizationSchema {
  const baseUrl = getURL();
  const sameAs: string[] = [];

  if (sponsor.twitter) {
    sameAs.push(sponsor.twitter);
  }

  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: sponsor.name || '',
    url: sponsor.url || `${baseUrl}s/${sponsor.slug}`,
    logo: sponsor.logo || undefined,
    description: sponsor.bio || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  return schema;
}

/**
 * Generate Organization schema for a regional Superteam chapter
 */
export function generateRegionalOrganizationSchema(region: {
  readonly displayValue: string;
  readonly region: string;
  readonly slug: string;
  readonly code: string;
}): OrganizationSchema {
  const baseUrl = getURL();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: `Superteam Earn ${region.displayValue}`,
    url: `${baseUrl}regions/${region.slug}/`,
    description: `Superteam Earn ${region.displayValue} - Discover bounties and grants in the ${region.displayValue} crypto community`,
  };
}

/**
 * Generate JobPosting schema for a listing
 */
export function generateJobPostingSchema(
  listing: Pick<
    Listing,
    | 'id'
    | 'title'
    | 'description'
    | 'requirements'
    | 'skills'
    | 'rewardAmount'
    | 'token'
    | 'publishedAt'
    | 'deadline'
    | 'slug'
    | 'sponsor'
    | 'type'
    | 'region'
  >,
): JobPostingSchema {
  const baseUrl = getURL();
  const listingUrl = listing.slug
    ? `${baseUrl}listing/${listing.slug}`
    : undefined;

  const directApply = true;

  // Create hiring organization from sponsor
  const hiringOrganization: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: listing.sponsor?.name || 'Anonymous Sponsor',
    url: listing.sponsor?.url,
    logo: listing.sponsor?.logo,
  };

  // Create base salary if reward amount exists
  let baseSalary: MonetaryAmountSchema | undefined;
  if (listing.rewardAmount && listing.token) {
    baseSalary = {
      '@type': 'MonetaryAmount',
      currency: listing.token,
      value: {
        '@type': 'QuantitativeValue',
        value: listing.rewardAmount,
        unitText: 'TOTAL',
      },
    };
  }

  // Job location - remote/telecommute
  const jobLocation: JobLocationSchema = {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressCountry: listing.region || 'GLOBAL',
    },
  };

  // Extract skills as comma-separated string
  let skillsString: string | undefined;
  if (listing.skills && Array.isArray(listing.skills)) {
    const allSkills: string[] = [];
    listing.skills.forEach((skillGroup) => {
      if (skillGroup.skills) {
        allSkills.push(skillGroup.skills);
      }
      if (Array.isArray(skillGroup.subskills)) {
        allSkills.push(...skillGroup.subskills);
      }
    });
    if (allSkills.length > 0) {
      skillsString = allSkills.join(', ');
    }
  }

  // Strip HTML tags from description for plain text
  const stripHtml = (html?: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const schema: JobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: listing.title || 'Untitled Opportunity',
    description: stripHtml(listing.description) || 'No description provided',
    hiringOrganization,
    employmentType: listing.type === 'project' ? 'CONTRACTOR' : 'PART_TIME',
    baseSalary,
    datePosted: listing.publishedAt || new Date().toISOString(),
    validThrough: listing.deadline,
    jobLocation,
    directApply,
    url: listingUrl,
    skills: skillsString,
    responsibilities: stripHtml(listing.requirements),
    identifier: listing.id
      ? {
          '@type': 'PropertyValue',
          name: 'Listing ID',
          value: listing.id,
        }
      : undefined,
  };

  return schema;
}

/**
 * Generate MonetaryGrant schema for a grant
 */
export function generateMonetaryGrantSchema(
  grant: Pick<
    Grant,
    | 'id'
    | 'title'
    | 'description'
    | 'minReward'
    | 'maxReward'
    | 'token'
    | 'slug'
    | 'sponsor'
    | 'logo'
  > & {
    readonly deadline?: string;
  },
): MonetaryGrantSchema {
  const baseUrl = getURL();

  // Create funder organization from sponsor
  const funder: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: grant.sponsor?.name || 'Anonymous Funder',
    url: grant.sponsor?.slug ? `${baseUrl}s/${grant.sponsor.slug}` : undefined,
    logo: grant.sponsor?.logo,
  };

  // Create grant amount
  let amount: MonetaryAmountSchema | undefined;
  if (grant.token && (grant.minReward || grant.maxReward)) {
    amount = {
      '@type': 'MonetaryAmount',
      currency: grant.token,
      value: {
        '@type': 'QuantitativeValue',
        minValue: grant.minReward,
        maxValue: grant.maxReward,
        unitText: 'TOTAL',
      },
    };
  }

  // Strip HTML tags from description
  const stripHtml = (html?: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const schema: MonetaryGrantSchema = {
    '@context': 'https://schema.org',
    '@type': 'MonetaryGrant',
    name: grant.title || 'Untitled Grant',
    description: stripHtml(grant.description) || 'No description provided',
    funder,
    amount,
    identifier: grant.id,
    applicationDeadline: grant.deadline,
    url: `${baseUrl}grants/${grant.slug}`,
    image: grant.logo || undefined,
  };

  return schema;
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbListSchema(
  items: Array<{ readonly name: string; readonly url?: string }>,
): BreadcrumbListSchema {
  const baseUrl = getURL();

  const itemListElement: BreadcrumbItemSchema[] = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url ? `${baseUrl}${item.url.replace(/^\//, '')}` : undefined,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Generate CollectionPage schema for a skill page
 */
export function generateSkillCollectionSchema(
  skillName: string,
  skillSlug: string,
  description: string,
): CollectionPageSchema {
  const baseUrl = getURL();
  const skillUrl = `${baseUrl}skill/${skillSlug}/`;

  const schema: CollectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${skillName} Opportunities`,
    description,
    url: skillUrl,
    about: {
      '@type': 'Thing',
      name: skillName,
    },
    mainEntity: {
      '@type': 'ItemList',
      name: `${skillName} Bounties and Projects`,
    },
  };

  return schema;
}

export function generateCategoryCollectionSchema(
  categoryName: string,
  categorySlug: string,
  description: string,
): CollectionPageSchema {
  const baseUrl = getURL();
  const categoryUrl = `${baseUrl}category/${categorySlug}/`;

  const schema: CollectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryName} Opportunities`,
    description,
    url: categoryUrl,
    about: {
      '@type': 'Thing',
      name: categoryName,
    },
    mainEntity: {
      '@type': 'ItemList',
      name: `${categoryName} Bounties and Projects`,
    },
  };

  return schema;
}

/**
 * Generate Person schema for a talent profile
 */
interface SuperteamChaptersSchema {
  readonly '@context': string;
  readonly '@graph': readonly OrganizationSchema[];
}

interface SuperteamInput {
  readonly name: string;
  readonly displayValue: string;
  readonly slug: string;
  readonly code: string;
  readonly country: readonly string[];
  readonly icons?: string;
  readonly link?: string;
}

/**
 * Generate Organization schema for all Superteam chapters using @graph pattern
 * Used for SEO on the main homepage to improve discoverability of regional communities
 */
export function generateSuperteamChaptersSchema(
  superteams: readonly SuperteamInput[],
): SuperteamChaptersSchema {
  const baseUrl = getURL();

  const organizations: OrganizationSchema[] = superteams
    .filter((st) => st.link) // Only include chapters with active links
    .map((st) => {
      const sameAs: string[] = [];
      if (st.link) {
        sameAs.push(st.link);
      }

      const areaServed =
        st.code === 'BALKAN' ? st.country.join(', ') : st.country[0] || '';

      return {
        '@context': 'https://schema.org',
        '@type': 'Organization' as const,
        name: st.name,
        url: `${baseUrl}regions/${st.slug}/`,
        logo: st.icons || undefined,
        description: `${st.name} - Solana and Web3 talent community in ${areaServed}. Find crypto bounties, blockchain jobs, and grants.`,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
      };
    });

  return {
    '@context': 'https://schema.org',
    '@graph': organizations,
  };
}

export function generatePersonSchema(person: {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly username?: string;
  readonly photo?: string;
  readonly workPreference?: string | null;
  readonly currentEmployer?: string;
  readonly location?: string;
  readonly skills?: unknown;
  readonly twitter?: string;
  readonly linkedin?: string;
  readonly github?: string;
  readonly website?: string;
}): PersonSchema {
  const baseUrl = getURL();
  const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim();
  const profileUrl = person.username
    ? `${baseUrl}t/${person.username}/`
    : undefined;

  // Build sameAs array from social links
  const sameAs: string[] = [];
  if (person.twitter) {
    sameAs.push(
      person.twitter.startsWith('http')
        ? person.twitter
        : `https://twitter.com/${person.twitter.replace(/^@/, '')}`,
    );
  }
  if (person.linkedin) {
    sameAs.push(
      person.linkedin.startsWith('http')
        ? person.linkedin
        : `https://linkedin.com/in/${person.linkedin}`,
    );
  }
  if (person.github) {
    sameAs.push(
      person.github.startsWith('http')
        ? person.github
        : `https://github.com/${person.github}`,
    );
  }
  if (person.website) {
    sameAs.push(person.website);
  }

  // Extract skills array
  let knowsAbout: string[] | undefined;
  if (person.skills && Array.isArray(person.skills)) {
    const allSkills: string[] = [];
    person.skills.forEach((skillItem: any) => {
      if (skillItem?.skills) {
        allSkills.push(skillItem.skills);
      }
      if (Array.isArray(skillItem?.subskills)) {
        allSkills.push(...skillItem.subskills);
      }
    });
    if (allSkills.length > 0) {
      knowsAbout = allSkills;
    }
  }

  // Create worksFor organization if currentEmployer exists
  let worksFor: OrganizationSchema | undefined;
  if (person.currentEmployer) {
    worksFor = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: person.currentEmployer,
    };
  }

  // Create homeLocation if location exists
  let homeLocation: PlaceSchema | undefined;
  if (person.location) {
    homeLocation = {
      '@type': 'Place',
      name: person.location,
    };
  }

  const schema: PersonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName || 'Talent',
    url: profileUrl,
    image: person.photo
      ? {
          '@type': 'ImageObject',
          url: person.photo,
        }
      : undefined,
    jobTitle: person.workPreference || undefined,
    worksFor,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    homeLocation,
    knowsAbout,
    identifier: person.username
      ? {
          '@type': 'PropertyValue',
          name: 'Username',
          value: person.username,
        }
      : undefined,
  };

  return schema;
}
