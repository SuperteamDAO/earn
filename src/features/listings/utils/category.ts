const CATEGORIES = ['Content', 'Design', 'Development', 'Other'] as const;

export type CategoryType = (typeof CATEGORIES)[number];

interface CategoryInfo {
  readonly name: CategoryType;
  readonly slug: string;
  readonly color: string;
  readonly description: string;
}

const CATEGORY_DATA: Record<CategoryType, Omit<CategoryInfo, 'name'>> = {
  Content: {
    slug: 'content',
    color: '#8B5CF6', // Purple
    description:
      'Explore content creation opportunities on Superteam Earn. Find bounties and projects for writers, storytellers, and content creators in the crypto space.',
  },
  Design: {
    slug: 'design',
    color: '#EC4899', // Pink
    description:
      'Discover design opportunities on Superteam Earn. Find bounties and projects for UI/UX designers, graphic designers, and creative professionals in web3.',
  },
  Development: {
    slug: 'development',
    color: '#3B82F6', // Blue
    description:
      'Find development opportunities on Superteam Earn. Explore bounties and projects for developers, engineers, and technical builders in the crypto ecosystem.',
  },
  Other: {
    slug: 'other',
    color: '#10B981', // Green
    description:
      'Browse other opportunities on Superteam Earn. Find diverse bounties and projects across various specializations in the web3 space.',
  },
};

export function findCategoryBySlug(slug: string): CategoryInfo | null {
  const normalizedSlug = slug.toLowerCase().trim();

  for (const category of CATEGORIES) {
    if (CATEGORY_DATA[category].slug === normalizedSlug) {
      return {
        name: category,
        ...CATEGORY_DATA[category],
      };
    }
  }

  return null;
}

export function getAllCategorySlugs(): readonly string[] {
  return CATEGORIES.map((category) => CATEGORY_DATA[category].slug);
}

export function getCategoryInfo(name: CategoryType): CategoryInfo {
  return {
    name,
    ...CATEGORY_DATA[name],
  };
}
