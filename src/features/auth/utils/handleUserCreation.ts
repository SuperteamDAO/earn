import { api } from '@/lib/api';

const BASE_PATH = '/earn';
const allowedNewUserRedirections = ['/signup', '/new/sponsor'];

const stripBasePath = (pathname: string): string => {
  if (pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length) || '/';
  }
  return pathname;
};

interface CreateUserResponse {
  message: string;
  created: boolean;
}

export async function handleUserCreation(email: string): Promise<boolean> {
  try {
    const response = await api.post<CreateUserResponse>('/api/user/create', {
      email,
    });

    const { created } = response.data;

    if (created) {
      const pathname = stripBasePath(window.location.pathname);
      if (allowedNewUserRedirections?.some((s) => pathname.startsWith(s))) {
        window.location.reload();
      }
    }

    return true;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.error(
        'User exists with different authentication method:',
        error.response.data.error,
      );
      return false;
    }

    console.error('Error handling user creation:', error);
    return false;
  }
}
