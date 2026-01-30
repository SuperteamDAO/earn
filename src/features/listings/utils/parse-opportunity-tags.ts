import { countries } from '@/constants/country';

import { findCategoryBySlug, getAllCategorySlugs } from './category';
import { generateSlug, getAllRegionSlugs } from './region';
import { findSkillBySlug, getAllSkillSlugs } from './skill';

const OPPORTUNITY_TYPES = ['bounties', 'projects', 'grants'] as const;
type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export interface ParsedOpportunityTags {
  readonly region?: string;
  readonly skill?: string;
  readonly category?: string;
  readonly type?: OpportunityType;
}

/**
 * Get multi-country regions (where region: true) from the countries list
 */
function getMultiCountryRegions() {
  return countries.filter(
    (c): c is typeof c & { region: true; displayValue?: string } =>
      'region' in c && c.region === true,
  );
}

/**
 * Build alias map from multi-country regions: code -> full slug
 * e.g., 'eu' -> 'european-union', 'gcc' -> 'gulf-cooperation-council'
 */
function buildMultiCountryRegionAliases(): Record<string, string> {
  const aliases: Record<string, string> = {};
  for (const region of getMultiCountryRegions()) {
    const fullSlug = generateSlug(region.name);
    const codeSlug = region.code.toLowerCase();
    // Map code to full slug
    aliases[codeSlug] = fullSlug;
    // Also map full slug to itself for normalization
    aliases[fullSlug] = fullSlug;
  }
  return aliases;
}

/**
 * Build display name map from multi-country regions: full slug -> display name
 * e.g., 'european-union' -> 'EU', 'gulf-cooperation-council' -> 'GCC'
 */
function buildMultiCountryRegionDisplayNames(): Record<string, string> {
  const displayNames: Record<string, string> = {};
  for (const region of getMultiCountryRegions()) {
    const fullSlug = generateSlug(region.name);
    // Use displayValue if available, otherwise use name
    displayNames[fullSlug] = region.displayValue || region.name;
  }
  return displayNames;
}

// Lazily initialized caches
let multiCountryRegionAliases: Record<string, string> | null = null;
let multiCountryRegionDisplayNames: Record<string, string> | null = null;

function getMultiCountryRegionAliases(): Record<string, string> {
  if (!multiCountryRegionAliases) {
    multiCountryRegionAliases = buildMultiCountryRegionAliases();
  }
  return multiCountryRegionAliases;
}

function getMultiCountryRegionDisplayNames(): Record<string, string> {
  if (!multiCountryRegionDisplayNames) {
    multiCountryRegionDisplayNames = buildMultiCountryRegionDisplayNames();
  }
  return multiCountryRegionDisplayNames;
}

/**
 * Get display name for a region, handling multi-country regions specially
 */
function getRegionDisplayName(regionSlug: string): string {
  const normalized = normalizeRegionSlug(regionSlug);
  const displayName = getMultiCountryRegionDisplayNames()[normalized];
  if (displayName) {
    return displayName;
  }
  // Capitalize first letter for regular regions
  return regionSlug.charAt(0).toUpperCase() + regionSlug.slice(1);
}

let regionSlugsSet: Set<string> | null = null;
let skillSlugsSet: Set<string> | null = null;
let categorySlugsSet: Set<string> | null = null;

function getRegionSlugsSet(): Set<string> {
  if (!regionSlugsSet) {
    const slugs = getAllRegionSlugs().map((s) => s.toLowerCase());
    // Add multi-country region aliases (e.g., 'eu', 'gcc')
    const aliases = Object.keys(getMultiCountryRegionAliases());
    regionSlugsSet = new Set([...slugs, ...aliases]);
  }
  return regionSlugsSet;
}

function getSkillSlugsSet(): Set<string> {
  if (!skillSlugsSet) {
    skillSlugsSet = new Set(getAllSkillSlugs().map((s) => s.toLowerCase()));
  }
  return skillSlugsSet;
}

function getCategorySlugsSet(): Set<string> {
  if (!categorySlugsSet) {
    categorySlugsSet = new Set(
      getAllCategorySlugs().map((s) => s.toLowerCase()),
    );
  }
  return categorySlugsSet;
}

function isOpportunityType(segment: string): segment is OpportunityType {
  return OPPORTUNITY_TYPES.includes(segment as OpportunityType);
}

function isRegion(segment: string): boolean {
  return getRegionSlugsSet().has(segment.toLowerCase());
}

/**
 * Normalize region slug - converts aliases to canonical slugs
 */
function normalizeRegionSlug(segment: string): string {
  const lower = segment.toLowerCase();
  return getMultiCountryRegionAliases()[lower] || lower;
}

function isCategory(segment: string): boolean {
  return getCategorySlugsSet().has(segment.toLowerCase());
}

function isSkill(segment: string): boolean {
  return getSkillSlugsSet().has(segment.toLowerCase());
}

export function parseOpportunityTags(
  slugs: string[] | undefined,
): ParsedOpportunityTags {
  if (!slugs || slugs.length === 0) {
    return {};
  }

  const allSegments = slugs
    .join('-')
    .toLowerCase()
    .split('-')
    .filter((s) => s.length > 0);

  const result: {
    region?: string;
    skill?: string;
    category?: string;
    type?: OpportunityType;
  } = {};

  for (const segment of allSegments) {
    if (!result.type && isOpportunityType(segment)) {
      result.type = segment;
      continue;
    }

    if (!result.region && isRegion(segment)) {
      // Normalize aliases like 'eu' -> 'european-union'
      result.region = normalizeRegionSlug(segment);
      continue;
    }

    if (!result.category && isCategory(segment)) {
      result.category = segment;
      continue;
    }

    if (!result.skill && isSkill(segment)) {
      result.skill = segment;
      continue;
    }
  }

  return result;
}

export function validateOpportunityTags(slugs: string[] | undefined): boolean {
  if (!slugs || slugs.length === 0) {
    return true;
  }

  const allSegments = slugs
    .join('-')
    .toLowerCase()
    .split('-')
    .filter((s) => s.length > 0);

  for (const segment of allSegments) {
    const isValid =
      isOpportunityType(segment) ||
      isRegion(segment) ||
      isCategory(segment) ||
      isSkill(segment);

    if (!isValid) {
      return false;
    }
  }

  return true;
}

export function generateCanonicalSlug(tags: ParsedOpportunityTags): string {
  const parts: string[] = [];

  if (tags.region) parts.push(tags.region);
  if (tags.category) parts.push(tags.category);
  if (tags.skill) parts.push(tags.skill);
  if (tags.type) parts.push(tags.type);

  return parts.join('-');
}

export function getOpportunityDisplayName(tags: ParsedOpportunityTags): string {
  const parts: string[] = [];

  if (tags.skill) {
    const skillInfo = findSkillBySlug(tags.skill);
    if (skillInfo) {
      parts.push(skillInfo.name);
    }
  }

  if (tags.category) {
    const categoryInfo = findCategoryBySlug(tags.category);
    if (categoryInfo) {
      parts.push(categoryInfo.name);
    }
  }

  if (tags.type) {
    const typeDisplay = tags.type.charAt(0).toUpperCase() + tags.type.slice(1);
    parts.push(typeDisplay);
  } else {
    parts.push('Opportunities');
  }

  if (tags.region && tags.region.toLowerCase() !== 'global') {
    const regionDisplay = getRegionDisplayName(tags.region);
    return `${parts.join(' ')} in ${regionDisplay}`;
  }

  return parts.join(' ');
}

/**
 * Generate SEO-friendly description based on tag combination
 * Uses consistent sentence structure with keywords: web3, crypto, Solana, Superteam Earn
 */
export function getOpportunityDescription(tags: ParsedOpportunityTags): string {
  const skillName = tags.skill ? findSkillBySlug(tags.skill)?.name : undefined;
  const categoryName = tags.category
    ? findCategoryBySlug(tags.category)?.name
    : undefined;
  const regionName =
    tags.region && tags.region.toLowerCase() !== 'global'
      ? getRegionDisplayName(tags.region)
      : undefined;

  const typeLabel = tags.type
    ? tags.type.charAt(0).toUpperCase() + tags.type.slice(1)
    : undefined;

  const hasSkill = !!skillName;
  const hasCategory = !!categoryName;
  const hasRegion = !!regionName;
  const hasType = !!typeLabel;

  // Single tag cases
  if (hasSkill && !hasCategory && !hasRegion && !hasType) {
    return `Find top ${skillName} opportunities in web3 — explore remote Solana bounties, grants, and projects on Superteam Earn`;
  }

  if (!hasSkill && !hasCategory && hasRegion && !hasType) {
    return `Explore ${regionName}'s best remote web3 bounties, projects and grants — earn crypto by working on real Solana projects through Superteam Earn`;
  }

  if (!hasSkill && !hasCategory && !hasRegion && hasType) {
    return `Find top remote web3 ${typeLabel.toLowerCase()} on Solana — earn crypto for your skills through Superteam Earn`;
  }

  if (!hasSkill && hasCategory && !hasRegion && !hasType) {
    return `Find top ${categoryName} opportunities in web3 — explore remote Solana bounties, grants, and projects on Superteam Earn`;
  }

  // Two tag combinations
  if (hasSkill && hasRegion && !hasType && !hasCategory) {
    return `Find top remote ${skillName} opportunities in ${regionName} — explore Solana bounties, grants, and projects on Superteam Earn`;
  }

  if (hasSkill && hasType && !hasRegion && !hasCategory) {
    return `Find top remote ${skillName} ${typeLabel.toLowerCase()} in web3 — get paid in crypto for your Solana skills on Superteam Earn`;
  }

  if (hasSkill && hasCategory && !hasRegion && !hasType) {
    return `Find top remote ${skillName} ${categoryName?.toLowerCase()} opportunities in web3 — explore Solana bounties, grants, and projects on Superteam Earn`;
  }

  if (hasRegion && hasType && !hasSkill && !hasCategory) {
    return `Find top remote web3 ${typeLabel.toLowerCase()} in ${regionName} — earn crypto by working on real Solana projects through Superteam Earn`;
  }

  if (hasRegion && hasCategory && !hasSkill && !hasType) {
    return `Explore ${regionName}'s best remote web3 ${categoryName?.toLowerCase()} bounties, projects and grants — earn crypto by working on real Solana projects through Superteam Earn`;
  }

  if (hasType && hasCategory && !hasSkill && !hasRegion) {
    return `Find top remote web3 ${categoryName?.toLowerCase()} ${typeLabel.toLowerCase()} on Solana — earn crypto for your skills through Superteam Earn`;
  }

  // Three tag combinations
  if (hasSkill && hasRegion && hasType && !hasCategory) {
    return `Find top remote ${skillName} crypto ${typeLabel.toLowerCase()} in ${regionName} — work remotely on real Solana projects through Superteam Earn`;
  }

  if (hasSkill && hasRegion && hasCategory && !hasType) {
    return `Find top remote ${skillName} ${categoryName?.toLowerCase()} opportunities in ${regionName} — explore Solana bounties, grants, and projects on Superteam Earn`;
  }

  if (hasSkill && hasType && hasCategory && !hasRegion) {
    return `Find top remote ${skillName} ${categoryName?.toLowerCase()} ${typeLabel.toLowerCase()} in web3 — get paid in crypto for your Solana skills on Superteam Earn`;
  }

  if (hasRegion && hasType && hasCategory && !hasSkill) {
    return `Find top remote web3 ${categoryName?.toLowerCase()} ${typeLabel.toLowerCase()} in ${regionName} — earn crypto by working on real Solana projects through Superteam Earn`;
  }

  // Four tag combination (all tags)
  if (hasSkill && hasRegion && hasType && hasCategory) {
    return `Find top remote ${skillName} ${categoryName?.toLowerCase()} crypto ${typeLabel.toLowerCase()} in ${regionName} — work remotely on real Solana projects through Superteam Earn`;
  }

  // Fallback (no tags or just global)
  return `Find top remote web3 opportunities — explore Solana bounties, grants, and projects to earn crypto through Superteam Earn`;
}

export function getCategoryNameFromTags(
  tags: ParsedOpportunityTags,
): string | undefined {
  if (!tags.category) return undefined;

  const categoryInfo = findCategoryBySlug(tags.category);
  return categoryInfo?.name;
}

export function getSkillNameFromTags(
  tags: ParsedOpportunityTags,
): string | undefined {
  if (!tags.skill) return undefined;

  const skillInfo = findSkillBySlug(tags.skill);
  return skillInfo?.name;
}

export function getRegionNameFromTags(
  tags: ParsedOpportunityTags,
): string | undefined {
  if (!tags.region) return undefined;

  return tags.region;
}

/**
 * Build slug to country name map from multi-country regions
 * Maps slugs like 'european-union' -> 'European Union'
 */
function buildSlugToCountryNameMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const region of getMultiCountryRegions()) {
    const fullSlug = generateSlug(region.name);
    map[fullSlug] = region.name;
  }
  return map;
}

let slugToCountryNameMap: Record<string, string> | null = null;

function getSlugToCountryNameMap(): Record<string, string> {
  if (!slugToCountryNameMap) {
    slugToCountryNameMap = buildSlugToCountryNameMap();
  }
  return slugToCountryNameMap;
}

export function getCountryNameFromSlug(slug: string): string {
  const normalized = normalizeRegionSlug(slug);
  const countryName = getSlugToCountryNameMap()[normalized];
  if (countryName) {
    return countryName;
  }
  // Capitalize first letter for regular regions
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}
