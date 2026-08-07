export function getLiveListingsCutoffDate(customDeadline?: string): Date {
  if (customDeadline) {
    const parsed = new Date(customDeadline);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

export function filterAgentEligibleListings(listings: any[], cutoffDate: Date) {
  return listings.filter((item) => {
    const isAgentAllowed = item.agentAccess === "AGENT_ALLOWED" || item.agentAccess === "AGENT_ONLY";
    const isOpen = item.status === "OPEN";
    const isNotExpired = item.deadline ? new Date(item.deadline) >= cutoffDate : true;
    return isAgentAllowed && isOpen && isNotExpired;
  });
}
