import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + '/listings/search/update'
      );
      return res.status(200).send('updated');
    } catch (error) {
      console.log(error);

      return res.status(500).send('error');
    }
  } else {
    res.status(404).json({ message: 'Not found' });
  }
}
