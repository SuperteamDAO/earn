import axios from 'axios';
import { signOut } from 'next-auth/react';

const api = axios.create();

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const currentPath = window.location.pathname;
    localStorage.setItem('loginRedirectPath', currentPath);

    await signOut({
      redirect: true,
      callbackUrl: '/signin',
    });
    return Promise.reject(error);
  },
);

export { api };
