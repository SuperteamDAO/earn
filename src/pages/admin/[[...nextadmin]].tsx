import { NextAdmin } from '@premieroctet/next-admin';
import { getNextAdminProps } from '@premieroctet/next-admin/pageRouter';
import type { AdminComponentProps } from '@premieroctet/next-admin';
import type { GetServerSideProps } from 'next';

import { options } from '@/lib/nextAdminOptions';
import { prisma } from '@/prisma';
import schema from '@/prisma/json-schema/json-schema.json';

export default function Admin(props: AdminComponentProps) {
  return <NextAdmin {...props} options={options} />;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) =>
  await getNextAdminProps({
    basePath: '/admin',
    apiBasePath: '/api/admin',
    prisma,
    schema,
    options,
    req,
  });