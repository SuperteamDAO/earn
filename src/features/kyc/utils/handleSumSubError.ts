import axios from 'axios';

export const handleSumSubError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    throw new Error('Sumsub: Invalid credentials');
  }
  throw new Error(
    `Sumsub: ${error instanceof Error ? error.message : 'Failed to process request'}`,
  );
};
