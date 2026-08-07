import { getLiveListingsCutoffDate, filterAgentEligibleListings } from './live-filter';

describe('Live Agent Listings Cutoff & Filtering', () => {
  it('should default cutoff to start of current UTC date when deadline omitted', () => {
    const cutoff = getLiveListingsCutoffDate();
    expect(cutoff.getUTCHours()).toBe(0);
    expect(cutoff.getUTCMinutes()).toBe(0);
    expect(cutoff.getUTCSeconds()).toBe(0);
  });

  it('should include both AGENT_ALLOWED and AGENT_ONLY listings', () => {
    const cutoff = new Date('2026-08-01T00:00:00.000Z');
    const mockListings = [
      { id: '1', agentAccess: 'AGENT_ALLOWED', status: 'OPEN', deadline: '2026-08-28T21:59:59.000Z' },
      { id: '2', agentAccess: 'AGENT_ONLY', status: 'OPEN', deadline: '2026-08-15T00:00:00.000Z' },
      { id: '3', agentAccess: 'NONE', status: 'OPEN', deadline: '2026-08-28T21:59:59.000Z' }
    ];

    const result = filterAgentEligibleListings(mockListings, cutoff);
    expect(result.length).toBe(2);
    expect(result.map(r => r.id)).toEqual(['1', '2']);
  });
});
