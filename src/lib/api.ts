import axios from 'axios';
import { signOut } from 'next-auth/react';

const api = axios.create();

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut({
        redirect: true,
        callbackUrl: '/auth/signin',
      });
    }
    return Promise.reject(error);
  },
);

export { api };
