// A hackathon page's numbers, as /api/hackathon/public-stats answers.
export interface Stats {
  totalRewardAmount: number;
  totalListings: number;
  deadline: string;
  startDate: string;
  announceDate: string;
}
