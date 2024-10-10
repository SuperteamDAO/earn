import { type GrantApplication } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchUserApplication = async (grantId: string) => {
  const response = await axios.get<GrantApplication>(
    '/api/grant-application/get',
    {
      params: { id: grantId },
    },
  );
  return response.data;
};

export const userApplicationQuery = (id: string) =>
  queryOptions({
    queryKey: ['userApplication', id],
    queryFn: () => fetchUserApplication(id),
    retry: false,
  });
