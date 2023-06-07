import type { NextApiRequest, NextApiResponse } from 'next';

import { client } from '@/utils/sendgrid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, firstname, lastname } = req.body;
  try {
    const clientRes = await client.request({
      method: 'PUT',
      url: '/v3/marketing/contacts',
      body: {
        contacts: [
          {
            email,
            first_name: firstname,
            last_name: lastname,
          },
        ],
      },
    });

    return res.status(200).send({ clientRes });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
