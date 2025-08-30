import { api } from '@/lib/api';

const allowedNewUserRedirections = ['/signup', '/new/sponsor'];

interface CreateUserResponse {
  message: string;
  created: boolean;
}

export async function handleUserCreation(email: string): Promise<boolean> {
  try {
    const referralCode = (() => {
      try {
        const path = window.location?.pathname || '';
        const match = path.match(/^\/r\/([^/?#]+)/i);
        const codeFromPath = match?.[1];
        return codeFromPath ? codeFromPath.toUpperCase() : undefined;
      } catch {
        return undefined;
      }
    })();
    const response = await api.post<CreateUserResponse>('/api/user/create', {
      email,
      referralCode,
    });

    const { created } = response.data;

    if (created) {
      console.log('window.location.pathname', window.location.pathname);
      if (
        allowedNewUserRedirections?.some((s) =>
          window.location.pathname.startsWith(s),
        )
      ) {
        window.location.reload();
      } else {
        const isOnReferralPage =
          window.location.pathname.startsWith('/r/') ||
          window.location.pathname.startsWith('/new/talent');

        window.location.href = isOnReferralPage
          ? '/new/talent?onboarding=true&referral=true'
          : '/new?onboarding=true';
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
