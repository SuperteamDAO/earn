import { buildAgentListingsFilter } from './live_filter';

describe('Agent Listings Filter Builder', () => {
  it('should include AGENT_ALLOWED and default to current date floor', () => {
    const filter = buildAgentListingsFilter({});
    expect(filter.where.agentAccess.in).toContain('AGENT_ALLOWED');
    expect(filter.where.status).toBe('OPEN');
    expect(filter.where.deadline.gte).toBeInstanceOf(Date);
  });

  it('should throw clear error on invalid deadline', () => {
    expect(() => buildAgentListingsFilter({ deadline: 'invalid-date' })).toThrow('Invalid ISO-8601');
  });
});
