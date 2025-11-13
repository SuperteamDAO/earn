import { countries } from '@/constants/country';
import { Superteams } from '@/constants/Superteam';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getSuperteamCodes(): readonly string[] {
  return Superteams.map((st) => st.code.toUpperCase());
}

export function getEligibleCountries() {
  const superteamCodes = getSuperteamCodes();

  return countries.filter((country) => {
    if (country.iso === true) {
      const countryCodeUpper = country.code.toUpperCase();
      return !superteamCodes.includes(countryCodeUpper);
    }

    if (country.region === true) {
      return true;
    }

    return false;
  });
}

export function findCountryBySlug(slug: string) {
  const normalizedSlug = slug.toLowerCase();

  const superteam = Superteams.find(
    (st) => st.slug?.toLowerCase() === normalizedSlug,
  );
  if (superteam) {
    return null;
  }

  const eligibleCountries = getEligibleCountries();
  return (
    eligibleCountries.find((country) => {
      const countrySlug = generateSlug(country.name);
      return countrySlug === normalizedSlug;
    }) || null
  );
}

export function getAllRegionSlugs(): readonly string[] {
  const superteamSlugs = Superteams.map((st) => st.slug).filter(
    (slug): slug is string => typeof slug === 'string',
  );

  const eligibleCountries = getEligibleCountries();
  const countrySlugs = eligibleCountries.map((country) =>
    generateSlug(country.name),
  );

  return [...superteamSlugs, ...countrySlugs];
}
