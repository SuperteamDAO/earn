import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface CreateDummySubmissionsRequest {
  listingId: string;
  count: number;
}

interface CreateDummySubmissionsResponse {
  message: string;
  submissions: {
    id: string;
    userId: string;
    listingId: string;
  }[];
}

export const useCreateDummySubmissions = () => {
  return useMutation({
    mutationFn: async (data: CreateDummySubmissionsRequest) => {
      const response = await api.post<CreateDummySubmissionsResponse>(
        '/api/dev-tool/dummy-submissions',
        data,
      );
      return response.data;
    },
    onError: (error) => {
      console.error('Failed to create dummy submissions:', error);
    },
  });
};
