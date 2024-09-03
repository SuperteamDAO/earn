export interface TrackProps {
  title: string;
  slug: string;
  sponsor: {
    name: string;
    logo: string;
  };
  token: string;
  rewardAmount: number;
}
