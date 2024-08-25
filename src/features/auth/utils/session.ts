import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { getServerSession as gss } from 'next-auth';

import { authOptions } from '@/pages/api/auth/[...nextauth]';

export function getServerSession(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return gss(...args, authOptions);
}
