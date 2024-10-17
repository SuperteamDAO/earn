import { createHandler } from '@premieroctet/next-admin/pageHandler';

import { prisma } from '@/prisma';
import schema from '@/prisma/json-schema/json-schema.json';
import { options } from '@/lib/nextAdminOptions';

export const config = {
  api: {
    bodyParser: false,
  },
};

const { run } = createHandler({
  apiBasePath: '/api/admin',
  prisma,
  schema: schema,
  options,
});

export default run;
