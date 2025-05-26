import { api } from '@/lib/api';

const allowedNewUserRedirections = ['/signup', '/new/sponsor'];

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
      if (
        allowedNewUserRedirections?.some((s) =>
          window.location.pathname.startsWith(s),
        )
      ) {
        const url = new URL(window.location.href);
        url.searchParams.set('loginState', 'signedIn');
        window.location.href = url.toString();
      } else {
        window.location.href = '/new?onboarding=true&loginState=signedIn';
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
