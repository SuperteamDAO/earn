import { type NextApiRequest, type NextApiResponse } from 'next';

import { createTranche } from '@/features/grants/utils/createTranche';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const grantApplicationId = 'ced1da0d-5137-4c93-831a-e83ad3947767';
  await createTranche({
    applicationId: grantApplicationId,
    isFirstTranche: false,
  });
  res.status(200).json({ message: 'Hello, world!' });
}
