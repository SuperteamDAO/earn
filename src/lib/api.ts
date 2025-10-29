'use client';
import { getAccessToken } from '@privy-io/react-auth';
import axios from 'axios';

const api = axios.create();

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const currentPath = window.location.pathname;
//     localStorage.setItem('loginRedirectPath', currentPath);

//     await signOut({
//       redirect: true,
//       callbackUrl: '/signin',
//     });
//     return Promise.reject(error);
//   },
// );

api.interceptors.request.use(
  async (config) => {
    const isPrivyInitializing =
      typeof window !== 'undefined' && (window as any).__privyInitializing;

    let authToken = await getAccessToken();
    if (!authToken && isPrivyInitializing) {
      for (let i = 0; i < 2 && !authToken; i++) {
        await new Promise((r) => setTimeout(r, 80));
        authToken = await getAccessToken();
      }
    }

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      config.headers['privy-app-id'] = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export { api };
