import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { redis } from '../../utils/functions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('updateSearch', req.method);

  if (req.method === 'POST') {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings/search/update`
      );
      const resAll = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings/all`
      );
      await redis.set('bounties', JSON.stringify(resAll.data.data.bounties));
      await redis.set('grants', JSON.stringify(resAll.data.data.grants));
      await redis.set('jobs', JSON.stringify(resAll.data.data.jobs));
      await redis.set(
        'basicInfo',
        JSON.stringify({
          total: resAll.data.data.total,
          count: resAll.data.data.count,
        })
      );
      return res.status(200).send('updated');
    } catch (error) {
      console.log(error);

      return res.status(500).send('error');
    }
  } else {
    return res.status(404).json({ message: 'Not found' });
  }
}
