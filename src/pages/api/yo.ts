import { type NextApiRequest, type NextApiResponse } from 'next';

import { createPayment } from '@/features/listings/utils/createPayment';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  await createPayment({ submissionId: 'c51d9cb6-faa8-428d-9f5a-b604a876e3b9' });
  res.status(200).json({ message: 'Hello, world!' });
}
