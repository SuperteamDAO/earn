# #1354 Implementation Plan - Add Country Logo to Region Locked Tracks

## Problem
- All tracks are shown to users even if region-locked
- Hard to tell which tracks are eligible at a glance
- Users need to go through all tracks to check eligibility

## Solution
Display country flag logo on tracks that are region-locked.

## Files to Modify

### 1. ListingCard Component
**File:** `src/features/listings/components/ListingCard.tsx`

**Changes:**
- Add flag icon display when `region` field is present
- Use `countries` array from `src/constants/country.ts` to get flag path
- Display flag next to sponsor name or type

### 2. CSS/Styling
- Add small flag icon (16x16 or 20x20)
- Position next to track type badge

## Implementation Steps

1. Import `countries` from constants
2. Find country by region name
3. Display flag icon if region exists
4. Add tooltip showing region name

## Code Changes

```tsx
// In ListingCard.tsx
import { countries } from '@/constants/country';

// Find country code by region name
const getCountryCode = (regionName?: string) => {
  if (!regionName) return null;
  const country = countries.find(c => 
    c.name.toLowerCase().includes(regionName.toLowerCase())
  );
  return country?.code || null;
};

// In the component render
{region && (
  <img 
    src={`/flags/1x1/${getCountryCode(region)}.svg`}
    alt={region}
    className="h-4 w-4 rounded-full"
    title={`Region: ${region}`}
  />
)}
```

## Testing
- Verify flag displays for region-locked tracks
- Verify no flag for global tracks
- Check mobile responsiveness
