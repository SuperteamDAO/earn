export interface TrackProps {
  title: string;
  slug: string;
  sponsor: {
    name: string;
    logo: string;
    chapter?: {
      id: string;
      code: string | undefined;
      name: string | undefined;
    } | null;
  };
  token: string;
  rewardAmount: number;
}
