/**
 * Represents the raw query parameters passed to the agent listings live endpoint.
 */
export interface AgentListingFilterQuery {
  /** Optional ISO-8601 deadline string. */
  readonly deadline?: string | undefined;
  /** Optional pagination limit. */
  readonly take?: number | undefined;
  /** Optional pagination offset. */
  readonly skip?: number | undefined;
}

/**
 * Concrete return structure for Prisma query options.
 */
export interface AgentListingFilterResult {
  readonly where: {
    readonly agentAccess: {
      readonly in: readonly ["AGENT_ONLY", "AGENT_ALLOWED"];
    };
    readonly status: "OPEN";
    readonly deadline: {
      readonly gte: Date;
    };
  };
  readonly take: number;
  readonly skip: number;
}

/**
 * Builds Prisma query filter options for live agent listings.
 * 
 * @param query - Input query options containing optional deadline, take, and skip.
 * @returns Built filter options for Prisma query.
 * @throws Error if deadline parameter is explicitly empty or an invalid ISO-8601 string.
 */
export function buildAgentListingsFilter(query: AgentListingFilterQuery): AgentListingFilterResult {
  const parsedTake = typeof query.take === 'number' && Number.isFinite(query.take) && query.take > 0
    ? Math.min(Math.floor(query.take), 50)
    : 10;
    
  const parsedSkip = typeof query.skip === 'number' && Number.isFinite(query.skip) && query.skip >= 0
    ? Math.floor(query.skip)
    : 0;

  let deadlineFloor: Date;

  if (query.deadline !== undefined) {
    if (typeof query.deadline !== 'string' || query.deadline.trim() === '') {
      throw new Error("Invalid ISO-8601 deadline parameter");
    }
    const parsed = new Date(query.deadline);
    if (isNaN(parsed.getTime())) {
      throw new Error("Invalid ISO-8601 deadline parameter");
    }
    deadlineFloor = parsed;
  } else {
    const now = new Date();
    deadlineFloor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  return {
    where: {
      agentAccess: {
        in: ["AGENT_ONLY", "AGENT_ALLOWED"]
      },
      status: "OPEN",
      deadline: {
        gte: deadlineFloor
      }
    },
    take: parsedTake,
    skip: parsedSkip
  };
}
