export interface AgentListingFilterQuery {
  deadline?: string;
  take?: number;
  skip?: number;
}

export function buildAgentListingsFilter(query: AgentListingFilterQuery) {
  const take = query.take && query.take > 0 ? query.take : 50;
  const skip = query.skip && query.skip >= 0 ? query.skip : 0;
  
  let deadlineFloor: Date;
  if (query.deadline) {
    const parsed = new Date(query.deadline);
    if (isNaN(parsed.getTime())) {
      throw new Error("Invalid ISO-8601 deadline parameter");
    }
    deadlineFloor = parsed;
  } else {
    deadlineFloor = new Date();
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
    take,
    skip
  };
}
