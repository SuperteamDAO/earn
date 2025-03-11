import { api } from '@/lib/api';

const allowedNewUserRedirections = ['/signup', '/new/sponsor'];

export async function handleUserCreation(email: string): Promise<boolean> {
  try {
    let userExists = false;

    try {
      await api.get(`/api/user/exists?email=${encodeURIComponent(email)}`);
      userExists = true;
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error checking if user exists:', error);
        return false;
      }
    }

    if (!userExists) {
      await api.post('/api/user/create', { email });

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
      return true;
    }
    return userExists;
  } catch (error) {
    console.error('Error handling user creation:', error);
    return false;
  }
}
