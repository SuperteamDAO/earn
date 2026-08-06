/**
 * Detects whether a Sumsub rejection is ONLY due to the
 * "Main doc country" regulation (passport country doesn't match listing region).
 *
 * Sumsub uses:
 *   rejectLabels: ["REGULATIONS_VIOLATIONS", ...]
 *   buttonIds: ["regulationsViolations", "regulationsViolations_mainDocCountry"]
 *
 * Returns true only when the sole rejection reason is the country regulation,
 * meaning identity and liveness checks already passed.
 */
export const isMainDocCountryRejection = (result: {
  status: 'failed';
  reason: string;
  rejectType?: string;
  rejectLabels?: string[];
  buttonIds?: string[];
}): boolean => {
  if (!result.buttonIds || result.buttonIds.length === 0) {
    return false;
  }

  if (!result.rejectLabels || result.rejectLabels.length === 0) {
    return false;
  }

  const hasMainDocCountry = result.buttonIds.some(
    (id) => id.toLowerCase() === 'regulationsviolations_maindoccountry',
  );

  if (!hasMainDocCountry) {
    return false;
  }

  // Ensure ONLY REGULATIONS_VIOLATIONS is present in rejectLabels
  // If there are other labels (FORGERY, DUPLICATE, etc.), don't override
  const hasOnlyRegulationLabels = result.rejectLabels.every(
    (label) => label === 'REGULATIONS_VIOLATIONS',
  );

  if (!hasOnlyRegulationLabels) {
    return false;
  }

  // Ensure "Main doc country" is the ONLY specific regulation violation
  // Other regulation sub-types (age, duplicate, etc.) should block override
  const specificRegulationIds = result.buttonIds.filter((id) =>
    id.toLowerCase().startsWith('regulationsviolations_'),
  );

  return (
    specificRegulationIds.length === 1 &&
    specificRegulationIds[0]!.toLowerCase() ===
      'regulationsviolations_maindoccountry'
  );
};
