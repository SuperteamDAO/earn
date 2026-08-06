import { buildAgentListingsFilter } from './live-filter';

describe('Agent Listings Filter Builder', () => {
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    // Freeze time deterministically to 2026-08-06T12:00:00.000Z
    const fixedNow = new Date('2026-08-06T12:00:00.000Z');
    dateSpy = jest.spyOn(global, 'Date').mockImplementation((...args) => {
      if (args.length === 0) return fixedNow;
      // @ts-expect-error - Standard mock Date constructor forwarding
      return new (Reflect.construct(Date, args, Date))();
    });
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it('should include AGENT_ALLOWED and AGENT_ONLY and default to start-of-day UTC cutoff', () => {
    const filter = buildAgentListingsFilter({});
    expect(filter.where.agentAccess.in).toEqual(['AGENT_ONLY', 'AGENT_ALLOWED']);
    expect(filter.where.status).toBe('OPEN');
    expect(filter.take).toBe(10);
    expect(filter.skip).toBe(0);
    
    const expectedUTCStart = new Date(Date.UTC(2026, 7, 6));
    expect(filter.where.deadline.gte.getTime()).toBe(expectedUTCStart.getTime());
  });

  it('should cap take parameter at 50', () => {
    const filter = buildAgentListingsFilter({ take: 100, skip: 5 });
    expect(filter.take).toBe(50);
    expect(filter.skip).toBe(5);
  });

  it('should reject explicitly empty deadline strings', () => {
    expect(() => buildAgentListingsFilter({ deadline: '' })).toThrow('Invalid ISO-8601');
  });

  it('should throw clear error on invalid deadline string', () => {
    expect(() => buildAgentListingsFilter({ deadline: 'invalid-date' })).toThrow('Invalid ISO-8601');
  });
});
