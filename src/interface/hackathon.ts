export interface TrackProps {
  title: string;
  slug: string;
  sponsor: {
    name: string;
    logo: string;
    st: boolean;
  };
  token: string;
  rewardAmount: number;
}
