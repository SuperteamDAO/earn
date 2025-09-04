import { type NextApiRequest, type NextApiResponse } from 'next';

import { createPayment } from '@/features/listings/utils/createPayment';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  await createPayment({ submissionId: '2725028e-c471-4bc8-b7dd-a083425c371f' });
  res.status(200).json({ message: 'Hello, world!' });
}
