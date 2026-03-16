import { countries } from '@/constants/country';

const CANONICAL_ALIASES: Readonly<Record<string, string>> = {
  eu: 'European Union',
  gcc: 'Gulf Cooperation Council',
  global: 'Global',
  ireland: 'Ireland',
  'ireland (ni and roi)': 'Ireland',
  'ireland (open ni and roi)': 'Ireland',
  uae: 'United Arab Emirates',
  uk: 'United Kingdom',
  us: 'United States',
  usa: 'United States',
};

function normalizeRegionKey(value: string): string {
  return value.trim().toLowerCase();
}

export function canonicalizeRegionValue(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  const normalizedValue = normalizeRegionKey(trimmedValue);
  const aliasedValue = CANONICAL_ALIASES[normalizedValue];
  if (aliasedValue) {
    return aliasedValue;
  }

  const matchingCountry = countries.find((country) => {
    const countryName = normalizeRegionKey(country.name);
    const displayValue =
      typeof country.displayValue === 'string'
        ? normalizeRegionKey(country.displayValue)
        : null;

    return countryName === normalizedValue || displayValue === normalizedValue;
  });

  return matchingCountry?.name || trimmedValue;
}
