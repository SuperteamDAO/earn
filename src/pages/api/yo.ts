import { type NextApiRequest, type NextApiResponse } from 'next';

import { createPayment } from '@/features/listings/utils/createPayment';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  await createPayment({ submissionId: 'ff260932-bfbb-477e-a8e3-e8818465e49d' });
  res.status(200).json({ message: 'Hello, world!' });
}
