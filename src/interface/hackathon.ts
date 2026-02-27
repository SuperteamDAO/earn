export interface TrackProps {
  title: string;
  slug: string;
  sponsor: {
    name: string;
    logo: string;
    chapter?: {
      id: string;
    } | null;
  };
  token: string;
  rewardAmount: number;
}
