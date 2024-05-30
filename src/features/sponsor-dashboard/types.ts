export type ScoutRowType = {
  id: string;
  name: string;
  pfp: string | null;
  username: string | null;
  dollarsEarned: number;
  score: number;
  skills: string[];
  recommended: boolean;
  invited: boolean;
  userId: string;
};
