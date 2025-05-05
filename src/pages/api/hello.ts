import type { NextApiResponse } from 'next';

type Data = {
  message: string;
};

export default function handler(res: NextApiResponse<Data>) {
  res.status(200).json({ message: 'Welcome to our professional platform' });
}
