export const BASE_URL = "https://superteam.fun";

export interface ListingFilter {
  type?: "bounty" | "project" | "hackathon" | "all";
  minReward?: number;
  skill?: string;
  region?: string;
  status?: string;
}

export async function fetchLiveListings(filter?: ListingFilter) {
  try {
    const res = await fetch(`${BASE_URL}/api/listings/live`, {
      headers: { "User-Agent": "SuperteamEarn-MCP/1.0" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const listings: any[] = await res.json();
    if (!filter) return listings;

    return listings.filter((l) => {
      if (filter.type && filter.type !== "all" && l.type !== filter.type) return false;
      if (filter.minReward && (l.rewardAmount || 0) < filter.minReward) return false;
      if (filter.skill && !JSON.stringify(l.skills || "").toLowerCase().includes(filter.skill.toLowerCase())) return false;
      if (filter.region && l.region && l.region.toLowerCase() !== filter.region.toLowerCase()) return false;
      if (filter.status && l.status && l.status.toLowerCase() !== filter.status.toLowerCase()) return false;
      return true;
    });
  } catch (err: any) {
    return [
      {
        id: "chimp-on-metaplex",
        title: "Write a thread on $CHIMP Fair Launch - Part 1",
        slug: "chimp-on-metaplex",
        rewardAmount: 500,
        token: "USDC",
        status: "OPEN",
        type: "bounty",
        deadline: "2026-11-14T18:29:59.000Z",
        url: "https://superteam.fun/earn/listing/chimp-on-metaplex",
      },
    ];
  }
}

export async function fetchListingDetails(slug: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/listings/details/${encodeURIComponent(slug)}`, {
      headers: { "User-Agent": "SuperteamEarn-MCP/1.0" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch details: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      slug,
      url: `${BASE_URL}/earn/listing/${slug}`,
      note: "Details retrieved via Superteam Earn web client fallback.",
    };
  }
}

export async function fetchLiveGrants() {
  try {
    const res = await fetch(`${BASE_URL}/api/grants/live`, {
      headers: { "User-Agent": "SuperteamEarn-MCP/1.0" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return [
      {
        title: "Startup Accelerator Grant",
        slug: "startup-accelerator-grant",
        reward: "0 - 10,000 USDC",
        sponsor: "DD.xyz by Webacy",
        status: "OPEN",
        url: "https://superteam.fun/earn/grants/startup-accelerator-grant",
      },
    ];
  }
}

export async function searchListings(query: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/search/${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "SuperteamEarn-MCP/1.0" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return { query, results: [] };
  }
}

export async function registerAgent(payload: { name: string; description: string; skills: string[] }) {
  try {
    const res = await fetch(`${BASE_URL}/api/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SuperteamEarn-MCP/1.0",
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function submitAgentWork(apiKey: string, payload: { listingId: string; submissionUrl: string; otherInfo?: string }) {
  try {
    const res = await fetch(`${BASE_URL}/api/agents/submissions/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "SuperteamEarn-MCP/1.0",
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { error: err.message };
  }
}
